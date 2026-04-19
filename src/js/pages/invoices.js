import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY, KDV } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';
import { navigate } from '../core/router.js';

// ── Fatura Listesi ────────────────────────────────────────────────────────────
export function renderFaturalar() {
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-light btn-sm" onclick="navigate('fatura-edit')">Şablon Tasarımcı</button>
    <button class="btn btn-orange" onclick="window._openYeniFaturaModal()">+ YENİ FATURA</button>`;
  document.getElementById('filter-bar').style.display = 'flex';

  const bekTop = S.faturalar.filter(f => f.durum !== 'odendi').reduce((s, f) => s + f.toplam, 0);
  const odendiTop = S.faturalar.filter(f => f.durum === 'odendi').reduce((s, f) => s + f.toplam, 0);
  const gecikti = S.faturalar.filter(f => f.durum === 'gecikti').length;

  document.getElementById('filter-bar').innerHTML = `
    <select id="fat-filtre" onchange="window._tFatura()" style="padding:5px 10px;font-size:12px;border-radius:6px">
      <option value="">Tüm Durum</option>
      <option value="bekliyor">Bekliyor</option>
      <option value="odendi">Ödendi</option>
      <option value="gecikti">Gecikmiş</option>
    </select>
    <div class="fb-grow"></div>
    ${gecikti > 0 ? `<span style="font-size:12px;color:var(--red);font-weight:600">${gecikti} gecikmiş</span>` : ''}
    <span style="font-size:12px;color:var(--t3);font-weight:600">Bekleyen: ${TL(bekTop)}</span>`;

  document.getElementById('page-body').innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Fatura</div><div class="sc-val">${S.faturalar.length}</div></div>
      <div class="sc"><div class="sc-label">Bekleyen Tahsilat</div><div class="sc-val" style="color:var(--orange)">${TL(bekTop)}</div></div>
      <div class="sc"><div class="sc-label">Tahsil Edilen</div><div class="sc-val" style="color:var(--green)">${TL(odendiTop)}</div></div>
      <div class="sc"><div class="sc-label">Gecikmiş</div><div class="sc-val" style="color:var(--red)">${gecikti}</div></div>
    </div>
    <div class="card anim d1"><div class="tbl-wrap" id="fat-table-wrap"></div></div>`;

  window._tFatura();
}

