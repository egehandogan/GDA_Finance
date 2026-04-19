import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Income (Gelirler) Module
 */

export function renderGelirler() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `<button class="btn btn-orange" onclick="window.openGelirModal()">YENİ GELİR EKLE</button>`;
  }

  const gelirler = S.gelirler || [];
  const total = gelirler.reduce((s, g) => s + g.toplamTutar, 0);

  pb.innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Gelir</div><div class="sc-val" style="color:var(--green)">${TL(total)}</div></div>
      <div class="sc"><div class="sc-label">İşlem Sayısı</div><div class="sc-val">${gelirler.length}</div></div>
    </div>

    <div class="card anim d1">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr><th>Tarih</th><th>Müşteri / Açıklama</th><th>Kategori</th><th class="tr">Tutar</th><th></th></tr>
          </thead>
          <tbody>
            ${gelirler.length === 0 ? `<tr><td colspan="5" class="tc" style="padding:40px;color:var(--t3)">Henüz gelir kaydı yok.</td></tr>` : 
              [...gelirler].reverse().map(g => `
                <tr>
                  <td>${DT(g.tarih)}</td>
                  <td>
                    <div style="font-weight:600">${g.aciklama || S.musteriler.find(m => m.id === g.musteri)?.sirketAd || '—'}</div>
                    <div style="font-size:11px;color:var(--t3)">${g.kanal || 'Doğrudan'}</div>
                  </td>
                  <td><span class="badge bg-green">${g.kategori}</span></td>
                  <td class="tr mono" style="font-weight:700;color:var(--green)">${TL(g.toplamTutar)}</td>
                  <td class="tr">
                    <button class="btn btn-light btn-xs" onclick="window.delGelir('${g.id}')">SİL</button>
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

window.openGelirModal = () => {
  showModal(`
    <div class="modal-hdr"><div class="modal-title">Yeni Gelir Ekle</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-grid c2">
         <div class="fg"><label>Tarih</label><input type="date" id="g-tarih" value="${TODAY()}"></div>
         <div class="fg"><label>Kategori</label><select id="g-kat">
            <option>Satış Geliri</option><option>Hizmet Geliri</option><option>Faiz Geliri</option><option>Diğer</option>
         </select></div>
      </div>
      <div class="fg"><label>Müşteri</label><select id="g-mus">
        <option value="">— Seçilmedi —</option>
        ${S.musteriler.map(m => `<option value="${m.id}">${m.sirketAd}</option>`).join('')}
      </select></div>
      <div class="fg"><label>Açıklama</label><input type="text" id="g-aciklama" placeholder="İşlem detayı..."></div>
      <div class="fg"><label>Tutar (₺)</label><input type="number" id="g-tutar" placeholder="0.00" step="0.01"></div>
    </div>
    <div class="modal-ftr">
      <button class="btn btn-ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn-orange" onclick="window.saveGelir()">Kaydet</button>
    </div>
  `);
};

window.saveGelir = () => {
  const t = document.getElementById('g-tarih').value;
  const tutar = parseFloat(document.getElementById('g-tutar').value);
  if(!t || isNaN(tutar)) { toast('Lütfen geçerli bilgiler girin', 'warn'); return; }

  S.gelirler.push({
    id: uid(),
    tarih: t,
    kategori: document.getElementById('g-kat').value,
    musteri: document.getElementById('g-mus').value,
    aciklama: document.getElementById('g-aciklama').value,
    toplamTutar: tutar
  });

  saveStore();
  closeModal();
  renderGelirler();
  toast('Gelir kaydedildi ✓');
};

window.delGelir = (id) => {
  confirmDlg('Gelir Silinecek', 'Bu işlem geri alınamaz. Emin misiniz?', 'danger', () => {
    S.gelirler = S.gelirler.filter(g => g.id !== id);
    saveStore();
    renderGelirler();
    toast('Silindi', 'warn');
  });
};
