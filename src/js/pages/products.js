import { S, saveStore } from '../core/state.js';
import { TL, uid, KDV } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';
import { navigate } from '../core/router.js';

// ── Ürünler ───────────────────────────────────────────────────────────────────
export function renderUrunler() {
  document.getElementById('ph-actions').innerHTML =
    `<button class="btn btn-orange" onclick="window._openUrunModal()">ÜRÜN EKLE</button>`;
  const fbar = document.getElementById('filter-bar');
  fbar.style.display = 'flex';
  const kategoriler = [...new Set(S.urunler.map(u => u.kategori))];
  fbar.innerHTML = `
    <div style="display:flex;align-items:center;background:var(--border2);border-radius:6px;padding:0 10px">
      <span style="font-size:10px;font-weight:700;color:var(--t3);margin-right:8px">ÜRÜN</span>
      <input type="text" id="us" placeholder="Kod veya isim…" oninput="window._tUrun()" style="padding:7px 0;font-size:12px;width:180px;border:none;background:transparent">
    </div>
    <select id="uk" onchange="window._tUrun()" style="padding:7px 10px;font-size:12px;border-radius:6px"><option value="">Tüm Kategoriler</option>${kategoriler.map(k => `<option>${k}</option>`).join('')}</select>
    <div class="fb-grow"></div><span id="uc" style="font-size:11.5px;color:var(--t3);align-self:center;font-weight:600"></span>`;

  document.getElementById('page-body').innerHTML = `
    <div class="card anim"><div class="tbl-wrap">
      <table><thead><tr>
        <th>Kod</th><th>Ürün / Hizmet Adı</th><th>Kategori</th><th>Birim</th>
        <th class="tr">Birim Fiyat</th><th class="tr">KDV</th><th class="tr">KDV Dahil</th><th></th>
      </tr></thead>
      <tbody id="u-tbody"></tbody></table>
    </div></div>`;
  window._tUrun();
}

window._tUrun = function() {
  const q = (document.getElementById('us')?.value || '').toLowerCase();
  const kat = document.getElementById('uk')?.value || '';
  let rows = [...S.urunler];
  if (q) rows = rows.filter(u => u.ad.toLowerCase().includes(q) || u.kod.toLowerCase().includes(q) || (u.aciklama || '').toLowerCase().includes(q));
  if (kat) rows = rows.filter(u => u.kategori === kat);
  const c = document.getElementById('uc'); if (c) c.textContent = `${rows.length} ürün`;
  const tb = document.getElementById('u-tbody'); if (!tb) return;
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:80px;color:var(--t3)"><div style="font-size:14px;font-weight:700;margin-bottom:10px;color:var(--t1)">BOŞ</div>Ürün bulunamadı<br><button class="btn btn-orange btn-sm" onclick="window._openUrunModal()" style="margin-top:12px">İLK ÜRÜNÜ EKLE</button></td></tr>`;
    return;
  }
  tb.innerHTML = rows.map(u => {
    const kdvTutar = u.birimFiyat * u.kdvOrani / 100;
    const toplam = u.birimFiyat + kdvTutar;
    return `<tr>
      <td style="font-variant-numeric:tabular-nums;font-size:12px;color:var(--t2);font-weight:600">${u.kod}</td>
      <td><div style="font-weight:600;font-size:13px">${u.ad}</div>${u.aciklama ? `<div style="font-size:11.5px;color:var(--t3);margin-top:1px">${u.aciklama}</div>` : ''}</td>
      <td><span class="badge bg-blue">${u.kategori}</span></td>
      <td><span class="prod-unit">${u.birim}</span></td>
      <td class="tr mono prod-price">${TL(u.birimFiyat)}</td>
      <td class="tr" style="color:var(--t2)">%${u.kdvOrani}</td>
      <td class="tr mono" style="font-weight:700;color:var(--blue)">${TL(toplam)}</td>
      <td style="white-space:nowrap">
        ${u.link ? `<a href="${u.link}" target="_blank" class="btn btn-ghost btn-xs" style="margin-right:4px;color:var(--blue)">İncele</a>` : ''}
        <button class="btn btn-light btn-xs" onclick="window._openUrunModal('${u.id}')" style="margin-right:4px">Düzenle</button>
        <button class="btn btn-danger-soft btn-xs" onclick="window._delUrun('${u.id}')">Sil</button>
      </td>
    </tr>`;
  }).join('');
};