window._tFatura = function() {
  const filtre = document.getElementById('fat-filtre')?.value || '';
  let rows = [...S.faturalar].sort((a, b) => b.tarih.localeCompare(a.tarih));
  if (filtre) rows = rows.filter(f => f.durum === filtre);
  const el = document.getElementById('fat-table-wrap'); if (!el) return;
  if (!rows.length) {
    el.innerHTML = `<div style="text-align:center;padding:80px;color:var(--t3)"><div style="font-size:40px;margin-bottom:14px">🧾</div><div style="font-size:14px;font-weight:700;color:var(--t1);margin-bottom:8px">Fatura bulunamadı</div><button class="btn btn-orange btn-sm" onclick="window._openYeniFaturaModal()" style="margin-top:4px">+ YENİ FATURA OLUŞTUR</button></div>`;
    return;
  }
  el.innerHTML = `<table>
    <thead><tr>
      <th>Fatura No</th><th>Müşteri</th><th>Tarih</th><th>Vade</th><th style="width:12%">Kalem</th>
      <th class="tr">Ara Toplam</th><th class="tr">KDV</th><th class="tr" style="font-weight:700">Toplam</th>
      <th>Durum</th><th></th>
    </tr></thead>
    <tbody>${rows.map(f => {
      const mus = S.musteriler.find(m => m.id === f.musteri);
      const musName = mus ? (mus.tip === 'kurumsal' ? mus.sirketAd : `${mus.ad} ${mus.soyad}`) : '—';
      const durum = { odendi: { cls: 'bg-green', lbl: 'Ödendi' }, bekliyor: { cls: 'bg-amber', lbl: 'Bekliyor' }, gecikti: { cls: 'bg-red', lbl: 'Gecikmiş' }, iptal: { cls: 'bg-gray', lbl: 'İptal' } }[f.durum] || { cls: 'bg-gray', lbl: f.durum };
      const isGecikmis = f.durum === 'bekliyor' && f.vade && new Date(f.vade) < new Date();
      return `<tr class="${isGecikmis ? 'row-warn' : ''}">
        <td style="font-weight:700;color:var(--blue)">${f.no}</td>
        <td>${musName}</td>
        <td style="font-size:12px;color:var(--t2)">${DT(f.tarih)}</td>
        <td style="font-size:12px;color:${isGecikmis ? 'var(--red)' : 'var(--t2)'};font-weight:${isGecikmis ? '700' : '400'}">${DT(f.vade)}</td>
        <td style="font-size:12px;color:var(--t3)">${(f.kalemler || []).length} kalem</td>
        <td class="tr mono">${TL(f.ara || 0)}</td>
        <td class="tr mono" style="color:var(--t2)">${TL(f.kdv || 0)}</td>
        <td class="tr mono" style="font-weight:700;font-size:14px">${TL(f.toplam || 0)}</td>
        <td><span class="badge ${durum.cls}">${durum.lbl}</span></td>
        <td style="white-space:nowrap">
          <button class="btn btn-light btn-xs" onclick="window._viewFatura('${f.id}')" style="margin-right:3px">Görüntüle</button>
          ${f.durum !== 'odendi' ? `<button class="btn btn-orange btn-xs" onclick="window._markFaturaOdendi('${f.id}')" style="margin-right:3px">Ödendi</button>` : ''}
          <button class="btn btn-danger-soft btn-xs" onclick="window._delFatura('${f.id}')">Sil</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
};

