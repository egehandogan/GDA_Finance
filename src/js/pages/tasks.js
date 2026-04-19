import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Tasks / Payment Monitoring (Ödeme Takip) Module
 */

export function renderTasks() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `<button class="btn btn-orange" onclick="window.openOdemeModal()">YENİ ÖDEME EKLE</button>`;
  }

  const odm = S.odemeTakip || [];
  const bekTop = odm.filter(o => o.durum !== 'odendi').reduce((s, o) => s + o.tutar, 0);

  pb.innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Bekleyen Ödemeler</div><div class="sc-val" style="color:var(--orange)">${TL(bekTop)}</div></div>
      <div class="sc"><div class="sc-label">Toplam Kayıt</div><div class="sc-val">${odm.length}</div></div>
    </div>

    <div class="card anim d1">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr><th>Vade</th><th>Açıklama / Alıcı</th><th>Kategori</th><th class="tr">Tutar</th><th>Durum</th><th></th></tr>
          </thead>
          <tbody>
            ${odm.length === 0 ? `<tr><td colspan="6" class="tc" style="padding:40px;color:var(--t3)">Takip listesi boş.</td></tr>` : 
              [...odm].sort((a,b) => a.vade.localeCompare(b.vade)).map(o => `
                <tr class="odm-row ${o.durum === 'gecikti' ? 'gecikti' : 'normal'}">
                  <td>${DT(o.vade)}</td>
                  <td>
                    <div style="font-weight:600">${o.baslik}</div>
                    <div style="font-size:11px;color:var(--t3)">${o.alici || '—'}</div>
                  </td>
                  <td><span class="badge bg-gray">${o.kategori}</span></td>
                  <td class="tr mono" style="font-weight:700">${TL(o.tutar)}</td>
                  <td><span class="badge ${o.durum === 'odendi' ? 'bg-green' : o.durum === 'gecikti' ? 'bg-red' : 'bg-amber'}">${o.durum.toUpperCase()}</span></td>
                  <td class="tr">
                    ${o.durum !== 'odendi' ? `<button class="btn btn-light btn-xs" onclick="window.markTaskPaid('${o.id}')">ÖDENDİ</button>` : ''}
                    <button class="btn btn-light btn-xs" onclick="window.delTask('${o.id}')">SİL</button>
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

window.openOdemeModal = () => {
  showModal(`
    <div class="modal-hdr"><div class="modal-title">Ödeme Takip Ekle</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>Ödeme Başlığı</label><input type="text" id="o-bas" placeholder="Kira, Vergi, Tedarikçi Ödemesi..."></div>
      <div class="form-grid c2">
         <div class="fg"><label>Vade Tarihi</label><input type="date" id="o-tar" value="${TODAY()}"></div>
         <div class="fg"><label>Tutar (₺)</label><input type="number" id="o-tut" placeholder="0.00"></div>
      </div>
      <div class="fg"><label>Alıcı / Kurum</label><input type="text" id="o-alici" placeholder="Kime ödenecek?"></div>
    </div>
    <div class="modal-ftr">
      <button class="btn btn-ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn-orange" onclick="window.saveTask()">Kaydet</button>
    </div>
  `);
};

window.saveTask = () => {
  const b = document.getElementById('o-bas').value;
  const t = parseFloat(document.getElementById('o-tut').value);
  if(!b || isNaN(t)) return;

  S.odemeTakip.push({
    id: uid(),
    baslik: b,
    vade: document.getElementById('o-tar').value,
    tutar: t,
    alici: document.getElementById('o-alici').value,
    kategori: 'Harcama',
    durum: 'bekliyor'
  });

  saveStore();
  closeModal();
  renderTasks();
  toast('Ödeme takvime eklendi ✓');
};

window.markTaskPaid = (id) => {
  const o = S.odemeTakip.find(x => x.id === id);
  if(o) {
    o.durum = 'odendi';
    // Optionally create an expense entry automatically
    S.giderler.push({
      id: uid(),
      tarih: TODAY(),
      kategori: o.kategori,
      aciklama: o.baslik + ' (Ödeme Takibinden)',
      toplamTutar: o.tutar,
      hesap: 'Ana Kasa'
    });
    saveStore();
    renderTasks();
    toast('Ödeme yapıldı ve giderlere eklendi ✓');
  }
};

window.delTask = (id) => {
  confirmDlg('Ödeme Silinecek', 'Takip listesinden kaldırılacaktır. Emin misiniz?', 'danger', () => {
    S.odemeTakip = S.odemeTakip.filter(x => x.id !== id);
    saveStore();
    renderTasks();
    toast('Silindi', 'warn');
  });
};
