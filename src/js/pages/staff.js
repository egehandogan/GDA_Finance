import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, hashColor } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Staff (Personel) Module
 * Handles Personnel management and Salary calculations.
 */

export function renderStaff() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `
      <button class="btn btn-ghost" onclick="window.navigate('maas-hesap')">MAAŞ HESAPLA</button>
      <button class="btn btn-orange" onclick="window.openPersonelModal()">YENİ PERSONEL</button>
    `;
  }

  const personeller = S.personeller || [];
  const activeCount = personeller.filter(p => !p.pasif).length;

  pb.innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Personel</div><div class="sc-val">${personeller.length}</div></div>
      <div class="sc"><div class="sc-label">Aktif</div><div class="sc-val" style="color:var(--green)">${activeCount}</div></div>
    </div>

    <div class="card anim d1">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr><th>Ad Soyad / Unvan</th><th>İletişim</th><th>Durum</th><th class="tr">Net Maaş</th><th></th></tr>
          </thead>
          <tbody>
            ${personeller.length === 0 ? `<tr><td colspan="5" class="tc" style="padding:40px;color:var(--t3)">Henüz personel kaydı yok.</td></tr>` : 
              personeller.map(p => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="pers-av" style="background:${hashColor(p.ad)}">${p.ad.charAt(0)}</div>
                      <div>
                        <div style="font-weight:600">${p.ad}</div>
                        <div style="font-size:11px;color:var(--t3)">${p.unvan}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="font-size:12.5px">${p.email}</div>
                    <div style="font-size:11px;color:var(--t3)">${p.tel}</div>
                  </td>
                  <td><span class="badge ${p.pasif ? 'bg-gray' : 'bg-green'}">${p.pasif ? 'PASİF' : 'AKTİF'}</span></td>
                  <td class="tr mono" style="font-weight:700">${TL(p.maas || 0)}</td>
                  <td class="tr">
                    <button class="btn btn-light btn-xs" onclick="window.openPersonelModal('${p.id}')">DÜZENLE</button>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.openPersonelModal = (id) => {
  const p = id ? S.personeller.find(x => x.id === id) : null;
  showModal(`
    <div class="modal-hdr"><div class="modal-title">Personel ${p ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>Ad Soyad</label><input type="text" id="p-ad" value="${p?.ad || ''}"></div>
      <div class="form-grid c2">
         <div class="fg"><label>Unvan</label><input type="text" id="p-unvan" value="${p?.unvan || ''}"></div>
         <div class="fg"><label>İşe Başlama</label><input type="date" id="p-tarih" value="${p?.giris || ''}"></div>
      </div>
      <div class="form-grid c2">
         <div class="fg"><label>Net Maaş (₺)</label><input type="number" id="p-maas" value="${p?.maas || ''}"></div>
         <div class="fg"><label>E-posta</label><input type="email" id="p-email" value="${p?.email || ''}"></div>
      </div>
      <div class="fg">
        <label class="toggle-row">
          <span class="toggle-label">Aktif Personel</span>
          <div class="toggle"><input type="checkbox" id="p-aktif" ${p?.pasif ? '' : 'checked'}><span class="toggle-slider"></span></div>
        </label>
      </div>
    </div>
    <div class="modal-ftr">
      <button class="btn btn-ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn-orange" onclick="window.savePersonel('${id || ''}')">Kaydet</button>
    </div>
  `);
};

window.savePersonel = (id) => {
  const ad = document.getElementById('p-ad').value;
  if(!ad) { toast('Lütfen ad girin', 'warn'); return; }

  const data = {
    id: id || uid(),
    ad: ad,
    unvan: document.getElementById('p-unvan').value,
    giris: document.getElementById('p-tarih').value,
    maas: parseFloat(document.getElementById('p-maas').value) || 0,
    email: document.getElementById('p-email').value,
    pasif: !document.getElementById('p-aktif').checked
  };

  if(id) {
    const idx = S.personeller.findIndex(x => x.id === id);
    S.personeller[idx] = data;
  } else {
    S.personeller.push(data);
  }

  saveStore();
  closeModal();
  renderStaff();
  toast('Personel kaydedildi ✓');
};

// --- SALARY CALCULATOR ---
export function renderMaasHesap() {
  const pb = document.getElementById('page-body');
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-ghost" onclick="window.navigate('personeller')">Gerid Dön</button>
  `;

  pb.innerHTML = `
    <div class="card anim cp" style="max-width:600px;margin:0 auto">
      <div class="ct">Brüt'ten Net'e Maaş Hesaplama</div>
      <div class="fg">
        <label>Brüt Maaş (₺)</label>
        <input type="number" id="calc-brut" value="40000" oninput="window.doMaasCalc()">
      </div>
      <div class="hdivider"></div>
      <div id="maas-results"></div>
    </div>
  `;
  window.doMaasCalc();
}

window.doMaasCalc = () => {
  const brut = parseFloat(document.getElementById('calc-brut').value) || 0;
  
  // Basic simulated Turkish tax logic from v8
  const sgk = brut * 0.14;
  const issizlik = brut * 0.01;
  const gvMatrah = brut - sgk - issizlik;
  const gv = gvMatrah * 0.15; // Starting bracket
  const damga = brut * 0.00759;
  const net = brut - sgk - issizlik - gv - damga;

  document.getElementById('maas-results').innerHTML = `
    <div class="mh-section">
      <div class="mh-row"><span class="mh-label">Brüt Maaş</span><span class="mh-val">${TL(brut)}</span></div>
      <div class="mh-row kesinti"><span class="mh-label">SGK İşçi (%14)</span><span class="mh-val">-${TL(sgk)}</span></div>
      <div class="mh-row kesinti"><span class="mh-label">İşsizlik (%1)</span><span class="mh-val">-${TL(issizlik)}</span></div>
      <div class="mh-row kesinti"><span class="mh-label">Gelir Vergisi (%15)</span><span class="mh-val">-${TL(gv)}</span></div>
      <div class="mh-row kesinti"><span class="mh-label">Damga Vergisi</span><span class="mh-val">-${TL(damga)}</span></div>
      <div class="mh-row net-row"><span class="mh-label">ELE GEÇEN NET</span><span class="mh-val">${TL(net)}</span></div>
    </div>
  `;
}
