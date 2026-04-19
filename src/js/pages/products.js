import { S, saveStore } from '../core/state.js';
import { TL, uid } from '../utils/formatters.js';
import { toast, showModal, closeModal } from '../components/ui.js';

/**
 * Products (Ürünler) and Bulk Calculation Module
 */

export function renderProducts() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `
      <button class="btn btn-ghost" onclick="window.navigate('toplu-hesap')">TOPLU HESAP</button>
      <button class="btn btn-orange" onclick="window.openUrunModal()">YENİ ÜRÜN EKLE</button>
    `;
  }

  const urunler = S.urunler || [];

  pb.innerHTML = `
    <div class="card anim">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr><th>Kod</th><th>Ürün / Hizmet Adı</th><th>Kategori</th><th class="tr">Birim Fiyat</th><th>Birim</th><th></th></tr>
          </thead>
          <tbody>
            ${urunler.length === 0 ? `<tr><td colspan="6" class="tc" style="padding:40px;color:var(--t3)">Kayıtlı ürün bulunamadı.</td></tr>` : 
              urunler.map(u => `
                <tr>
                  <td style="font-weight:700;color:var(--t3)">${u.kod}</td>
                  <td style="font-weight:600">${u.ad}</td>
                  <td><span class="badge bg-blue">${u.kategori}</span></td>
                  <td class="tr mono prod-price">${TL(u.birimFiyat)}</td>
                  <td><span class="prod-unit">${u.birim}</span></td>
                  <td class="tr">
                    <button class="btn btn-light btn-xs" onclick="window.openUrunModal('${u.id}')">DÜZENLE</button>
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

export function renderTopluHesap() {
  const pb = document.getElementById('page-body');
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-ghost" onclick="window.navigate('urunler')">Ürünlere Dön</button>
  `;

  pb.innerHTML = `
    <div class="card cp anim" style="max-width:700px;margin:0 auto">
      <div class="ct">Toplu Maliyet / Teklif Hesaplayıcı</div>
      <div id="bulk-items" style="display:flex;flex-direction:column;gap:12px"></div>
      <button class="btn btn-light btn-sm" style="margin-top:15px;width:100%" onclick="window.addBulkRow()">+ YENİ SATIR EKLE</button>
      
      <div class="hdivider"></div>
      
      <div class="th-total-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:12px;color:var(--t3);font-weight:600">GENEL TOPLAM (KDV DAHİL)</div>
            <div class="th-grand" id="bulk-total">${TL(0)}</div>
          </div>
          <button class="btn btn-orange" onclick="toast('Teklif PDF olarak hazırlanıyor...')">TEKLİF OLUŞTUR</button>
        </div>
      </div>
    </div>
  `;
  window.addBulkRow();
}

window.addBulkRow = () => {
  const container = document.getElementById('bulk-items');
  if(!container) return;
  const id = uid();
  const row = document.createElement('div');
  row.className = 'form-grid c3 anim-scale';
  row.id = `row-${id}`;
  row.innerHTML = `
    <div class="fg"><label>Ürün</label><select onchange="window.updateBulk()"><option value="0">— Ürün Seçin —</option>${S.urunler.map(u => `<option value="${u.birimFiyat}">${u.ad}</option>`).join('')}</select></div>
    <div class="fg"><label>Miktar</label><input type="number" value="1" oninput="window.updateBulk()"></div>
    <div class="fg" style="position:relative"><label>İşlem</label><button class="btn btn-danger-soft" style="width:100%" onclick="document.getElementById('row-${id}').remove();window.updateBulk()">SİL</button></div>
  `;
  container.appendChild(row);
  window.updateBulk();
};

window.updateBulk = () => {
  let total = 0;
  const rows = document.getElementById('bulk-items')?.children || [];
  for(let row of rows) {
    const price = parseFloat(row.querySelector('select').value) || 0;
    const qty = parseFloat(row.querySelector('input').value) || 0;
    total += price * qty;
  }
  const el = document.getElementById('bulk-total');
  if(el) el.textContent = TL(total * 1.20); // Inc VAT
};

window.openUrunModal = (id) => {
  const u = id ? S.urunler.find(x => x.id === id) : null;
  showModal(`
    <div class="modal-hdr"><div class="modal-title">Ürün / Hizmet ${u ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-grid c2">
         <div class="fg"><label>Ürün Kodu</label><input type="text" id="u-kod" value="${u?.kod || ''}"></div>
         <div class="fg"><label>Kategori</label><input type="text" id="u-kat" value="${u?.kategori || ''}"></div>
      </div>
      <div class="fg"><label>Ürün Adı</label><input type="text" id="u-ad" value="${u?.ad || ''}"></div>
      <div class="form-grid c2">
         <div class="fg"><label>Birim Fiyat (₺)</label><input type="number" id="u-fiyat" value="${u?.birimFiyat || ''}"></div>
         <div class="fg"><label>Birim</label><select id="u-birim"><option ${u?.birim === 'adet' ? 'selected' : ''}>adet</option><option ${u?.birim === 'saat' ? 'selected' : ''}>saat</option><option ${u?.birim === 'gün' ? 'selected' : ''}>gün</option></select></div>
      </div>
    </div>
    <div class="modal-ftr">
      <button class="btn btn-ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn-orange" onclick="window.saveUrun('${id || ''}')">Kaydet</button>
    </div>
  `);
};

window.saveUrun = (id) => {
  const ad = document.getElementById('u-ad').value;
  if(!ad) return;

  const data = {
    id: id || uid(),
    kod: document.getElementById('u-kod').value,
    ad: ad,
    kategori: document.getElementById('u-kat').value,
    birimFiyat: parseFloat(document.getElementById('u-fiyat').value) || 0,
    birim: document.getElementById('u-birim').value
  };

  if(id) {
    const idx = S.urunler.findIndex(x => x.id === id);
    S.urunler[idx] = data;
  } else {
    S.urunler.push(data);
  }

  saveStore();
  closeModal();
  renderProducts();
  toast('Ürün kaydedildi ✓');
};