window._openUrunModal = function(id) {
  const u = id ? S.urunler.find(x => x.id === id) : null;
  const kategoriler = ['Yazılım','Tasarım','Danışmanlık','Yönetim','Lisans','Destek','Hizmet','Ürün','Diğer'];
  const birimler = ['adet','saat','gün','ay','yıl','proje','paket','m²','kg'];
  const defKdv = S.settings?.vergi?.varsayilanKdv ?? 20;
  showModal(`<div class="modal-hdr"><div class="modal-title">Ürün ${u ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="form-grid c2">
      <div class="fg"><label>Ürün Kodu *</label><input type="text" id="u-kod" value="${u?.kod||''}" placeholder="SRV-001"></div>
      <div class="fg"><label>Kategori *</label><select id="u-kat">${kategoriler.map(k=>`<option ${u?.kategori===k?'selected':''}>${k}</option>`).join('')}</select></div>
    </div>
    <div class="fg" style="margin-bottom:12px"><label>Ürün / Hizmet Adı *</label><input type="text" id="u-ad" value="${u?.ad||''}" placeholder="ör: Web Geliştirme Hizmeti"></div>
    <div class="fg" style="margin-bottom:12px"><label>Açıklama</label><input type="text" id="u-aciklama" value="${u?.aciklama||''}" placeholder="Kısa açıklama (faturada görünür)"></div>
    <div class="form-grid c3">
      <div class="fg"><label>Birim Fiyat (₺) *</label><input type="number" id="u-fiyat" value="${u?.birimFiyat||''}" min="0" step="0.01" oninput="window._calcUrun()" placeholder="0.00"></div>
      <div class="fg"><label>KDV Oranı</label><select id="u-kdv" onchange="window._calcUrun()">${KDV.map(r=>`<option value="${r}" ${(u?.kdvOrani??defKdv)===r?'selected':''}>${r===0?"%0 KDV'siz":'%'+r}</option>`).join('')}</select></div>
      <div class="fg"><label>Birim</label><select id="u-birim">${birimler.map(b=>`<option ${u?.birim===b?'selected':''}>${b}</option>`).join('')}</select></div>
    </div>
    <div class="fg" style="margin-bottom:12px"><label>Ürün Linki</label><input type="text" id="u-link" value="${u?.link||''}" placeholder="https://…"></div>
    <div class="calc-row" style="margin-top:4px">
      <div class="calc-item"><div class="calc-label">Net Fiyat</div><div class="calc-value" id="up-net">—</div></div>
      <div class="calc-item"><div class="calc-label">KDV</div><div class="calc-value" id="up-kdv">—</div></div>
      <div class="calc-item"><div class="calc-label">KDV Dahil</div><div class="calc-value grand" id="up-top">—</div></div>
    </div>
  </div>
  <div class="modal-ftr"><button class="btn btn-ghost" onclick="window.closeModal()">İptal</button><button class="btn btn-orange" onclick="window._saveUrun('${id||''}')">Kaydet</button></div>`);
  window._calcUrun();
};

window._calcUrun = function() {
  const f = parseFloat(document.getElementById('u-fiyat')?.value) || 0;
  const r = parseFloat(document.getElementById('u-kdv')?.value) || 0;
  const kdv = f * r / 100; const top = f + kdv;
  if (document.getElementById('up-net')) document.getElementById('up-net').textContent = TL(f);
  if (document.getElementById('up-kdv')) document.getElementById('up-kdv').textContent = TL(kdv);
  if (document.getElementById('up-top')) document.getElementById('up-top').textContent = TL(top);
};