// ── Yeni Fatura Oluşturma ─────────────────────────────────────────────────────
window._openYeniFaturaModal = function(id) {
  const f = id ? S.faturalar.find(x => x.id === id) : null;
  const mus = S.musteriler;
  const defKdv = S.settings?.vergi?.varsayilanKdv ?? 20;
  const fNo = f?.no || `FAT-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;

  showModal(`<div class="modal-hdr">
    <div class="modal-title">${f ? 'Fatura Düzenle' : 'Yeni Fatura Oluştur'}</div>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div class="modal-body">
    <div class="form-grid c3" style="margin-bottom:12px">
      <div class="fg"><label>Fatura No</label><input type="text" id="fn-no" value="${fNo}" placeholder="FAT-2026001"></div>
      <div class="fg"><label>Tarih</label><input type="date" id="fn-tarih" value="${f?.tarih || TODAY()}"></div>
      <div class="fg"><label>Vade Tarihi</label><input type="date" id="fn-vade" value="${f?.vade || new Date(Date.now() + 30*864e5).toISOString().split('T')[0]}"></div>
    </div>
    <div class="form-grid c2" style="margin-bottom:14px">
      <div class="fg"><label>Müşteri</label>
        <select id="fn-musteri">
          <option value="">— Müşteri Seç —</option>
          ${mus.map(m => `<option value="${m.id}" ${f?.musteri === m.id ? 'selected' : ''}>${m.tip === 'kurumsal' ? m.sirketAd : `${m.ad} ${m.soyad}`}</option>`).join('')}
        </select>
      </div>
      <div class="fg"><label>Durum</label>
        <select id="fn-durum">
          <option value="bekliyor" ${!f || f.durum === 'bekliyor' ? 'selected' : ''}>Bekliyor</option>
          <option value="odendi" ${f?.durum === 'odendi' ? 'selected' : ''}>Ödendi</option>
          <option value="gecikti" ${f?.durum === 'gecikti' ? 'selected' : ''}>Gecikmiş</option>
        </select>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-size:11.5px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px">Fatura Kalemleri</div>
      <div style="display:flex;gap:6px">
        ${S.urunler.length ? `<button class="btn btn-ghost btn-xs" onclick="window._fatKatalogEkle()">Katalogdan Ekle</button>` : ''}
        <button class="btn btn-orange btn-xs" onclick="window._addFatRow()">+ Satır Ekle</button>
      </div>
    </div>
    <div style="overflow-x:auto;margin-bottom:12px">
      <table style="width:100%;border-collapse:collapse;font-size:12.5px" id="fn-items">
        <thead><tr style="background:var(--bg)">
          <th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:700;color:var(--t3)">AÇIKLAMA</th>
          <th style="padding:6px 4px;font-size:10px;font-weight:700;color:var(--t3);width:60px">MKT</th>
          <th style="padding:6px 4px;font-size:10px;font-weight:700;color:var(--t3);width:110px">BİRİM FİYAT</th>
          <th style="padding:6px 4px;font-size:10px;font-weight:700;color:var(--t3);width:65px">KDV %</th>
          <th style="padding:6px 4px;font-size:10px;font-weight:700;color:var(--t3);width:110px;text-align:right">TUTAR</th>
          <th style="width:22px"></th>
        </tr></thead>
        <tbody id="fn-tbody"></tbody>
      </table>
    </div>

    <div id="fn-ozet" style="display:flex;justify-content:flex-end">
      <div style="width:260px;font-size:12.5px;display:flex;flex-direction:column;gap:4px;background:var(--bg);border-radius:var(--r);padding:12px 14px">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--t2)">Ara Toplam</span><span id="fn-ara" class="mono">—</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--t2)">KDV</span><span id="fn-kdv" class="mono">—</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:4px;border-top:1px solid var(--border)"><span style="font-weight:700;font-size:14px">Genel Toplam</span><span id="fn-top" class="mono" style="font-weight:800;font-size:16px;color:var(--blue)">—</span></div>
      </div>
    </div>

    <div class="fg" style="margin-top:12px"><label>Not</label><input type="text" id="fn-not" value="${f?.not || ''}" placeholder="Ödeme bilgisi veya açıklama…"></div>
  </div>
  <div class="modal-ftr">
    <button class="btn btn-ghost" onclick="window.closeModal()">İptal</button>
    ${f ? `<button class="btn btn-danger-soft btn-sm" onclick="window._delFatura('${f.id}')">Sil</button>` : ''}
    <button class="btn btn-orange" onclick="window._saveFatura('${id || ''}')">Faturayı Kaydet</button>
  </div>`, true);

  // Populate existing rows
  const rows = f?.kalemler || [];
  if (rows.length) rows.forEach(k => window._addFatRow(k));
  else window._addFatRow();
  window._calcFatOzet();
};

window._addFatRow = function(kalem) {
  const defKdv = S.settings?.vergi?.varsayilanKdv ?? 20;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="padding:3px">
      ${S.urunler.length ? `<select class="fat-prod-sel" onchange="window._fatProdSel(this)" style="font-size:11.5px;padding:4px 6px;border-radius:6px;width:100%;margin-bottom:3px"><option value="">— Ürün Seç / Manuel —</option>${S.urunler.map(p => `<option value="${p.id}">[${p.kod}] ${p.ad}</option>`).join('')}</select>` : ''}
      <input type="text" class="fat-ac" style="width:100%;padding:5px 7px;font-size:12px;border-radius:6px" placeholder="Açıklama…" value="${kalem?.aciklama || ''}" oninput="window._calcFatOzet()">
    </td>
    <td style="padding:3px"><input type="number" class="fat-mkt" value="${kalem?.miktar || 1}" min="0" step="1" style="width:100%;padding:5px 4px;text-align:right;font-size:12px;border-radius:6px" oninput="window._calcFatOzet()"></td>
    <td style="padding:3px"><input type="number" class="fat-fiy" value="${kalem?.fiyat || ''}" min="0" step="0.01" style="width:100%;padding:5px 7px;text-align:right;font-size:12px;border-radius:6px" placeholder="0.00" oninput="window._calcFatOzet()"></td>
    <td style="padding:3px"><select class="fat-kdv" onchange="window._calcFatOzet()" style="width:100%;padding:5px 4px;font-size:12px;border-radius:6px">${KDV.map(r => `<option value="${r}" ${(kalem?.kdv ?? defKdv) === r ? 'selected' : ''}>${r === 0 ? '0' : '%' + r}</option>`).join('')}</select></td>
    <td class="fat-tot" style="text-align:right;font-size:12.5px;font-weight:600;padding:3px 6px;white-space:nowrap">—</td>
    <td style="padding:3px"><button onclick="this.closest('tr').remove();window._calcFatOzet()" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:16px;padding:0 4px">×</button></td>`;
  document.getElementById('fn-tbody')?.appendChild(tr);
};

