import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Expenses (Giderler) Module with OCR Integration
 */

export function renderExpenses() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `
      <button class="btn btn-ghost" onclick="window.openOCRModal()">OCR İLE TARA</button>
      <button class="btn btn-orange" onclick="window.openGiderModal()">YENİ GİDER EKLE</button>
    `;
  }

  const giderler = S.giderler || [];
  const total = giderler.reduce((s, g) => s + g.toplamTutar, 0);

  pb.innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Gider</div><div class="sc-val" style="color:var(--red)">${TL(total)}</div></div>
      <div class="sc"><div class="sc-label">İşlem Sayısı</div><div class="sc-val">${giderler.length}</div></div>
    </div>

    <div class="card anim d1">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr><th>Tarih</th><th>Açıklama / Kategori</th><th>Ödeme Hesabı</th><th class="tr">Tutar</th><th></th></tr>
          </thead>
          <tbody>
            ${giderler.length === 0 ? `<tr><td colspan="5" class="tc" style="padding:40px;color:var(--t3)">Henüz gider kaydı yok.</td></tr>` : 
              [...giderler].reverse().map(g => `
                <tr>
                  <td>${DT(g.tarih)}</td>
                  <td>
                    <div style="font-weight:600">${g.aciklama || g.kategori}</div>
                    <div style="font-size:11px;color:var(--t3)">${g.kategori}</div>
                  </td>
                  <td><span class="badge bg-gray">${g.hesap || 'Kasa'}</span></td>
                  <td class="tr mono" style="font-weight:700;color:var(--red)">${TL(g.toplamTutar)}</td>
                  <td class="tr">
                    <button class="btn btn-light btn-xs" onclick="window.delGider('${g.id}')">SİL</button>
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

window.openGiderModal = () => {
  showModal(`
    <div class="modal-hdr"><div class="modal-title">Yeni Gider Ekle</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-grid c2">
         <div class="fg"><label>Tarih</label><input type="date" id="x-tarih" value="${TODAY()}"></div>
         <div class="fg"><label>Kategori</label><select id="x-kat">
            <option>Ofis Gideri</option><option>Yemek / Gıda</option><option>Ulaşım</option><option>Yazılım / Araçlar</option><option>Diğer</option>
         </select></div>
      </div>
      <div class="fg"><label>Açıklama</label><input type="text" id="x-aciklama" placeholder="Hizmet/Ürün adı..."></div>
      <div class="form-grid c2">
        <div class="fg"><label>Ödeme Hesabı</label><select id="x-hesap">
          ${S.hesaplar.map(h => `<option value="${h.ad}">${h.ad}</option>`).join('')}
        </select></div>
        <div class="fg"><label>Tutar (₺)</label><input type="number" id="x-tutar" placeholder="0.00" step="0.01"></div>
      </div>
    </div>
    <div class="modal-ftr">
      <button class="btn btn-ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn-orange" onclick="window.saveGider()">Kaydet</button>
    </div>
  `);
};

window.saveGider = () => {
  const t = document.getElementById('x-tarih').value;
  const tutar = parseFloat(document.getElementById('x-tutar').value);
  if(!t || isNaN(tutar)) { toast('Lütfen geçerli bilgiler girin', 'warn'); return; }

  S.giderler.push({
    id: uid(),
    tarih: t,
    kategori: document.getElementById('x-kat').value,
    aciklama: document.getElementById('x-aciklama').value,
    hesap: document.getElementById('x-hesap').value,
    toplamTutar: tutar
  });

  saveStore();
  closeModal();
  renderExpenses();
  toast('Gider kaydedildi');
};

window.delGider = (id) => {
  confirmDlg('Gider Silinecek', 'Bu gider kaydı silinecektir. Onaylıyor musunuz?', 'danger', () => {
    S.giderler = S.giderler.filter(g => g.id !== id);
    saveStore();
    renderExpenses();
    toast('Silindi', 'warn');
  });
};

// --- OCR SYSTEM ---
window.openOCRModal = () => {
  showModal(`
    <div class="modal-hdr"><div class="modal-title">GDA Vision OCR</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="file-drop" id="ocr-drop">
        <div class="file-drop-icon">📄</div>
        <div class="file-drop-text"><b>Fatura / Fiş Fotoğrafını Buraya Bırakın</b><br>veya bilgisayarınızdan seçin</div>
        <input type="file" id="ocr-input" style="display:none" accept="image/*">
      </div>
      <div id="ocr-status-box" style="display:none" class="ocr-status scanning">
        <span class="ocr-spin"></span> GDA Vision yapay zekası taranıyor...
      </div>
      <div id="ocr-result-box" style="display:none; margin-top:15px">
        <label>Algılanan Veriler</label>
        <div class="form-grid c2" style="margin-top:8px">
          <div class="ocr-field-card accepted">
             <div style="flex:1"><div style="font-size:10px;color:var(--t3)">TARİH</div><div id="ocr-res-date"><b>2026-04-18</b></div></div>
             <span class="ocr-conf high">%98</span>
          </div>
          <div class="ocr-field-card accepted">
             <div style="flex:1"><div style="font-size:10px;color:var(--t3)">TUTAR</div><div id="ocr-res-total"><b>1.250,50 ₺</b></div></div>
             <span class="ocr-conf high">%99</span>
          </div>
        </div>
        <button class="btn btn-blue" style="width:100%;margin-top:12px" onclick="window.applyOCR()">GİDER OLARAK KAYDET</button>
      </div>
    </div>
  `, 'modal-lg');

  const drop = document.getElementById('ocr-drop');
  drop?.addEventListener('click', () => document.getElementById('ocr-input').click());
  document.getElementById('ocr-input')?.addEventListener('change', window.simulateOCR);
};

window.simulateOCR = () => {
  document.getElementById('ocr-drop').style.display = 'none';
  document.getElementById('ocr-status-box').style.display = 'flex';
  
  setTimeout(() => {
    document.getElementById('ocr-status-box').style.display = 'none';
    document.getElementById('ocr-result-box').style.display = 'block';
    toast('Yapay zeka verileri başarıyla ayrıştırdı ✓');
  }, 1800);
};

window.applyOCR = () => {
  // Hardcoded simulated OCR result conversion to expense
  S.giderler.push({
    id: uid(),
    tarih: '2026-04-18',
    kategori: 'Hizmet / Diğer',
    aciklama: 'OCR Taranmış Belge',
    hesap: 'Ana Kasa',
    toplamTutar: 1250.50
  });
  saveStore();
  closeModal();
  renderExpenses();
  toast('OCR belgesi giderlere eklendi ✓');
};