window._saveUrun = function(id) {
  const ad = document.getElementById('u-ad').value.trim();
  const kod = document.getElementById('u-kod').value.trim();
  if (!ad || !kod) { toast('Kod ve ad gereklidir', 'warn'); return; }
  const fiyat = parseFloat(document.getElementById('u-fiyat').value) || 0;
  if (!fiyat) { toast('Fiyat giriniz', 'warn'); return; }
  const rec = { id: id || uid(), kod, ad, aciklama: document.getElementById('u-aciklama').value, kategori: document.getElementById('u-kat').value, birimFiyat: fiyat, kdvOrani: parseFloat(document.getElementById('u-kdv').value) || 0, birim: document.getElementById('u-birim').value, link: document.getElementById('u-link').value.trim() };
  if (id) { const i = S.urunler.findIndex(u => u.id === id); S.urunler[i] = rec; } else S.urunler.push(rec);
  saveStore(); closeModal(); renderUrunler(); toast('Ürün kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

window._delUrun = function(id) {
  confirmDlg('Ürün silinecek', 'Bu ürün katalogdan kaldırılacak. Emin misiniz?', 'danger', () => {
    S.urunler = S.urunler.filter(u => u.id !== id); saveStore(); renderUrunler(); toast('Silindi', 'warn');
  });
};

// ── Toplu Hesaplama ───────────────────────────────────────────────────────────
export function renderTopluHesap() {
  document.getElementById('ph-actions').innerHTML =
    `<button class="btn btn-ghost btn-sm" onclick="window._clearToplu()">Temizle</button><button class="btn btn-orange" onclick="window._topluToFatura()">Faturaya Dönüştür</button>`;
  document.getElementById('filter-bar').style.display = 'none';
  document.getElementById('page-body').innerHTML = `
  <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start">
    <div class="card cp">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div class="ct" style="margin-bottom:0">Ürün / Hizmet Listesi</div>
        <div style="display:flex;gap:8px">
          ${S.urunler.length ? `<button class="btn btn-light btn-sm" onclick="window._addTopluFromCatalog()">KATALOGDAN EKLE</button>` : ''}
          <button class="btn btn-orange btn-sm" onclick="window._addTopluRow()">SATIR EKLE</button>
        </div>
      </div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse" id="toplu-tbl">
        <thead><tr style="background:var(--bg)">
          <th style="padding:8px;text-align:left;font-size:10.5px;font-weight:600;color:var(--t3)">ÜRÜN / AÇIKLAMA</th>
          <th style="padding:8px;font-size:10.5px;font-weight:600;color:var(--t3);width:65px">MKT</th>
          <th style="padding:8px;font-size:10.5px;font-weight:600;color:var(--t3);width:65px">BİRİM</th>
          <th style="padding:8px;font-size:10.5px;font-weight:600;color:var(--t3);width:115px">BİRİM FİYAT</th>
          <th style="padding:8px;font-size:10.5px;font-weight:600;color:var(--t3);width:65px">İSK %</th>
          <th style="padding:8px;font-size:10.5px;font-weight:600;color:var(--t3);width:65px">KDV %</th>
          <th style="padding:8px;font-size:10.5px;font-weight:600;color:var(--t3);width:115px;text-align:right">TUTAR</th>
          <th style="width:24px"></th>
        </tr></thead>
        <tbody id="toplu-tbody"></tbody>
      </table></div>
      <button class="btn btn-ghost btn-sm" onclick="window._addTopluRow()" style="margin-top:10px;width:100%">SATIR EKLE</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card cp">
        <div class="ct">Genel İskonto</div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="number" id="genel-isk" value="0" min="0" max="100" step="0.5" oninput="window._calcToplu()" style="flex:1;font-size:16px;font-weight:700;text-align:center;padding:10px">
          <span style="font-size:18px;color:var(--t2)">%</span>
        </div>
      </div>
      <div class="card cp" id="toplu-ozet">
        <div class="ct">Fiyat Özeti</div>
        <div style="text-align:center;padding:20px;color:var(--t3)">Ürün ekleyin</div>
      </div>
      <div class="card cp">
        <div class="ct">Müşteri Seç</div>
        <select id="toplu-musteri" style="width:100%;font-size:13px;padding:8px 10px;border-radius:8px">
          <option value="">— Fatura için müşteri seç —</option>
          ${S.musteriler.map(m => `<option value="${m.id}">${m.tip==='kurumsal'?m.sirketAd:(m.ad+' '+m.soyad)}</option>`).join('')}
        </select>
        <button class="btn btn-orange" style="width:100%;margin-top:10px" onclick="window._topluToFatura()">Faturaya Dönüştür</button>
      </div>
    </div>
  </div>`;
  window._addTopluRow();
}

window._addTopluRow = function(prod) {
  const tb = document.getElementById('toplu-tbody'); if (!tb) return;
  const defKdv = S.settings?.vergi?.varsayilanKdv || 20;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="padding:4px 3px;min-width:180px">
      ${S.urunler.length ? `<select class="inv-prod-sel" onchange="window._selectTopluProd(this)" style="margin-bottom:4px"><option value="">— Manuel / Ürün Seç —</option>${S.urunler.map(p=>`<option value="${p.id}">[${p.kod}] ${p.ad}</option>`).join('')}</select>` : ''}
      <input type="text" class="ta-desc" style="width:100%;font-size:12.5px;padding:6px 8px;border-radius:6px" placeholder="Açıklama…" oninput="window._calcToplu()" value="${prod?.ad||''}">
    </td>
    <td><input type="number" class="ta-mkt" value="1" min="0" step="1" style="width:100%;font-size:12.5px;padding:6px 6px;text-align:right;border-radius:6px" oninput="window._calcToplu()"></td>
    <td><input type="text" class="ta-bir" value="${prod?.birim||'adet'}" style="width:100%;font-size:12px;padding:6px 6px;border-radius:6px" placeholder="adet"></td>
    <td><input type="number" class="ta-fiy" value="${prod?.birimFiyat||''}" min="0" step="0.01" style="width:100%;font-size:12.5px;padding:6px 8px;text-align:right;border-radius:6px" oninput="window._calcToplu()" placeholder="0.00"></td>
    <td><input type="number" class="ta-isk" value="0" min="0" max="100" step="1" style="width:100%;font-size:12.5px;padding:6px 6px;text-align:right;border-radius:6px" oninput="window._calcToplu()"></td>
    <td><select class="ta-kdv" onchange="window._calcToplu()" style="width:100%;font-size:12.5px;padding:6px 5px;border-radius:6px">${KDV.map(r=>`<option value="${r}" ${(prod?.kdvOrani??defKdv)===r?'selected':''}>${r===0?'0':'%'+r}</option>`).join('')}</select></td>
    <td class="ta-top" style="text-align:right;font-size:12.5px;font-weight:600;padding:6px 4px;white-space:nowrap">—</td>
    <td><button onclick="this.closest('tr').remove();window._calcToplu()" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:16px;padding:0 5px">×</button></td>`;
  tb.appendChild(tr); if (prod) window._calcToplu();
};

window._selectTopluProd = function(el) {
  const p = S.urunler.find(x => x.id === el.value); if (!p) return;
  const row = el.closest('tr');
  row.querySelector('.ta-desc').value = p.ad;
  row.querySelector('.ta-fiy').value = p.birimFiyat;
  row.querySelector('.ta-bir').value = p.birim || 'adet';
  const kk = row.querySelector('.ta-kdv');
  for (let o of kk.options) { if (parseFloat(o.value) === p.kdvOrani) { o.selected = true; break; } }
  window._calcToplu();
};

window._addTopluFromCatalog = function() {
  showModal(`<div class="modal-hdr"><div class="modal-title">Katalogdan Ürün Ekle</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <input type="text" id="cat-s" placeholder="🔍 Ürün ara…" oninput="window._filterCatModal()" style="width:100%;margin-bottom:12px">
    <div id="cat-list" style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto">
      ${S.urunler.map(p => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;cursor:pointer" onclick="window._addFromCat('${p.id}')">
        <div style="flex:1"><div style="font-weight:600;font-size:13px">${p.ad}</div><div style="font-size:11.5px;color:var(--t3)">[${p.kod}] · ${p.kategori} · ${p.birim}</div></div>
        <div style="text-align:right"><div style="font-weight:700;color:var(--blue)">${TL(p.birimFiyat)}</div><div style="font-size:11px;color:var(--t3)">KDV hariç</div></div>
        <button class="btn btn-orange btn-xs">Ekle</button>
      </div>`).join('')}
    </div>
  </div>`);
};
window._filterCatModal = function() {
  const q = document.getElementById('cat-s')?.value.toLowerCase() || '';
  document.querySelectorAll('#cat-list>div').forEach(el => { el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none'; });
};
window._addFromCat = function(pid) {
  const p = S.urunler.find(x => x.id === pid); if (!p) return;
  closeModal(); window._addTopluRow(p);
};

window._calcToplu = function() {
  const genIsk = parseFloat(document.getElementById('genel-isk')?.value) || 0;
  let ara = 0, iskontoToplam = 0, kdvToplam = 0;
  document.querySelectorAll('#toplu-tbody tr').forEach(tr => {
    const mkt = parseFloat(tr.querySelector('.ta-mkt')?.value) || 0;
    const fiy = parseFloat(tr.querySelector('.ta-fiy')?.value) || 0;
    const isk = parseFloat(tr.querySelector('.ta-isk')?.value) || 0;
    const kdv = parseFloat(tr.querySelector('.ta-kdv')?.value) || 0;
    const netSat = mkt * fiy;
    const iskTutar = netSat * isk / 100;
    const sonNet = netSat - iskTutar;
    const kdvTutar = sonNet * kdv / 100;
    const satToplam = sonNet + kdvTutar;
    ara += netSat; iskontoToplam += iskTutar; kdvToplam += kdvTutar;
    const el = tr.querySelector('.ta-top'); if (el) el.textContent = TL(satToplam);
  });
  const araIskSonrasi = ara - iskontoToplam;
  const genIskTutar = araIskSonrasi * genIsk / 100;
  const genNetAra = araIskSonrasi - genIskTutar;
  const genKdv = kdvToplam * (1 - genIsk / 100);
  const genTop = genNetAra + genKdv;
  const ozet = document.getElementById('toplu-ozet'); if (!ozet) return;
  const hasRows = [...document.querySelectorAll('#toplu-tbody tr')].some(tr => parseFloat(tr.querySelector('.ta-fiy')?.value) || 0);
  if (!hasRows) { ozet.innerHTML = `<div class="ct">Fiyat Özeti</div><div style="text-align:center;padding:20px;color:var(--t3)">Ürün ekleyin</div>`; return; }
  ozet.innerHTML = `<div class="ct">Fiyat Özeti</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0"><span style="color:var(--t2)">Ara Toplam</span><span class="mono">${TL(ara)}</span></div>
      ${iskontoToplam > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;color:var(--red)"><span>Satır İskonto</span><span class="mono">−${TL(iskontoToplam)}</span></div>` : ''}
      ${genIsk > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;color:var(--red)"><span>Genel İskonto (%${genIsk})</span><span class="mono">−${TL(genIskTutar)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0"><span style="color:var(--t2)">İskonto Sonrası Ara Toplam</span><span class="mono">${TL(genNetAra)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0"><span style="color:var(--t2)">KDV Toplamı</span><span class="mono">${TL(genKdv)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid var(--border);margin-top:4px">
        <span style="font-weight:700;font-size:14px">GENEL TOPLAM</span>
        <span style="font-weight:800;font-size:20px;color:var(--blue)">${TL(genTop)}</span>
      </div>
    </div>`;
};

window._topluToFatura = function() {
  const musId = document.getElementById('toplu-musteri')?.value || '';
  const kalemler = []; let ara = 0, kdvT = 0;
  const genIsk = parseFloat(document.getElementById('genel-isk')?.value) || 0;
  document.querySelectorAll('#toplu-tbody tr').forEach(tr => {
    const ac = tr.querySelector('.ta-desc')?.value || '';
    const m = parseFloat(tr.querySelector('.ta-mkt')?.value) || 0;
    const f = parseFloat(tr.querySelector('.ta-fiy')?.value) || 0;
    const isk = parseFloat(tr.querySelector('.ta-isk')?.value) || 0;
    const kdv = parseFloat(tr.querySelector('.ta-kdv')?.value) || 0;
    if (!ac || !f) return;
    const net = m * f * (1 - isk / 100) * (1 - genIsk / 100);
    const kdvTutar = net * kdv / 100;
    ara += net; kdvT += kdvTutar;
    kalemler.push({ aciklama: ac, miktar: m, fiyat: Math.round(f * 100) / 100, kdv, toplam: Math.round((net + kdvTutar) * 100) / 100 });
  });
  if (!kalemler.length) { toast('Ürün listesi boş', 'warn'); return; }
  S.faturalar.push({ id: uid(), no: `FAT-${Date.now().toString().slice(-6)}`, tarih: new Date().toISOString().split('T')[0], vade: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0], musteri: musId, kalemler, ara: Math.round(ara * 100) / 100, kdv: Math.round(kdvT * 100) / 100, toplam: Math.round((ara + kdvT) * 100) / 100, durum: 'bekliyor', not: 'Toplu hesaplamadan oluşturuldu' });
  saveStore(); navigate('faturalar'); toast('Fatura oluşturuldu <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

window._clearToplu = function() {
  confirmDlg('Tablo temizlenecek', 'Tüm ürün satırları kaldırılacak. Emin misiniz?', 'warn', () => {
    document.querySelectorAll('#toplu-tbody tr').forEach(tr => tr.remove()); window._calcToplu();
  });
};
