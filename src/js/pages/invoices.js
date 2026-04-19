import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';
import { navigate } from '../core/router.js';

/**
 * Invoices Module
 * Handles Invoice Listing, Editor (Designer), and Printing.
 */

// --- LISTING ---
export function renderFaturalar() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `<button class="btn btn-orange" onclick="navigate('fatura-edit')">YENİ TASARIM / FATURA</button>`;
  }

  const bekTop = S.faturalar.filter(f => f.durum !== 'odendi').reduce((s, f) => s + f.toplam, 0);

  pb.innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Fatura</div><div class="sc-val">${S.faturalar.length}</div></div>
      <div class="sc"><div class="sc-label">Bekleyen Tahsilat</div><div class="sc-val" style="color:var(--orange)">${TL(bekTop)}</div></div>
    </div>

    <div class="card anim d1">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr><th>Fatura No</th><th>Müşteri</th><th>Tarih</th><th>Vade</th><th class="tr">Toplam</th><th>Durum</th><th></th></tr>
          </thead>
          <tbody>
            ${S.faturalar.length === 0 ? `<tr><td colspan="7" class="tc" style="padding:40px;color:var(--t3)">Fatura kaydı bulunamadı.</td></tr>` : 
              S.faturalar.map(f => `
                <tr>
                  <td style="font-weight:700">${f.no}</td>
                  <td>${S.musteriler.find(m => m.id === f.musteri)?.sirketAd || '—'}</td>
                  <td>${DT(f.tarih)}</td>
                  <td>${DT(f.vade)}</td>
                  <td class="tr mono" style="font-weight:700">${TL(f.toplam)}</td>
                  <td><span class="badge ${f.durum === 'odendi' ? 'bg-green' : f.durum === 'gecikti' ? 'bg-red' : 'bg-amber'}">${f.durum.toUpperCase()}</span></td>
                  <td class="tr">
                    <button class="btn btn-light btn-xs" onclick="navigate('fatura-print', '${f.id}')">YAZDIR</button>
                    ${f.durum !== 'odendi' ? `<button class="btn btn-blue btn-xs" onclick="markAsPaid('${f.id}')">ÖDENDİ</button>` : ''}
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

// --- EDITOR / DESIGNER ---
export function renderFaturaEdit() {
  const pb = document.getElementById('page-body');
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-ghost" onclick="navigate('faturalar')">İptal</button>
    <button class="btn btn-orange" onclick="saveDesign()">TASARIMI KAYDET</button>
  `;

  const activeT = S.invoiceTemplates.find(t => t.id === S.activeTemplateId) || S.invoiceTemplates[0];

  pb.innerHTML = `
    <div class="editor-wrap anim">
      <div class="editor-sidebar">
        <div class="fg">
          <label>Şablon Seçimi</label>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${S.invoiceTemplates.map(t => `
              <div class="template-card ${t.id === S.activeTemplateId ? 'active' : ''}" onclick="window.switchTemplate('${t.id}')">
                <div class="template-dot" style="background:${t.color}"></div>
                <div style="font-size:12.5px;font-weight:600">${t.name}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="hdivider"></div>

        <div class="fg">
          <label>Marka Rengi</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${['#2563eb', '#334155', '#18181b', '#6366f1', '#ec4899', '#f97316', '#10b981', '#dc2626'].map(c => `
              <div class="color-swatch ${activeT.color === c ? 'active' : ''}" style="background:${c}" onclick="window.updateColor('${c}')"></div>
            `).join('')}
          </div>
        </div>

        <div class="fg">
          <label>Yazı Tipi</label>
          <select onchange="window.updateFont(this.value)">
            <option value="Inter" ${activeT.font === 'Inter' ? 'selected' : ''}>Inter</option>
            <option value="Outfit" ${activeT.font === 'Outfit' ? 'selected' : ''}>Outfit</option>
            <option value="Roboto" ${activeT.font === 'Roboto' ? 'selected' : ''}>Roboto</option>
          </select>
        </div>

        <div class="fg">
          <label>Köşe Yumuşaklığı</label>
          <input type="range" min="0" max="30" value="${parseInt(activeT.radius) || 0}" oninput="window.updateRadius(this.value)">
        </div>
      </div>

      <div class="editor-preview">
        <div id="invoice-preview-host">
          ${renderInvoicePreview(activeT)}
        </div>
      </div>
    </div>
  `;

  // Internal helpers for the editor
  window.switchTemplate = (id) => {
    S.activeTemplateId = id;
    renderFaturaEdit();
  };
  window.updateColor = (c) => {
    activeT.color = c;
    renderFaturaEdit();
  };
  window.updateFont = (f) => {
    activeT.font = f;
    renderFaturaEdit();
  };
  window.updateRadius = (r) => {
    activeT.radius = r + 'px';
    renderFaturaEdit();
  }
}

function renderInvoicePreview(t) {
  const sirket = S.settings.sirket;
  return `
    <div class="invoice-page anim-scale" style="--primary-color: ${t.color}; font-family: '${t.font}', sans-serif; border-radius: ${t.radius}">
      <div class="inv-header ${t.layout.header}">
        <div class="inv-logo">
          <div class="inv-logo-mark" style="background:${t.color}">G</div>
          <div>
            <div class="inv-logo-name">${sirket.ad}</div>
            <div class="inv-logo-sub">${sirket.ilce}, ${sirket.il}</div>
          </div>
        </div>
        <div class="inv-meta">
          <div class="inv-no">FAT20260001</div>
          <div class="inv-date">Tarih: ${DT(TODAY())}</div>
        </div>
      </div>

      <div class="inv-parties ${t.layout.parties}">
        <div>
          <div class="inv-party-label">GÖNDEREN</div>
          <div class="inv-party-name">${sirket.ad}</div>
          <div class="inv-party-detail">
            VKN: ${sirket.vkn}<br>
            ${sirket.adres}
          </div>
        </div>
        <div>
          <div class="inv-party-label">ALICI</div>
          <div class="inv-party-name">Örnek Müşteri Ltd.</div>
          <div class="inv-party-detail">
            Vergi No: 9876543210<br>
            Beşiktaş, İstanbul
          </div>
        </div>
      </div>

      <table class="inv-table ${t.layout.table}">
        <thead>
          <tr><th>Açıklama</th><th class="tr">Miktar</th><th class="tr">Birim Fiyat</th><th class="tr">Toplam</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Yazılım Geliştirme Hizmeti</td>
            <td class="tr">1 Adet</td>
            <td class="tr">${TL(15000)}</td>
            <td class="tr">${TL(15000)}</td>
          </tr>
        </tbody>
      </table>

      <div class="inv-totals ${t.layout.summary}">
        <div class="inv-total-row">
          <div class="inv-total-label">Ara Toplam</div>
          <div class="inv-total-val">${TL(15000)}</div>
        </div>
        <div class="inv-total-row">
          <div class="inv-total-label">KDV (%20)</div>
          <div class="inv-total-val">${TL(3000)}</div>
        </div>
        <div class="inv-total-row grand">
          <div class="inv-total-label">GENEL TOPLAM</div>
          <div class="inv-total-val">${TL(18000)}</div>
        </div>
      </div>

      <div class="inv-footer">
        <div class="inv-notes">
          Bu fatura GDA Finance sistemi üzerinden oluşturulmuştur.
          Ödemelerinizi TR00... nolu IBAN adresine yapabilirsiniz.
        </div>
        <div class="inv-stamp">GDA KURUMSAL<br>ONAYLANDI</div>
      </div>
    </div>
  `;
}

window.saveDesign = () => {
  saveStore();
  toast('Tasarım başarıyla kaydedildi ✓');
  navigate('faturalar');
};

window.markAsPaid = (id) => {
  confirmDlg('Fatura Ödendi', 'Faturayı ödendi olarak işaretlemek üzeresiniz. Emin misiniz?', 'info', () => {
    const f = S.faturalar.find(x => x.id === id);
    if(f) f.durum = 'odendi';
    saveStore();
    renderFaturalar();
    toast('Fatura güncellendi ✓');
  });
};
