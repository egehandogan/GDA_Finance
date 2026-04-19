import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY, GIDER_KAT, KDV, countUp } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Expenses (Giderler) — Full v8-parity module
 * Belge No, Tedarikçi, KDV hesabı, durum, search/filter
 */
export function renderGiderler() {
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-ghost btn-sm" onclick="window._openOCRModal()">📄 OCR ile Tara</button>
    <button class="btn btn-orange" onclick="window._openGiderModal()">+ GİDER EKLE</button>`;

  const fbar = document.getElementById('filter-bar');
  fbar.style.display = 'flex';
  fbar.innerHTML = `
    <div style="display:flex;align-items:center;background:var(--border2);border-radius:6px;padding:0 10px">
      <input type="text" id="ds" placeholder="🔍 Gider veya tedarikçi…" oninput="window._tGider()" style="padding:6px 0;font-size:12px;width:190px;border:none;background:transparent">
    </div>
    <select id="dk" onchange="window._tGider()" style="padding:5px 10px;font-size:12px;border-radius:6px">
      <option value="">Tüm Kategoriler</option>
      ${GIDER_KAT.map(k => `<option>${k}</option>`).join('')}
    </select>
    <select id="dd" onchange="window._tGider()" style="padding:5px 10px;font-size:12px;border-radius:6px">
      <option value="">Tüm Durum</option>
      <option value="odendi">Ödendi</option>
      <option value="bekliyor">Bekliyor</option>
    </select>
    <div class="fb-grow"></div>
    <span id="dc" style="font-size:12px;color:var(--t3);font-weight:600;align-self:center"></span>`;

  const tD = S.giderler.reduce((s, g) => s + g.toplamTutar, 0);
  const kdvD = S.giderler.reduce((s, g) => s + (g.kdvTutar || 0), 0);
  const bekliyor = S.giderler.filter(g => g.durum === 'bekliyor').length;

  document.getElementById('page-body').innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Gider (KDV Dahil)</div><div class="sc-val" style="color:var(--red)" data-count="${tD}">—</div></div>
      <div class="sc"><div class="sc-label">İndirilebilir KDV</div><div class="sc-val" style="color:var(--blue)" data-count="${kdvD}">—</div></div>
      <div class="sc"><div class="sc-label">Kayıt Sayısı</div><div class="sc-val">${S.giderler.length}</div></div>
      <div class="sc"><div class="sc-label">Bekleyen Ödemeler</div><div class="sc-val" style="color:var(--orange)">${bekliyor}</div></div>
    </div>
    <div class="card anim d1"><div class="tbl-wrap">
      <table>
        <thead><tr>
          <th>Tarih</th><th>Belge No</th><th>Tedarikçi</th><th>Kategori</th><th>Açıklama</th>
          <th class="tr">KDV %</th><th class="tr">KDV</th><th class="tr">Toplam</th><th>Durum</th><th></th>
        </tr></thead>
        <tbody id="d-tbody"></tbody>
      </table>
    </div></div>`;

  setTimeout(() => {
    document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count));
    window._tGider();
  }, 50);
}