window._fatProdSel = function(sel) {
  const p = S.urunler.find(u => u.id === sel.value); if (!p) return;
  const row = sel.closest('tr');
  row.querySelector('.fat-ac').value = p.ad;
  row.querySelector('.fat-fiy').value = p.birimFiyat;
  for (const opt of row.querySelector('.fat-kdv').options) { if (parseFloat(opt.value) === p.kdvOrani) { opt.selected = true; break; } }
  window._calcFatOzet();
};

window._fatKatalogEkle = function() {
  showModal(`<div class="modal-hdr"><div class="modal-title">Katalogdan Kalem Ekle</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <input type="text" placeholder="🔍 Ürün ara…" oninput="this.nextElementSibling.querySelectorAll('[data-pid]').forEach(d=>d.style.display=d.textContent.toLowerCase().includes(this.value.toLowerCase())?'':'none')" style="width:100%;margin-bottom:10px">
    <div style="display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto">
      ${S.urunler.map(p => `<div data-pid="${p.id}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;cursor:pointer" onclick="window._fatCatAdd('${p.id}')">
        <div style="flex:1"><div style="font-weight:600">${p.ad}</div><div style="font-size:11px;color:var(--t3)">[${p.kod}] · ${p.kategori} · ${p.birim}</div></div>
        <div style="text-align:right"><div style="font-weight:700;color:var(--blue)">${TL(p.birimFiyat)}</div><div style="font-size:10.5px;color:var(--t3)">%${p.kdvOrani} KDV</div></div>
        <button class="btn btn-orange btn-xs" onclick="event.stopPropagation();window._fatCatAdd('${p.id}')">Ekle</button>
      </div>`).join('')}
    </div>
  </div>`);
};
window._fatCatAdd = function(pid) {
  const p = S.urunler.find(u => u.id === pid); if (!p) return;
  closeModal();
  // Re-open the fatura modal note: we just add a row
  window._addFatRow({ aciklama: p.ad, miktar: 1, fiyat: p.birimFiyat, kdv: p.kdvOrani });
  window._calcFatOzet();
  toast(`"${p.ad}" eklendi`);
};

window._calcFatOzet = function() {
  let ara = 0, kdvTop = 0;
  document.querySelectorAll('#fn-tbody tr').forEach(tr => {
    const mkt = parseFloat(tr.querySelector('.fat-mkt')?.value) || 0;
    const fiy = parseFloat(tr.querySelector('.fat-fiy')?.value) || 0;
    const kdv = parseFloat(tr.querySelector('.fat-kdv')?.value) || 0;
    const sat = mkt * fiy;
    const kdvTutar = sat * kdv / 100;
    ara += sat; kdvTop += kdvTutar;
    const el = tr.querySelector('.fat-tot'); if (el) el.textContent = TL(sat + kdvTutar);
  });
  const el_ara = document.getElementById('fn-ara'); if (el_ara) el_ara.textContent = TL(ara);
  const el_kdv = document.getElementById('fn-kdv'); if (el_kdv) el_kdv.textContent = TL(kdvTop);
  const el_top = document.getElementById('fn-top'); if (el_top) el_top.textContent = TL(ara + kdvTop);
};

