import { S, saveStore } from '../core/state.js';
import { TL, uid, hashColor } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Customers (Müşteriler) Module
 */

export function renderCustomers() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `<button class="btn btn-orange" onclick="window.openCariModal()">YENİ CARİ EKLE</button>`;
  }

  const musteriler = S.musteriler || [];

  pb.innerHTML = `
    <div class="mg anim">
      ${musteriler.length === 0 ? `<div style="grid-column:1/-1;text-align:center;padding:100px;color:var(--t3)">Kayıtlı müşteri bulunamadı.</div>` : 
        musteriler.map(m => {
          const totalRev = S.gelirler.filter(g => g.musteri === m.id).reduce((s, g) => s + g.toplamTutar, 0);
          return `
            <div class="mc-card anim-scale">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
                <div class="mc-av" style="background:${m.renk || hashColor(m.sirketAd)}">${m.sirketAd.charAt(0)}</div>
                <button class="btn btn-light btn-xs" onclick="window.openCariModal('${m.id}')">DÜZENLE</button>
              </div>
              <div style="font-weight:700;font-size:15px;color:var(--t1)">${m.sirketAd}</div>
              <div style="font-size:12px;color:var(--t3);margin-top:2px">${m.yetkili || '—'}</div>
              <div class="hdivider" style="margin:12px 0"></div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:1px">TOPLAM GELİR</div>
                <div style="font-weight:700;color:var(--blue)">${TL(totalRev)}</div>
              </div>
            </div>
          `;
        }).join('')
      }
    </div>
  `;
}

window.openCariModal = (id) => {
  const m = id ? S.musteriler.find(x => x.id === id) : null;
  showModal(`
    <div class="modal-hdr"><div class="modal-title">Cari ${m ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>Şirket Adı / Ünvan</label><input type="text" id="m-ad" value="${m?.sirketAd || ''}"></div>
      <div class="form-grid c2">
         <div class="fg"><label>Yetkili</label><input type="text" id="m-yetkili" value="${m?.yetkili || ''}"></div>
         <div class="fg"><label>VKN / TCKN</label><input type="text" id="m-vkn" value="${m?.vkn || ''}"></div>
      </div>
      <div class="form-grid c2">
         <div class="fg"><label>Telefon</label><input type="text" id="m-tel" value="${m?.tel || ''}"></div>
         <div class="fg"><label>E-posta</label><input type="email" id="m-email" value="${m?.email || ''}"></div>
      </div>
      <div class="fg"><label>Adres</label><textarea id="m-adres">${m?.adres || ''}</textarea></div>
    </div>
    <div class="modal-ftr">
      <button class="btn btn-ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn-orange" onclick="window.saveCari('${id || ''}')">Kaydet</button>
    </div>
  `);
};

window.saveCari = (id) => {
  const ad = document.getElementById('m-ad').value;
  if(!ad) { toast('Şirket adı gerekli', 'warn'); return; }

  const data = {
    id: id || uid(),
    sirketAd: ad,
    yetkili: document.getElementById('m-yetkili').value,
    vkn: document.getElementById('m-vkn').value,
    tel: document.getElementById('m-tel').value,
    email: document.getElementById('m-email').value,
    adres: document.getElementById('m-adres').value,
    renk: hashColor(ad)
  };

  if(id) {
    const idx = S.musteriler.findIndex(x => x.id === id);
    S.musteriler[idx] = data;
  } else {
    S.musteriler.push(data);
  }

  saveStore();
  closeModal();
  renderCustomers();
  toast('Müşteri kaydedildi ✓');
};