window._tGider = function() {
  const q = (document.getElementById('ds')?.value || '').toLowerCase();
  const kat = document.getElementById('dk')?.value || '';
  const dur = document.getElementById('dd')?.value || '';
  let rows = [...S.giderler].sort((a, b) => b.tarih.localeCompare(a.tarih));
  if (q) rows = rows.filter(g => (g.aciklama || '').toLowerCase().includes(q) || (g.tedarikci || '').toLowerCase().includes(q) || (g.belgeNo || '').toLowerCase().includes(q));
  if (kat) rows = rows.filter(g => g.kategori === kat);
  if (dur) rows = rows.filter(g => g.durum === dur);
  const c = document.getElementById('dc'); if (c) c.textContent = `${rows.length} kayıt`;
  const tb = document.getElementById('d-tbody'); if (!tb) return;
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:60px;color:var(--t3)">
      <div style="font-size:36px;margin-bottom:12px">📋</div>
      <div style="font-size:14px;font-weight:700;color:var(--t1);margin-bottom:8px">Gider kaydı bulunamadı</div>
      <button class="btn btn-orange btn-sm" onclick="window._openGiderModal()" style="margin-top:6px">+ GİDER EKLE</button>
    </td></tr>`;
    return;
  }
  tb.innerHTML = rows.map(g => `<tr>
    <td style="font-size:11.5px;color:var(--t2);white-space:nowrap">${DT(g.tarih)}</td>
    <td style="font-size:11.5px;color:var(--t3);font-family:monospace">${g.belgeNo || '—'}</td>
    <td style="font-weight:500">${g.tedarikci || '—'}</td>
    <td><span class="badge bg-amber">${g.kategori}</span></td>
    <td style="color:var(--t2);font-size:12.5px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.aciklama || '—'}</td>
    <td class="tr" style="color:var(--t3);font-size:12px">%${g.kdvOrani ?? 20}</td>
    <td class="tr mono" style="color:var(--t2);font-size:12px">${TL(g.kdvTutar || 0)}</td>
    <td class="tr mono" style="font-weight:700;color:var(--red)">${TL(g.toplamTutar)}</td>
    <td><span class="badge ${g.durum === 'odendi' ? 'bg-green' : 'bg-amber'}">${g.durum === 'odendi' ? 'Ödendi' : 'Bekliyor'}</span></td>
    <td style="white-space:nowrap">
      ${g.durum !== 'odendi' ? `<button class="btn btn-orange btn-xs" style="margin-right:3px" onclick="window._giderOdendi('${g.id}')">Ödendi</button>` : ''}
      <button class="btn btn-danger-soft btn-xs" onclick="window._delGider('${g.id}')">Sil</button>
    </td>
  </tr>`).join('');
};

// ── Gider Modal ────────────────────────────────────────────────────────────────
window._openGiderModal = function() {
  const defKdv = S.settings?.vergi?.varsayilanKdv ?? 20;
  showModal(`<div class="modal-hdr">
    <div class="modal-title">Gider Ekle</div>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div class="modal-body">
    <div style="margin-bottom:14px">
      <label style="display:block;margin-bottom:6px">Belge / Fatura Yükle</label>
      <div class="file-drop" id="gider-drop" onclick="document.getElementById('gider-file').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="event.preventDefault();this.classList.remove('drag');window._handleGiderFile(event.dataTransfer.files[0])">
        <div style="font-size:24px;margin-bottom:6px">📎</div>
        <div style="font-weight:700;font-size:12px;letter-spacing:.5px">BELGE EKLE</div>
        <div style="font-size:11px;color:var(--t3);margin-top:3px">Sürükle bırak veya tıkla · PNG · JPG · PDF</div>
      </div>
      <input type="file" id="gider-file" accept="image/*,application/pdf" style="display:none" onchange="window._handleGiderFile(this.files[0])">
      <div id="gider-file-preview" style="display:none;margin-top:8px;font-size:12px;color:var(--green);padding:8px;background:var(--green-50);border-radius:6px"></div>
    </div>
    <div style="border-top:1px solid var(--border);margin:14px 0"></div>
    <div class="form-grid c2" style="margin-bottom:12px">
      <div class="fg"><label>Tarih *</label><input type="date" id="f-t" value="${TODAY()}"></div>
      <div class="fg"><label>Tedarikçi</label><input type="text" id="f-ted" placeholder="Tedarikçi / Satıcı adı"></div>
    </div>
    <div class="form-grid c2" style="margin-bottom:12px">
      <div class="fg"><label>Kategori *</label>
        <select id="f-k">${GIDER_KAT.map(k => `<option>${k}</option>`).join('')}</select>
      </div>
      <div class="fg"><label>KDV Oranı</label>
        <select id="f-v">${KDV.map(r => `<option value="${r}" ${r === defKdv ? 'selected' : ''}>${r === 0 ? "KDV'siz" : '%' + r}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-grid c2" style="margin-bottom:12px">
      <div class="fg"><label>Net Tutar (₺) *</label><input type="number" id="f-tu" min="0" step="0.01" oninput="window._calcGider()" placeholder="0.00"></div>
      <div class="fg"><label>Durum</label>
        <select id="f-d"><option value="odendi">Ödendi</option><option value="bekliyor">Bekliyor</option></select>
      </div>
    </div>
    <div class="fg" style="margin-bottom:14px"><label>Açıklama</label><input type="text" id="f-a" placeholder="İşlem açıklaması…"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:var(--bg);border-radius:var(--r);padding:12px 14px">
      <div style="text-align:center"><div style="font-size:10px;text-transform:uppercase;color:var(--t3);letter-spacing:.5px;margin-bottom:4px">Net</div><div id="cn" style="font-weight:700;font-size:14px">—</div></div>
      <div style="text-align:center"><div style="font-size:10px;text-transform:uppercase;color:var(--t3);letter-spacing:.5px;margin-bottom:4px">KDV</div><div id="ck" style="font-weight:700;font-size:14px;color:var(--blue)">—</div></div>
      <div style="text-align:center"><div style="font-size:10px;text-transform:uppercase;color:var(--t3);letter-spacing:.5px;margin-bottom:4px">Toplam</div><div id="ct" style="font-weight:800;font-size:16px;color:var(--red)">—</div></div>
    </div>
  </div>
  <div class="modal-ftr">
    <button class="btn btn-ghost" onclick="window.closeModal()">İptal</button>
    <button class="btn btn-orange" onclick="window._saveGider()">Kaydet</button>
  </div>`, true);
};

window._calcGider = function() {
  const tutar = parseFloat(document.getElementById('f-tu')?.value) || 0;
  const kdvOrani = parseFloat(document.getElementById('f-v')?.value) || 0;
  const kdv = Math.round(tutar * kdvOrani / 100 * 100) / 100;
  const toplam = tutar + kdv;
  const cn = document.getElementById('cn'); if (cn) cn.textContent = TL(tutar);
  const ck = document.getElementById('ck'); if (ck) ck.textContent = TL(kdv);
  const ct = document.getElementById('ct'); if (ct) ct.textContent = TL(toplam);
};

window._handleGiderFile = function(file) {
  if (!file) return;
  const prev = document.getElementById('gider-file-preview');
  if (prev) { prev.style.display = 'block'; prev.textContent = `✓ ${file.name} seçildi`; }
};

window._saveGider = function() {
  const tutar = parseFloat(document.getElementById('f-tu')?.value) || 0;
  if (!tutar) { toast('Tutar giriniz', 'warn'); return; }
  const kdvOrani = parseFloat(document.getElementById('f-v')?.value) || 0;
  const kdvTutar = Math.round(tutar * kdvOrani / 100 * 100) / 100;
  S.giderler.push({
    id: uid(),
    tarih: document.getElementById('f-t')?.value || TODAY(),
    kategori: document.getElementById('f-k')?.value || 'Diğer',
    aciklama: document.getElementById('f-a')?.value || document.getElementById('f-k')?.value,
    tedarikci: document.getElementById('f-ted')?.value || '—',
    tutar, kdvOrani, kdvTutar,
    toplamTutar: Math.round((tutar + kdvTutar) * 100) / 100,
    durum: document.getElementById('f-d')?.value || 'odendi',
    belgeNo: `GID-${Date.now()}`
  });
  saveStore(); closeModal(); renderGiderler(); toast('Gider kaydedildi ✓');
};

window._giderOdendi = function(id) {
  const g = S.giderler.find(x => x.id === id);
  if (g) { g.durum = 'odendi'; saveStore(); window._tGider(); toast('Güncellendi ✓'); }
};

window._delGider = function(id) {
  confirmDlg('Gider silinecek', 'Bu gider kaydı kalıcı olarak silinecek.', 'danger', () => {
    S.giderler = S.giderler.filter(g => g.id !== id); saveStore(); renderGiderler(); toast('Silindi', 'warn');
  });
};

// ── OCR Simülatör ────────────────────────────────────────────────────────────
window._openOCRModal = function() {
  showModal(`<div class="modal-hdr">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:32px;height:32px;border-radius:8px;background:var(--blue-50);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:15px">🔍</div>
      <div class="modal-title">GDA Vision OCR</div>
    </div>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div class="modal-body">
    <div class="file-drop" id="ocr-drop" onclick="document.getElementById('ocr-input').click()">
      <div style="font-size:40px;margin-bottom:10px">📄</div>
      <div style="font-weight:700;font-size:13px">Fatura / Fiş Fotoğrafını Buraya Bırakın</div>
      <div style="font-size:12px;color:var(--t3);margin-top:5px">veya tıklayarak bilgisayarınızdan seçin</div>
    </div>
    <input type="file" id="ocr-input" style="display:none" accept="image/*" onchange="window._simOCR()">
    <div id="ocr-status-box" style="display:none;align-items:center;gap:10px;padding:14px;background:var(--blue-50);border-radius:var(--r);margin-top:12px">
      <span style="width:16px;height:16px;border:2px solid var(--blue);border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0;display:block"></span>
      <span style="font-size:13px;color:var(--blue);font-weight:600">GDA Vision yapay zekası taranıyor…</span>
    </div>
    <div id="ocr-result-box" style="display:none;margin-top:14px">
      <div style="font-size:11.5px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Algılanan Veriler</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:var(--green-50);border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:10px;color:var(--t3);text-transform:uppercase">TARİH</div><div id="ocr-res-date" style="font-weight:700;margin-top:2px">${TODAY()}</div></div>
          <span style="font-size:10px;font-weight:700;color:var(--green);background:#fff;padding:2px 6px;border-radius:4px">%98</span>
        </div>
        <div style="background:var(--green-50);border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:10px;color:var(--t3);text-transform:uppercase">TUTAR</div><div id="ocr-res-total" style="font-weight:700;margin-top:2px">₺1.250,50</div></div>
          <span style="font-size:10px;font-weight:700;color:var(--green);background:#fff;padding:2px 6px;border-radius:4px">%99</span>
        </div>
      </div>
      <button class="btn btn-orange" style="width:100%;margin-top:14px;justify-content:center" onclick="window._applyOCR()">GİDER OLARAK KAYDET</button>
    </div>
  </div>`);
};

window._simOCR = function() {
  document.getElementById('ocr-drop').style.display = 'none';
  const sb = document.getElementById('ocr-status-box'); if (sb) sb.style.display = 'flex';
  setTimeout(() => {
    const sb2 = document.getElementById('ocr-status-box'); if (sb2) sb2.style.display = 'none';
    const rb = document.getElementById('ocr-result-box'); if (rb) rb.style.display = 'block';
    toast('Yapay zeka belgeyi başarıyla okudu ✓');
  }, 1800);
};

window._applyOCR = function() {
  S.giderler.push({ id: uid(), tarih: TODAY(), kategori: 'Hizmet & Diğer', aciklama: 'OCR Taranmış Belge', tedarikci: 'Çeşitli', tutar: 1250.50, kdvOrani: 20, kdvTutar: 250.10, toplamTutar: 1500.60, durum: 'odendi', belgeNo: `GID-OCR-${Date.now()}` });
  saveStore(); closeModal(); renderGiderler(); toast('OCR belgesi giderlere eklendi ✓');
};

// ── Export for router ─────────────────────────────────────────────────────────
export function renderExpenses() { renderGiderler(); }