window._saveFatura = function(id) {
  const no = document.getElementById('fn-no')?.value.trim();
  const musteri = document.getElementById('fn-musteri')?.value || '';
  if (!no) { toast('Fatura no gerekli', 'warn'); return; }
  const kalemler = [];
  let ara = 0, kdvTop = 0;
  document.querySelectorAll('#fn-tbody tr').forEach(tr => {
    const ac = tr.querySelector('.fat-ac')?.value.trim() || '';
    const mkt = parseFloat(tr.querySelector('.fat-mkt')?.value) || 0;
    const fiy = parseFloat(tr.querySelector('.fat-fiy')?.value) || 0;
    const kdv = parseFloat(tr.querySelector('.fat-kdv')?.value) || 0;
    if (!ac || !fiy) return;
    const sat = mkt * fiy; const kdvTutar = sat * kdv / 100;
    ara += sat; kdvTop += kdvTutar;
    kalemler.push({ aciklama: ac, miktar: mkt, fiyat: Math.round(fiy * 100) / 100, kdv, toplam: Math.round((sat + kdvTutar) * 100) / 100 });
  });
  if (!kalemler.length) { toast('En az bir kalem ekleyin', 'warn'); return; }
  const rec = { id: id || uid(), no, tarih: document.getElementById('fn-tarih')?.value || TODAY(), vade: document.getElementById('fn-vade')?.value || '', musteri, kalemler, ara: Math.round(ara * 100) / 100, kdv: Math.round(kdvTop * 100) / 100, toplam: Math.round((ara + kdvTop) * 100) / 100, durum: document.getElementById('fn-durum')?.value || 'bekliyor', not: document.getElementById('fn-not')?.value || '' };
  if (id) { const i = S.faturalar.findIndex(x => x.id === id); S.faturalar[i] = rec; } else S.faturalar.push(rec);
  saveStore(); closeModal(); renderFaturalar(); toast('Fatura kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

// ── Fatura Görüntüle ──────────────────────────────────────────────────────────
window._viewFatura = function(id) {
  const f = S.faturalar.find(x => x.id === id); if (!f) return;
  const mus = S.musteriler.find(m => m.id === f.musteri);
  const musName = mus ? (mus.tip === 'kurumsal' ? mus.sirketAd : `${mus.ad} ${mus.soyad}`) : '—';
  const sirket = S.settings.sirket || {};
  const durum = { odendi: { cls: 'bg-green', lbl: 'Ödendi' }, bekliyor: { cls: 'bg-amber', lbl: 'Bekliyor' }, gecikti: { cls: 'bg-red', lbl: 'Gecikmiş' }, iptal: { cls: 'bg-gray', lbl: 'İptal' } }[f.durum] || { cls: 'bg-gray', lbl: f.durum };
  const activeT = S.invoiceTemplates?.find(t => t.id === S.activeTemplateId) || S.invoiceTemplates?.[0];
  const color = activeT?.color || '#2563EB';
  const font = activeT?.font || 'Outfit';

  showModal(`<div class="modal-hdr">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="modal-title">${f.no}</div>
      <span class="badge ${durum.cls}">${durum.lbl}</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm no-print" onclick="window.print()">🖨️ Yazdır</button>
      <button class="btn btn-light btn-sm" onclick="window.closeModal();window._openYeniFaturaModal('${f.id}')">Düzenle</button>
      ${f.durum !== 'odendi' ? `<button class="btn btn-orange btn-sm" onclick="window.closeModal();window._markFaturaOdendi('${f.id}')">Ödendi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></button>` : ''}
      <button class="modal-close" onclick="window.closeModal()">×</button>
    </div>
  </div>
  <div class="modal-body" style="padding:0">
    <div style="font-family:'${font}',sans-serif;padding:32px;background:#fff;border-radius:0 0 var(--rlg) var(--rlg)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid ${color}">
        <div>
          ${sirket.logo ? `<img src="${sirket.logo}" style="max-height:50px;max-width:180px;object-fit:contain;margin-bottom:8px;display:block">` : `<div style="font-size:22px;font-weight:800;color:${color}">${sirket.ad || 'Findie'}</div>`}
          <div style="font-size:12px;color:#666;margin-top:4px">${sirket.adres || ''} ${sirket.il ? '· ' + sirket.il : ''}</div>
          <div style="font-size:12px;color:#666">VKN: ${sirket.vkn || '—'} · ${sirket.tel || ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px">FATURA</div>
          <div style="font-size:22px;font-weight:800;color:#111;margin-top:3px">${f.no}</div>
          <div style="font-size:12px;color:#888;margin-top:4px">Tarih: ${DT(f.tarih)}</div>
          ${f.vade ? `<div style="font-size:12px;color:#888">Vade: ${DT(f.vade)}</div>` : ''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div style="background:#F8FAFC;border-radius:10px;padding:14px">
          <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">GÖNDEREN</div>
          <div style="font-size:14px;font-weight:700">${sirket.ad}</div>
          <div style="font-size:12px;color:#666;margin-top:3px">${sirket.adres}<br>VKN: ${sirket.vkn}</div>
          ${sirket.iban ? `<div style="font-size:11px;color:#888;margin-top:4px">IBAN: ${sirket.iban}</div>` : ''}
        </div>
        <div style="background:#F8FAFC;border-radius:10px;padding:14px">
          <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">ALICI</div>
          <div style="font-size:14px;font-weight:700">${musName}</div>
          ${mus ? `<div style="font-size:12px;color:#666;margin-top:3px">${mus.adres || ''}${mus.vkn ? '<br>VKN: ' + mus.vkn : ''}</div>` : ''}
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead><tr style="background:${color};color:#fff;border-radius:8px">
          <th style="padding:10px 12px;text-align:left;font-size:11.5px;border-radius:8px 0 0 8px">AÇIKLAMA</th>
          <th style="padding:10px 8px;text-align:right;font-size:11.5px;width:60px">MKT</th>
          <th style="padding:10px 8px;text-align:right;font-size:11.5px;width:110px">BİRİM FİYAT</th>
          <th style="padding:10px 8px;text-align:right;font-size:11.5px;width:65px">KDV</th>
          <th style="padding:10px 12px;text-align:right;font-size:11.5px;width:120px;border-radius:0 8px 8px 0">TUTAR</th>
        </tr></thead>
        <tbody>${(f.kalemler || []).map((k, i) => `<tr style="background:${i % 2 === 0 ? '#F8FAFC' : '#fff'}">
          <td style="padding:10px 12px;font-size:13px">${k.aciklama}</td>
          <td style="padding:10px 8px;text-align:right;font-size:12.5px">${k.miktar}</td>
          <td style="padding:10px 8px;text-align:right;font-size:12.5px">${TL(k.fiyat)}</td>
          <td style="padding:10px 8px;text-align:right;font-size:12px;color:#888">%${k.kdv}</td>
          <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:600">${TL(k.toplam)}</td>
        </tr>`).join('')}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end">
        <div style="width:260px;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">
          <div style="display:flex;justify-content:space-between;padding:10px 14px;font-size:13px;background:#F8FAFC"><span style="color:#666">Ara Toplam</span><span>${TL(f.ara)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:10px 14px;font-size:13px;border-top:1px solid #E2E8F0"><span style="color:#666">KDV</span><span>${TL(f.kdv)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 14px;background:${color};color:#fff"><span style="font-weight:700;font-size:14px">GENEL TOPLAM</span><span style="font-weight:800;font-size:18px">${TL(f.toplam)}</span></div>
        </div>
      </div>
      ${f.not ? `<div style="margin-top:20px;padding:12px 14px;background:#FFF7ED;border-radius:8px;border-left:3px solid var(--orange);font-size:12.5px;color:#666"><b>Not:</b> ${f.not}</div>` : ''}
    </div>
  </div>`, true);
};

// ── Fatura Sil / Ödendi ───────────────────────────────────────────────────────
window._markFaturaOdendi = function(id) {
  confirmDlg('Fatura Ödendi mi?', 'Bu faturayı ödendi olarak işaretlemek üzeresiniz.', 'info', () => {
    const f = S.faturalar.find(x => x.id === id);
    if (f) { f.durum = 'odendi'; saveStore(); renderFaturalar(); toast('Fatura ödendi olarak işaretlendi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'); }
  }, 'Evet, Ödendi');
};

window._delFatura = function(id) {
  confirmDlg('Fatura silinecek', 'Bu fatura kalıcı olarak kaldırılacak. Emin misiniz?', 'danger', () => {
    S.faturalar = S.faturalar.filter(x => x.id !== id); saveStore(); closeModal(); renderFaturalar(); toast('Silindi', 'warn');
  });
};

// ── Şablon Tasarımcısı ────────────────────────────────────────────────────────
export function renderFaturaEdit() {
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-ghost btn-sm" onclick="navigate('faturalar')">← Faturalara Dön</button>
    <button class="btn btn-orange" onclick="window.saveDesign()">Tasarımı Kaydet</button>`;
  document.getElementById('filter-bar').style.display = 'none';

  const activeT = S.invoiceTemplates?.find(t => t.id === S.activeTemplateId) || S.invoiceTemplates?.[0];
  if (!activeT) { document.getElementById('page-body').innerHTML = `<div style="text-align:center;padding:80px">Şablon bulunamadı</div>`; return; }

  document.getElementById('page-body').innerHTML = `
  <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card cp">
        <div class="ct">Şablon Seçimi</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${S.invoiceTemplates.map(t => `<div class="template-card ${t.id === S.activeTemplateId ? 'active' : ''}" onclick="window.switchTemplate('${t.id}')">
            <div class="template-dot" style="background:${t.color}"></div>
            <div style="font-size:13px;font-weight:600">${t.name}</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="card cp">
        <div class="ct">Marka Rengi</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${['#2563eb','#334155','#18181b','#6366f1','#ec4899','#f97316','#10b981','#dc2626'].map(c => `<div class="color-swatch ${activeT.color === c ? 'active' : ''}" style="background:${c}" onclick="window.updateColor('${c}')"></div>`).join('')}
        </div>
        <div style="margin-top:10px"><label style="font-size:12px;color:var(--t3)">Özel renk</label><input type="color" value="${activeT.color}" oninput="window.updateColor(this.value)" style="display:block;width:100%;height:36px;border:1px solid var(--border);border-radius:6px;cursor:pointer;padding:2px 4px;margin-top:4px"></div>
      </div>
      <div class="card cp">
        <div class="ct">Tipografi</div>
        <div class="fg"><label>Yazı Tipi</label>
          <select onchange="window.updateFont(this.value)">
            <option value="Inter" ${activeT.font==='Inter'?'selected':''}>Inter</option>
            <option value="Outfit" ${activeT.font==='Outfit'?'selected':''}>Outfit</option>
            <option value="Roboto" ${activeT.font==='Roboto'?'selected':''}>Roboto</option>
            <option value="Georgia" ${activeT.font==='Georgia'?'selected':''}>Georgia</option>
          </select>
        </div>
        <div class="fg"><label>Köşe Yumuşaklığı</label>
          <input type="range" min="0" max="30" value="${parseInt(activeT.radius)||0}" oninput="window.updateRadius(this.value);document.getElementById('r-val').textContent=this.value+'px'">
          <div style="text-align:right;font-size:11px;color:var(--t3);margin-top:2px" id="r-val">${activeT.radius||'0px'}</div>
        </div>
      </div>
    </div>
    <div class="card" style="overflow:visible">
      <div style="padding:20px 24px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div class="ct" style="margin-bottom:0">Önizleme</div>
        <span style="font-size:11.5px;color:var(--t3)">Gerçek boyut yaklaşık A4</span>
      </div>
      <div style="padding:20px;background:var(--bg)">
        <div id="invoice-preview-host" style="transform-origin:top left"></div>
      </div>
    </div>
  </div>`;

  renderPreview();

  window.switchTemplate = (id) => { S.activeTemplateId = id; renderFaturaEdit(); };
  window.updateColor = (c) => { const t = S.invoiceTemplates.find(x => x.id === S.activeTemplateId); if (t) { t.color = c; renderPreview(); } };
  window.updateFont = (f) => { const t = S.invoiceTemplates.find(x => x.id === S.activeTemplateId); if (t) { t.font = f; renderPreview(); } };
  window.updateRadius = (r) => { const t = S.invoiceTemplates.find(x => x.id === S.activeTemplateId); if (t) { t.radius = r+'px'; renderPreview(); } };
}

function renderPreview() {
  const t = S.invoiceTemplates?.find(x => x.id === S.activeTemplateId) || S.invoiceTemplates?.[0];
  const h = document.getElementById('invoice-preview-host'); if (!h || !t) return;
  const s = S.settings.sirket;
  h.innerHTML = `<div style="font-family:'${t.font}',sans-serif;border-radius:${t.radius};background:#fff;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.08);transition:all .3s">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid ${t.color}">
      <div>
        <div style="font-size:20px;font-weight:800;color:${t.color}">${s.ad || 'Şirket Adı A.Ş.'}</div>
        <div style="font-size:11px;color:#888;margin-top:3px">${s.adres || 'Adres'} · VKN: ${s.vkn || '—'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;font-weight:700;color:${t.color};text-transform:uppercase;letter-spacing:1px">FATURA</div>
        <div style="font-size:18px;font-weight:800">FAT20260001</div>
        <div style="font-size:11px;color:#888">Tarih: ${DT(TODAY())}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div style="background:#F8FAFC;border-radius:${t.radius};padding:12px">
        <div style="font-size:9px;font-weight:700;color:${t.color};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">GÖNDEREN</div>
        <div style="font-size:13px;font-weight:700">${s.ad}</div>
        <div style="font-size:11px;color:#666;margin-top:2px">${s.adres}</div>
      </div>
      <div style="background:#F8FAFC;border-radius:${t.radius};padding:12px">
        <div style="font-size:9px;font-weight:700;color:${t.color};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">ALICI</div>
        <div style="font-size:13px;font-weight:700">TechVision Ltd.</div>
        <div style="font-size:11px;color:#666;margin-top:2px">Levent, İstanbul</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr style="background:${t.color};color:#fff"><th style="padding:8px 10px;text-align:left;font-size:11px;border-radius:${t.radius} 0 0 0">AÇIKLAMA</th><th style="padding:8px 6px;text-align:right;font-size:11px">MKT</th><th style="padding:8px 6px;text-align:right;font-size:11px">FİYAT</th><th style="padding:8px 10px;text-align:right;font-size:11px;border-radius:0 ${t.radius} 0 0">TUTAR</th></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 10px;font-size:12px">Yazılım Geliştirme Hizmeti</td><td style="padding:8px 6px;text-align:right;font-size:12px">1</td><td style="padding:8px 6px;text-align:right;font-size:12px">₺15.000,00</td><td style="padding:8px 10px;text-align:right;font-size:12px;font-weight:600">₺18.000,00</td></tr>
      <tr><td style="padding:8px 10px;font-size:12px">UI/UX Tasarım</td><td style="padding:8px 6px;text-align:right;font-size:12px">1</td><td style="padding:8px 6px;text-align:right;font-size:12px">₺3.500,00</td><td style="padding:8px 10px;text-align:right;font-size:12px;font-weight:600">₺4.200,00</td></tr>
    </table>
    <div style="display:flex;justify-content:flex-end">
      <div style="width:220px;border:1px solid #E2E8F0;border-radius:${t.radius};overflow:hidden;font-size:12px">
        <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#F8FAFC"><span>Ara Toplam</span><span>₺18.500,00</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 12px;border-top:1px solid #E2E8F0"><span>KDV (%20)</span><span>₺3.700,00</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 12px;background:${t.color};color:#fff;font-weight:700"><span>TOPLAM</span><span>₺22.200,00</span></div>
      </div>
    </div>
  </div>`;
}

window.saveDesign = () => { saveStore(); toast('Tasarım kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'); navigate('faturalar'); };
window.markAsPaid = window._markFaturaOdendi;
