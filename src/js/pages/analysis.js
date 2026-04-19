import { S } from '../core/state.js';
import { TL, DT, MS, MS_LONG, spark, countUp } from '../utils/formatters.js';
import { showModal, closeModal, toast } from '../components/ui.js';

let chartReg = {};

const CAT_COLORS = ['#2563EB','#8B5CF6','#F97316','#10B981','#EF4444','#EC4899','#F59E0B','#06B6D4','#84CC16','#6B7280'];

function destroyCharts() {
  Object.values(chartReg).forEach(c => { try { c.destroy(); } catch(_) {} });
  chartReg = {};
}

// ── Shared Year Picker ────────────────────────────────────────────────────────
function buildYearPicker(cb) {
  const yillar = [...new Set([...S.gelirler, ...S.giderler].map(x => x.tarih.slice(0, 4)))].sort().reverse();
  if (!yillar.length) yillar.push(String(new Date().getFullYear()));
  document.getElementById('filter-bar').style.display = 'flex';
  document.getElementById('filter-bar').innerHTML = `
    <span style="font-size:12px;color:var(--t2);font-weight:600">Yıl:</span>
    ${yillar.map((y, i) => `<button class="fb-pill ${i === 0 ? 'active' : ''}" onclick="
      document.querySelectorAll('.filter-bar .fb-pill').forEach(b=>b.classList.remove('active'));this.classList.add('active');
      window._analYilCb('${y}')">${y}</button>`).join('')}
    <div class="fb-grow"></div>`;
  window._analYilCb = cb;
  return yillar[0] || String(new Date().getFullYear());
}

// ── Detaylı Analiz ────────────────────────────────────────────────────────────
export function renderAnalysis() {
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-ghost btn-sm" onclick="navigate('raporlar')">Raporlara Git →</button>`;
  destroyCharts();
  const yil = buildYearPicker(y => { destroyCharts(); buildAnaliz(y); });
  buildAnaliz(yil);
}

function buildAnaliz(yil) {
  const tG = S.gelirler.filter(g => g.tarih.startsWith(yil)).reduce((s, g) => s + g.toplamTutar, 0);
  const tD = S.giderler.filter(g => g.tarih.startsWith(yil)).reduce((s, g) => s + g.toplamTutar, 0);
  const net = tG - tD;
  const margin = tG > 0 ? Math.round(net / tG * 100) : 0;
  const kdvG = S.gelirler.filter(g => g.tarih.startsWith(yil)).reduce((s, g) => s + (g.kdvTutar || 0), 0);
  const gelirM = MS.map((_, i) => { const m = `${yil}-${String(i+1).padStart(2, '0')}`; return S.gelirler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + g.toplamTutar, 0); });
  const giderM = MS.map((_, i) => { const m = `${yil}-${String(i+1).padStart(2, '0')}`; return S.giderler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + g.toplamTutar, 0); });
  const netM = gelirM.map((g, i) => g - giderM[i]);
  const custGelir = S.musteriler.map(m => {
    const nm = m.tip === 'kurumsal' ? m.sirketAd : `${m.ad || ''} ${m.soyad || ''}`.trim();
    return { nm, renk: m.renk || '#2563EB', val: S.gelirler.filter(g => g.musteri === m.id && g.tarih.startsWith(yil)).reduce((s, g) => s + g.toplamTutar, 0) };
  }).filter(x => x.val > 0).sort((a, b) => b.val - a.val);
  const giderKat = {}; S.giderler.filter(g => g.tarih.startsWith(yil)).forEach(g => { giderKat[g.kategori] = (giderKat[g.kategori] || 0) + g.toplamTutar; });

  document.getElementById('page-body').innerHTML = `
    <div class="kpi-grid anim" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
      <div class="kpi"><div class="kpi-label">Toplam Gelir — ${yil}</div>
        <div class="kpi-row"><div><div class="kpi-val" style="color:var(--green)" data-count="${tG}">—</div><div class="kpi-change up" style="margin-top:6px">GELİR</div></div><div>${spark(gelirM, '#059669')}</div></div>
      </div>
      <div class="kpi"><div class="kpi-label">Toplam Gider — ${yil}</div>
        <div class="kpi-row"><div><div class="kpi-val" style="color:var(--red)" data-count="${tD}">—</div><div class="kpi-change down" style="margin-top:6px">GİDER</div></div><div>${spark(giderM, '#DC2626')}</div></div>
      </div>
      <div class="kpi"><div class="kpi-label">Net Kâr — ${yil}</div>
        <div class="kpi-row"><div><div class="kpi-val" style="color:${net >= 0 ? 'var(--green)' : 'var(--red)'}" data-count="${net}">—</div><div class="kpi-change ${net >= 0 ? 'up' : 'down'}" style="margin-top:6px">KÂRLİLIK: %${margin}</div></div><div>${spark(netM, net >= 0 ? '#059669' : '#DC2626')}</div></div>
      </div>
      <div class="kpi"><div class="kpi-label">Tahsil Edilen KDV</div>
        <div class="kpi-row"><div><div class="kpi-val" style="color:var(--blue)" data-count="${kdvG}">—</div><div class="kpi-change neutral" style="margin-top:6px">${yil} toplam</div></div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px" class="anim d1">
      <div class="card cp">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div class="ct" style="margin-bottom:0">Aylık Performans — ${yil}</div>
          <div style="display:flex;gap:12px;font-size:11px">
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:2px;background:#059669;display:inline-block;border-radius:2px"></span>Gelir</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:2px;background:#DC2626;display:inline-block;border-radius:2px"></span>Gider</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:3px;background:#2563EB;display:inline-block;border-radius:2px"></span>Net</span>
          </div>
        </div>
        <div style="height:220px"><canvas id="analLine"></canvas></div>
      </div>
      <div class="card cp">
        <div class="ct">Müşteri Bazlı Gelir — ${yil}</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          ${custGelir.length === 0 ? `<div style="text-align:center;padding:30px;color:var(--t3)">Bu yıl gelir kaydı yok</div>` :
            custGelir.slice(0, 6).map((cx, i) => `<div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--border2)">
              <div style="font-size:11px;font-weight:700;color:var(--t3);width:14px">${i + 1}</div>
              <div style="width:24px;height:24px;border-radius:50%;background:${cx.renk};color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${cx.nm.slice(0, 2).toUpperCase()}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cx.nm}</div>
                <div style="margin-top:3px;height:3px;background:var(--border2);border-radius:99px"><div style="height:100%;width:${custGelir[0].val > 0 ? Math.round(cx.val / custGelir[0].val * 100) : 0}%;background:${cx.renk};border-radius:99px"></div></div>
              </div>
              <div style="font-size:12px;font-weight:700;white-space:nowrap;color:var(--blue)">${TL(cx.val)}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="anim d2">
      <div class="card cp">
        <div class="ct">Gider Kategorileri — ${yil}</div>
        ${Object.entries(giderKat).sort((a, b) => b[1] - a[1]).map(([k, v], i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border2)">
            <div style="width:8px;height:8px;border-radius:2px;background:${CAT_COLORS[i % CAT_COLORS.length]};flex-shrink:0"></div>
            <div style="flex:1;font-size:12.5px;font-weight:500">${k}</div>
            <div style="width:80px"><div style="height:4px;background:var(--border2);border-radius:99px"><div style="height:100%;width:${tD > 0 ? Math.round(v / tD * 100) : 0}%;background:${CAT_COLORS[i % CAT_COLORS.length]};border-radius:99px"></div></div></div>
            <div style="font-size:10.5px;color:var(--t3);width:28px;text-align:right">%${tD > 0 ? Math.round(v / tD * 100) : 0}</div>
            <div style="font-size:12.5px;font-weight:600;min-width:100px;text-align:right;font-variant-numeric:tabular-nums">${TL(v)}</div>
          </div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding-top:12px;margin-top:4px;border-top:2px solid var(--border);font-weight:700"><span>Toplam</span><span style="color:var(--red)">${TL(tD)}</span></div>
      </div>
      <div class="card cp">
        <div class="ct">Aylık Kâr / Zarar Tablosu — ${yil}</div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Ay</th><th class="tr">Gelir</th><th class="tr">Gider</th><th class="tr">Net</th></tr></thead>
          <tbody>${MS.map((ay, i) => {
            const g = gelirM[i], d = giderM[i], n = g - d;
            if (g === 0 && d === 0) return '';
            return `<tr>
              <td style="font-size:12px">${ay} ${yil}</td>
              <td class="tr mono" style="font-size:12px;color:var(--green)">${g > 0 ? TL(g) : '—'}</td>
              <td class="tr mono" style="font-size:12px;color:var(--red)">${d > 0 ? TL(d) : '—'}</td>
              <td class="tr mono" style="font-size:12px;font-weight:700;color:${n >= 0 ? 'var(--green)' : 'var(--red)'}">${g > 0 || d > 0 ? TL(n) : '—'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>
    </div>`;

  setTimeout(() => {
    document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count));
    const el = document.getElementById('analLine');
    if (el) chartReg.analLine = new Chart(el, {
      type: 'bar',
      data: { labels: MS, datasets: [
        { label: 'Gelir', data: gelirM, backgroundColor: 'rgba(5,150,105,.15)', borderColor: '#059669', borderWidth: 2, borderRadius: 4 },
        { label: 'Gider', data: giderM, backgroundColor: 'rgba(220,38,38,.1)', borderColor: '#DC2626', borderWidth: 2, borderRadius: 4 },
        { label: 'Net', data: netM, borderColor: '#2563EB', backgroundColor: 'transparent', borderWidth: 2.5, tension: 0.4, type: 'line', pointRadius: 3, pointBackgroundColor: '#2563EB', pointBorderColor: '#fff', pointBorderWidth: 2 }
      ]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111', cornerRadius: 8, callbacks: { label: c => ` ${c.dataset.label}: ${TL(c.raw)}` } } }, scales: { x: { ticks: { font: { size: 10 }, color: '#9CA3AF' }, grid: { display: false } }, y: { ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+'B' : v, font: { size: 10 }, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } } } }
    });
  }, 50);
}

// ── Raporlar ──────────────────────────────────────────────────────────────────
export function renderRaporlar() {
  document.getElementById('ph-actions').innerHTML = `<button class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Yazdır</button>`;
  destroyCharts();
  const yil = buildYearPicker(y => { destroyCharts(); buildRapor(y); });
  buildRapor(yil);
}

function buildRapor(yil) {
  const tG = S.gelirler.filter(g => g.tarih.startsWith(yil)).reduce((s, g) => s + g.toplamTutar, 0);
  const tD = S.giderler.filter(g => g.tarih.startsWith(yil)).reduce((s, g) => s + g.toplamTutar, 0);
  const net = tG - tD;
  const kdvG = S.gelirler.filter(g => g.tarih.startsWith(yil)).reduce((s, g) => s + (g.kdvTutar || 0), 0);
  const kdvD = S.giderler.filter(g => g.tarih.startsWith(yil)).reduce((s, g) => s + (g.kdvTutar || 0), 0);
  const gelirKat = {}; S.gelirler.filter(g => g.tarih.startsWith(yil)).forEach(g => { gelirKat[g.kategori] = (gelirKat[g.kategori] || 0) + g.toplamTutar; });
  const giderKat = {}; S.giderler.filter(g => g.tarih.startsWith(yil)).forEach(g => { giderKat[g.kategori] = (giderKat[g.kategori] || 0) + g.toplamTutar; });
  const gelirM = MS.map((_, i) => { const m = `${yil}-${String(i+1).padStart(2, '0')}`; return S.gelirler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + g.toplamTutar, 0); });
  const giderM = MS.map((_, i) => { const m = `${yil}-${String(i+1).padStart(2, '0')}`; return S.giderler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + g.toplamTutar, 0); });

  document.getElementById('page-body').innerHTML = `
    <div class="kpi-grid anim" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi" style="border-left:3px solid var(--green)"><div class="kpi-label">Toplam Gelir</div><div class="kpi-val" style="color:var(--green);margin-top:6px" data-count="${tG}">—</div></div>
      <div class="kpi" style="border-left:3px solid var(--red)"><div class="kpi-label">Toplam Gider</div><div class="kpi-val" style="color:var(--red);margin-top:6px" data-count="${tD}">—</div></div>
      <div class="kpi" style="border-left:3px solid var(--blue)"><div class="kpi-label">Net Kâr / Zarar</div><div class="kpi-val" style="color:${net >= 0 ? 'var(--green)' : 'var(--red)'};margin-top:6px" data-count="${net}">—</div></div>
      <div class="kpi" style="border-left:3px solid var(--amber)"><div class="kpi-label">Net Ödenecek KDV</div><div class="kpi-val" style="color:var(--amber);margin-top:6px" data-count="${Math.abs(kdvG - kdvD)}">—</div></div>
    </div>
    <div class="card-row anim d1">
      <div class="card cp" style="flex:3">
        <div class="ct">Aylık Bar Grafiği — ${yil}</div>
        <div style="height:220px"><canvas id="rapBar"></canvas></div>
      </div>
      <div class="card cp" style="flex:2">
        <div class="ct">KDV Özeti — ${yil}</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
          ${[
            { label: 'Tahsil Edilen KDV', val: kdvG, c: 'var(--green)', bg: 'var(--green-50)' },
            { label: 'İndirilebilir KDV',  val: kdvD, c: 'var(--red)',   bg: 'var(--red-50)' },
            { label: 'Net Ödenecek KDV',   val: kdvG - kdvD, c: 'var(--blue)', bg: 'var(--blue-50)' }
          ].map(r => `<div style="display:flex;justify-content:space-between;align-items:center;padding:13px 15px;border-radius:var(--r);background:${r.bg}">
            <span style="font-size:12.5px;font-weight:600;color:${r.c}">${r.label}</span>
            <span style="font-size:15px;font-weight:700;color:${r.c};font-variant-numeric:tabular-nums">${TL(Math.abs(r.val))}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card-row anim d2">
      <div class="card cp">
        <div class="ct">Gelir Özeti — ${yil}</div>
        ${Object.entries(gelirKat).sort((a,b)=>b[1]-a[1]).map(([k, v]) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border2)"><span style="font-size:13px">${k}</span><span style="font-size:13px;font-weight:600;color:var(--green);font-variant-numeric:tabular-nums">${TL(v)}</span></div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding-top:12px;margin-top:4px;border-top:2px solid var(--border);font-weight:700"><span>Toplam</span><span style="color:var(--green)">${TL(tG)}</span></div>
      </div>
      <div class="card cp">
        <div class="ct">Gider Özeti — ${yil}</div>
        ${Object.entries(giderKat).sort((a,b)=>b[1]-a[1]).map(([k, v]) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border2)"><span style="font-size:13px">${k}</span><span style="font-size:13px;font-weight:600;color:var(--red);font-variant-numeric:tabular-nums">${TL(v)}</span></div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding-top:12px;margin-top:4px;border-top:2px solid var(--border);font-weight:700"><span>Toplam</span><span style="color:var(--red)">${TL(tD)}</span></div>
      </div>
    </div>`;

  setTimeout(() => {
    document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count));
    const el = document.getElementById('rapBar');
    if (el) chartReg.rapBar = new Chart(el, {
      type: 'bar',
      data: { labels: MS, datasets: [
        { label: 'Gelir', data: gelirM, backgroundColor: 'rgba(5,150,105,.2)', borderColor: '#059669', borderWidth: 2, borderRadius: 5 },
        { label: 'Gider', data: giderM, backgroundColor: 'rgba(220,38,38,.15)', borderColor: '#DC2626', borderWidth: 2, borderRadius: 5 }
      ]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10 } }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${TL(c.raw)}` } } }, scales: { x: { ticks: { font: { size: 10 }, color: '#9CA3AF' }, grid: { display: false } }, y: { ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+'B' : v, font: { size: 10 }, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } } } }
    });
  }, 50);
}

// ── KDV Analizi ───────────────────────────────────────────────────────────────
export function renderKdv() {
  document.getElementById('ph-actions').innerHTML = '';
  document.getElementById('filter-bar').style.display = 'none';
  destroyCharts();
  const yillar = [...new Set([...S.gelirler, ...S.giderler].map(x => x.tarih.slice(0, 4)))].sort().reverse();
  const rows = yillar.flatMap(yil => MS.map((ay, i) => {
    const m = `${yil}-${String(i+1).padStart(2, '0')}`;
    const kG = S.gelirler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + (g.kdvTutar || 0), 0);
    const kD = S.giderler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + (g.kdvTutar || 0), 0);
    if (kG === 0 && kD === 0) return null;
    return { period: `${ay} ${yil}`, kdvG: kG, kdvD: kD, net: kG - kD };
  })).filter(Boolean);
  const totKdvG = rows.reduce((s, r) => s + r.kdvG, 0);
  const totKdvD = rows.reduce((s, r) => s + r.kdvD, 0);

  document.getElementById('page-body').innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Tahsil Edilen KDV</div><div class="sc-val" style="color:var(--green)" data-count="${totKdvG}">—</div></div>
      <div class="sc"><div class="sc-label">Toplam İndirilebilir KDV</div><div class="sc-val" style="color:var(--red)" data-count="${totKdvD}">—</div></div>
      <div class="sc"><div class="sc-label">Net Ödenecek KDV</div><div class="sc-val" style="color:var(--blue)" data-count="${totKdvG - totKdvD}">—</div></div>
    </div>
    <div class="card anim d1"><div class="tbl-wrap">
      <table>
        <thead><tr><th>Dönem</th><th class="tr">Tahsil Edilen KDV</th><th class="tr">İndirilebilir KDV</th><th class="tr">Net KDV (Ödenecek)</th><th>Durum</th></tr></thead>
        <tbody>${rows.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--t3)">Kayıtlarda KDV bilgisi bulunmadı.</td></tr>` : rows.map(r => `<tr>
          <td style="font-weight:500">${r.period}</td>
          <td class="tr mono" style="color:var(--green)">${TL(r.kdvG)}</td>
          <td class="tr mono" style="color:var(--red)">${TL(r.kdvD)}</td>
          <td class="tr mono" style="font-weight:700;color:${r.net >= 0 ? 'var(--blue)' : 'var(--green)'}">${TL(r.net)}</td>
          <td><span class="badge ${r.net >= 0 ? 'bg-blue' : 'bg-green'}">${r.net >= 0 ? 'Ödenecek' : 'İade Hakkı'}</span></td>
        </tr>`).join('')}
        </tbody>
        <tfoot><tr style="background:var(--bg);font-weight:700;border-top:2px solid var(--border)">
          <td style="padding:12px 14px">TOPLAM</td>
          <td class="tr mono" style="padding:12px 14px;color:var(--green)">${TL(totKdvG)}</td>
          <td class="tr mono" style="padding:12px 14px;color:var(--red)">${TL(totKdvD)}</td>
          <td class="tr mono" style="padding:12px 14px;color:var(--blue);font-size:15px">${TL(totKdvG - totKdvD)}</td>
          <td></td>
        </tr></tfoot>
      </table>
    </div></div>`;
  setTimeout(() => document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count)), 50);
}

// ══════════════════════════════════════════════════════════
//  AI PITCH — Yatırımcı Sunumu Üreticisi
// ══════════════════════════════════════════════════════════
export function renderAiPitch() {
  document.getElementById('ph-actions').innerHTML = '';
  document.getElementById('filter-bar').style.display = 'none';
  destroyCharts();

  const yillar = [...new Set([...S.gelirler, ...S.giderler].map(x => x.tarih.slice(0, 4)))].sort();
  const sections = [
    { id: 'ozet',       lbl: '📊 Finansal Özet', desc: 'Gelir, gider, net kâr özeti' },
    { id: 'gelirler',   lbl: '💰 Gelir Analizi',  desc: 'Kategori ve müşteri bazlı gelirler' },
    { id: 'giderler',   lbl: '📋 Gider Analizi',  desc: 'Kategori bazlı gider dağılımı' },
    { id: 'karlılık',   lbl: '📈 Kârlılık Trendi', desc: 'Aylık net kâr trendi' },
    { id: 'musteriler', lbl: '👥 Müşteri Portföyü', desc: 'En değerli müşteriler' },
    { id: 'personel',   lbl: '🧑‍💼 Personel Maliyeti', desc: 'Bordro ve maaş özeti' },
    { id: 'kdv',        lbl: '🧾 KDV Özeti',       desc: 'KDV durumu ve beyanları' },
    { id: 'faturalar',  lbl: '📄 Fatura Durumu',   desc: 'Ödendi / bekleyen faturalar' },
  ];

  document.getElementById('page-body').innerHTML = `
    <div class="anim" style="display:grid;grid-template-columns:340px 1fr;gap:20px;align-items:start">
      <!-- Sol Panel: Ayarlar -->
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card cp">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#6366F1,#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:18px">🚀</div>
            <div>
              <div style="font-size:14px;font-weight:800;color:var(--t1)">AI Pitch</div>
              <div style="font-size:11.5px;color:var(--t3)">Yatırımcı sunum üreticisi</div>
            </div>
          </div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);margin-bottom:10px">Dahil Edilecek Dönemler</div>
          <select id="pitch-yil-bas" style="width:100%;margin-bottom:8px;padding:8px 10px;font-size:13px;border-radius:6px">
            <option value="">— Başlangıç Yılı —</option>
            ${yillar.map(y => `<option value="${y}">${y}</option>`).join('')}
          </select>
          <select id="pitch-yil-bit" style="width:100%;margin-bottom:14px;padding:8px 10px;font-size:13px;border-radius:6px">
            <option value="">— Bitiş Yılı —</option>
            ${[...yillar].reverse().map(y => `<option value="${y}">${y}</option>`).join('')}
          </select>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);margin-bottom:10px">Dahil Edilecek Bölümler</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
            ${sections.map(s => `<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;transition:border-color .15s" class="pitch-sec-lbl">
              <input type="checkbox" id="ps-${s.id}" checked style="accent-color:#6366F1;width:15px;height:15px;flex-shrink:0">
              <div style="flex:1">
                <div style="font-size:12.5px;font-weight:600">${s.lbl}</div>
                <div style="font-size:10.5px;color:var(--t3)">${s.desc}</div>
              </div>
            </label>`).join('')}
          </div>
          <button class="btn" id="pitch-start-btn" onclick="window._startPitch()" style="width:100%;justify-content:center;padding:12px;font-size:13.5px;font-weight:700;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;border-radius:10px;gap:8px">
            🚀 Sunumu Oluştur
          </button>
        </div>
      </div>
      <!-- Sağ Panel: Önizleme -->
      <div class="card cp" style="min-height:500px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,rgba(99,102,241,.05),rgba(139,92,246,.05))">
        <div style="font-size:64px;margin-bottom:20px;opacity:.5">🎯</div>
        <div style="font-size:18px;font-weight:800;color:var(--t1);margin-bottom:10px">Sunum Hazır Değil</div>
        <div style="font-size:13.5px;color:var(--t3);max-width:300px;line-height:1.6">Sol panelden dönem ve bölüm seçimini yaparak "Sunumu Oluştur" butonuna tıklayın.</div>
        <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
          <span style="padding:5px 12px;border-radius:99px;background:var(--blue-50);color:var(--blue);font-size:11px;font-weight:600">📊 Finansal Analiz</span>
          <span style="padding:5px 12px;border-radius:99px;background:var(--green-50);color:var(--green);font-size:11px;font-weight:600">📄 PDF İndir</span>
          <span style="padding:5px 12px;border-radius:99px;background:var(--amber-50);color:var(--amber);font-size:11px;font-weight:600">📊 Excel İndir</span>
        </div>
      </div>
    </div>`;
}

window._startPitch = function() {
  const bas = document.getElementById('pitch-yil-bas')?.value;
  const bit = document.getElementById('pitch-yil-bit')?.value;
  const secili = ['ozet','gelirler','giderler','karlılık','musteriler','personel','kdv','faturalar'].filter(id => document.getElementById('ps-' + id)?.checked);
  if (!bas || !bit) { toast('Lütfen başlangıç ve bitiş yılı seçin', 'warn'); return; }
  if (secili.length === 0) { toast('En az bir bölüm seçin', 'warn'); return; }

  // Loading animation
  const steps = ['Veriler derleniyor…','Finansal tablolar oluşturuluyor…','Grafikler hazırlanıyor…','Sunum formatlanıyor…','Son kontroller yapılıyor…','Sunum hazır!'];
  let si = 0;
  document.getElementById('pitch-start-btn').disabled = true;
  document.getElementById('pitch-start-btn').innerHTML = '<span style="width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;display:inline-block"></span> Hazırlanıyor…';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)';
  overlay.innerHTML = `<div style="background:var(--white);border-radius:20px;padding:40px 48px;text-align:center;max-width:440px;width:90%;box-shadow:0 30px 80px rgba(0,0,0,.3)">
    <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 20px">🚀</div>
    <div style="font-size:20px;font-weight:800;color:var(--t1);margin-bottom:8px">AI Pitch Oluşturuluyor</div>
    <div id="pitch-step" style="font-size:13.5px;color:var(--t3);margin-bottom:24px;min-height:20px">${steps[0]}</div>
    <div style="background:var(--border2);border-radius:99px;height:6px;overflow:hidden">
      <div id="pitch-prog" style="height:100%;background:linear-gradient(90deg,#6366F1,#8B5CF6);border-radius:99px;transition:width .5s ease;width:0%"></div>
    </div>
    <div id="pitch-pct" style="margin-top:8px;font-size:12px;color:var(--t3)">0%</div>
  </div>`;
  document.body.appendChild(overlay);

  const interval = setInterval(() => {
    si++;
    if (si < steps.length) {
      document.getElementById('pitch-step').textContent = steps[si];
      const pct = Math.round(si / (steps.length - 1) * 100);
      document.getElementById('pitch-prog').style.width = pct + '%';
      document.getElementById('pitch-pct').textContent = pct + '%';
    }
    if (si >= steps.length - 1) {
      clearInterval(interval);
      setTimeout(() => {
        document.body.removeChild(overlay);
        const btn = document.getElementById('pitch-start-btn');
        if (btn) { btn.disabled = false; btn.innerHTML = '🚀 Sunumu Oluştur'; }
        window._showPitchModal(bas, bit, secili);
      }, 600);
    }
  }, 600);
};

window._showPitchModal = function(bas, bit, secili) {
  const yillar = [];
  if (bas && bit) {
    for (let y = parseInt(bas); y <= parseInt(bit); y++) yillar.push(String(y));
  }
  const period = yillar.length > 1 ? `${bas}–${bit}` : bas;
  const sirket = S.settings.sirket || {};
  const tG = yillar.reduce((s, y) => s + S.gelirler.filter(g => g.tarih.startsWith(y)).reduce((a, g) => a + g.toplamTutar, 0), 0);
  const tD = yillar.reduce((s, y) => s + S.giderler.filter(g => g.tarih.startsWith(y)).reduce((a, g) => a + g.toplamTutar, 0), 0);
  const net = tG - tD;
  const totalFat = S.faturalar.length;
  const odendiFat = S.faturalar.filter(f => f.durum === 'odendi').length;
  const musteriler = S.musteriler;
  const personeller = S.personeller || [];
  const netKdvG = yillar.reduce((s, y) => s + S.gelirler.filter(g => g.tarih.startsWith(y)).reduce((a, g) => a + (g.kdvTutar||0), 0), 0);
  const netKdvD = yillar.reduce((s, y) => s + S.giderler.filter(g => g.tarih.startsWith(y)).reduce((a, g) => a + (g.kdvTutar||0), 0), 0);
  const bruttMaas = personeller.reduce((s, p) => s + (p.brutMaas || 0), 0);

  const gelirKat = {}; S.gelirler.filter(g => yillar.some(y => g.tarih.startsWith(y))).forEach(g => { gelirKat[g.kategori] = (gelirKat[g.kategori]||0) + g.toplamTutar; });
  const giderKat = {}; S.giderler.filter(g => yillar.some(y => g.tarih.startsWith(y))).forEach(g => { giderKat[g.kategori] = (giderKat[g.kategori]||0) + g.toplamTutar; });

  const custTop = musteriler.map(m => ({
    nm: m.tip === 'kurumsal' ? m.sirketAd : `${m.ad||''} ${m.soyad||''}`.trim(),
    val: S.gelirler.filter(g => g.musteri === m.id && yillar.some(y => g.tarih.startsWith(y))).reduce((s,g)=>s+g.toplamTutar,0)
  })).filter(x=>x.val>0).sort((a,b)=>b.val-a.val);

  const pitchColor = '#6366F1';
  const pitchAccent = '#8B5CF6';

  const buildSection = (id, content) => secili.includes(id) ? content : '';

  const pitchHtml = `
    <!-- KAPAK SAYFASI -->
    <div style="background:linear-gradient(135deg,${pitchColor},${pitchAccent});color:#fff;border-radius:16px 16px 0 0;padding:48px 40px;text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><circle cx=\"150\" cy=\"50\" r=\"80\" fill=\"rgba(255,255,255,.05)\"/><circle cx=\"30\" cy=\"160\" r=\"60\" fill=\"rgba(255,255,255,.04)\"/></svg>') no-repeat center/cover;pointer-events:none"></div>
      ${sirket.logo ? `<img src="${sirket.logo}" style="max-height:56px;max-width:200px;object-fit:contain;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto">` : `<div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;margin:0 auto 16px">${(sirket.ad||'G')[0].toUpperCase()}</div>`}
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;opacity:.8;margin-bottom:10px">YATIRIMCı SUNUMU</div>
      <div style="font-size:28px;font-weight:800;margin-bottom:8px">${sirket.ad || 'Şirket A.Ş.'}</div>
      <div style="font-size:14px;opacity:.8;margin-bottom:20px">Finansal Sunum — ${period}</div>
      <div style="display:inline-flex;gap:30px;background:rgba(255,255,255,.15);border-radius:12px;padding:14px 24px">
        <div style="text-align:center"><div style="font-size:10px;opacity:.7;text-transform:uppercase;margin-bottom:4px">Toplam Gelir</div><div style="font-size:18px;font-weight:800">${TL(tG)}</div></div>
        <div style="width:1px;background:rgba(255,255,255,.3)"></div>
        <div style="text-align:center"><div style="font-size:10px;opacity:.7;text-transform:uppercase;margin-bottom:4px">Net Kâr</div><div style="font-size:18px;font-weight:800;color:${net>=0?'#86efac':'#fca5a5'}">${TL(net)}</div></div>
        <div style="width:1px;background:rgba(255,255,255,.3)"></div>
        <div style="text-align:center"><div style="font-size:10px;opacity:.7;text-transform:uppercase;margin-bottom:4px">Müşteri</div><div style="font-size:18px;font-weight:800">${musteriler.length}</div></div>
      </div>
    </div>

    <div style="padding:28px 36px;font-family:'Outfit',sans-serif">
      ${buildSection('ozet', `
      <!-- FİNANSAL ÖZET -->
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${pitchColor};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${pitchColor}">01 / FİNANSAL ÖZET</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          <div style="background:#F0FDF4;border-radius:10px;padding:16px;text-align:center"><div style="font-size:10px;color:#166534;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Toplam Gelir</div><div style="font-size:20px;font-weight:800;color:#16A34A">${TL(tG)}</div></div>
          <div style="background:#FEF2F2;border-radius:10px;padding:16px;text-align:center"><div style="font-size:10px;color:#991B1B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Toplam Gider</div><div style="font-size:20px;font-weight:800;color:#DC2626">${TL(tD)}</div></div>
          <div style="background:${net>=0?'#EFF6FF':'#FEF2F2'};border-radius:10px;padding:16px;text-align:center"><div style="font-size:10px;color:${net>=0?'#1E40AF':'#991B1B'};text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Net Kâr/Zarar</div><div style="font-size:20px;font-weight:800;color:${net>=0?'#2563EB':'#DC2626'}">${TL(net)}</div></div>
          <div style="background:#FAFAFA;border-radius:10px;padding:16px;text-align:center"><div style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Kârlılık Oranı</div><div style="font-size:20px;font-weight:800;color:${net>=0?'#16A34A':'#DC2626'}">${tG>0?Math.round(net/tG*100):0}%</div></div>
        </div>
      </div>`)}

      ${buildSection('gelirler', `
      <!-- GELİR ANALİZİ -->
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${pitchColor};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${pitchColor}">02 / GELİR ANALİZİ</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${Object.entries(gelirKat).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `
          <div style="display:flex;align-items:center;gap:12px;padding:9px 12px;background:#F8FAFC;border-radius:8px">
            <div style="flex:1;font-size:13px;font-weight:500">${k}</div>
            <div style="width:160px;height:4px;background:#E2E8F0;border-radius:99px"><div style="height:100%;width:${tG>0?Math.round(v/tG*100):0}%;background:#16A34A;border-radius:99px"></div></div>
            <div style="font-size:10.5px;color:#6B7280;width:30px;text-align:right">${tG>0?Math.round(v/tG*100):0}%</div>
            <div style="font-weight:700;font-size:13px;color:#16A34A;min-width:100px;text-align:right">${TL(v)}</div>
          </div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:12px;padding:12px;background:#ECFDF5;border-radius:8px;font-weight:700"><span>TOPLAM GELİR</span><span style="color:#16A34A">${TL(tG)}</span></div>
      </div>`)}

      ${buildSection('giderler', `
      <!-- GİDER ANALİZİ -->
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${pitchColor};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${pitchColor}">03 / GİDER ANALİZİ</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${Object.entries(giderKat).sort((a,b)=>b[1]-a[1]).map(([k,v],i) => `
          <div style="display:flex;align-items:center;gap:12px;padding:9px 12px;background:#F8FAFC;border-radius:8px">
            <div style="width:8px;height:8px;border-radius:2px;background:${CAT_COLORS[i%CAT_COLORS.length]};flex-shrink:0"></div>
            <div style="flex:1;font-size:13px;font-weight:500">${k}</div>
            <div style="width:160px;height:4px;background:#E2E8F0;border-radius:99px"><div style="height:100%;width:${tD>0?Math.round(v/tD*100):0}%;background:${CAT_COLORS[i%CAT_COLORS.length]};border-radius:99px"></div></div>
            <div style="font-size:10.5px;color:#6B7280;width:30px;text-align:right">${tD>0?Math.round(v/tD*100):0}%</div>
            <div style="font-weight:700;font-size:13px;color:#DC2626;min-width:100px;text-align:right">${TL(v)}</div>
          </div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:12px;padding:12px;background:#FEF2F2;border-radius:8px;font-weight:700"><span>TOPLAM GİDER</span><span style="color:#DC2626">${TL(tD)}</span></div>
      </div>`)}

      ${buildSection('musteriler', custTop.length > 0 ? `
      <!-- MÜŞTERİ PORTFÖYÜ -->
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${pitchColor};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${pitchColor}">04 / MÜŞTERİ PORTFÖYÜ</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${custTop.slice(0,6).map((cx,i) => `<div style="display:flex;align-items:center;gap:10px;padding:12px;background:#F8FAFC;border-radius:8px">
            <div style="width:14px;font-size:11px;font-weight:700;color:#9CA3AF">#${i+1}</div>
            <div style="flex:1"><div style="font-size:12.5px;font-weight:600">${cx.nm}</div>
              <div style="margin-top:4px;height:3px;background:#E2E8F0;border-radius:99px"><div style="height:100%;width:${custTop[0].val>0?Math.round(cx.val/custTop[0].val*100):0}%;background:${pitchColor};border-radius:99px"></div></div>
            </div>
            <div style="font-weight:700;font-size:13px;color:${pitchColor};white-space:nowrap">${TL(cx.val)}</div>
          </div>`).join('')}
        </div>
      </div>` : '')}

      ${buildSection('personel', personeller.length > 0 ? `
      <!-- PERSONEL MALİYETİ -->
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${pitchColor};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${pitchColor}">05 / PERSONEL MALİYETİ</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          <div style="background:#EFF6FF;border-radius:10px;padding:14px;text-align:center"><div style="font-size:10px;color:#1E40AF;text-transform:uppercase;margin-bottom:5px">Aktif Personel</div><div style="font-size:22px;font-weight:800;color:#2563EB">${personeller.length}</div></div>
          <div style="background:#FEF3C7;border-radius:10px;padding:14px;text-align:center"><div style="font-size:10px;color:#92400E;text-transform:uppercase;margin-bottom:5px">Toplam Brüt Maaş</div><div style="font-size:18px;font-weight:800;color:#D97706">${TL(bruttMaas)}</div></div>
          <div style="background:#F0FDF4;border-radius:10px;padding:14px;text-align:center"><div style="font-size:10px;color:#166534;text-transform:uppercase;margin-bottom:5px">Kişi Başı Ort.</div><div style="font-size:18px;font-weight:800;color:#16A34A">${TL(personeller.length > 0 ? bruttMaas / personeller.length : 0)}</div></div>
        </div>
      </div>` : '')}

      ${buildSection('kdv', `
      <!-- KDV ÖZETI -->
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${pitchColor};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${pitchColor}">06 / KDV ÖZETI</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          <div style="background:#ECFDF5;border-radius:10px;padding:14px">
            <div style="font-size:10px;color:#166534;text-transform:uppercase;margin-bottom:5px">Tahsil Edilen KDV</div>
            <div style="font-size:18px;font-weight:800;color:#16A34A">${TL(netKdvG)}</div>
          </div>
          <div style="background:#FEF2F2;border-radius:10px;padding:14px">
            <div style="font-size:10px;color:#991B1B;text-transform:uppercase;margin-bottom:5px">İndirilebilir KDV</div>
            <div style="font-size:18px;font-weight:800;color:#DC2626">${TL(netKdvD)}</div>
          </div>
          <div style="background:#EFF6FF;border-radius:10px;padding:14px">
            <div style="font-size:10px;color:#1E40AF;text-transform:uppercase;margin-bottom:5px">Net Ödenecek KDV</div>
            <div style="font-size:18px;font-weight:800;color:#2563EB">${TL(Math.abs(netKdvG - netKdvD))}</div>
          </div>
        </div>
      </div>`)}

      ${buildSection('faturalar', `
      <!-- FATURA DURUMU -->
      <div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${pitchColor};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${pitchColor}">07 / FATURA DURUMU</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          <div style="background:#F8FAFC;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:10px;color:#6B7280;text-transform:uppercase;margin-bottom:5px">Toplam Fatura</div>
            <div style="font-size:22px;font-weight:800">${totalFat}</div>
          </div>
          <div style="background:#ECFDF5;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:10px;color:#166534;text-transform:uppercase;margin-bottom:5px">Tahsil Edilen</div>
            <div style="font-size:22px;font-weight:800;color:#16A34A">${odendiFat}</div>
          </div>
          <div style="background:#FEF3C7;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:10px;color:#92400E;text-transform:uppercase;margin-bottom:5px">Bekleyen</div>
            <div style="font-size:22px;font-weight:800;color:#D97706">${totalFat - odendiFat}</div>
          </div>
        </div>
      </div>`)}

      <!-- KAPANIŞ -->
      <div style="background:linear-gradient(135deg,${pitchColor},${pitchAccent});border-radius:12px;padding:24px;text-align:center;color:#fff;margin-top:12px">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px">${sirket.ad || 'Şirket A.Ş.'}</div>
        <div style="font-size:11.5px;opacity:.8">${period} Dönemi Finansal Sunum</div>
        <div style="font-size:10.5px;opacity:.6;margin-top:8px">Bu sunum GDA Finance sistemi tarafından otomatik oluşturulmuştur.</div>
      </div>
    </div>`;

  showModal(`<div class="modal-hdr">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6366F1,#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff">🚀</div>
      <div class="modal-title">Yatırımcı Sunumu — ${period}</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-light btn-sm" onclick="window._pitchExcel()">📊 Excel</button>
      <button class="btn btn-orange btn-sm" onclick="window._pitchPDF()">📄 PDF İndir</button>
      <button class="modal-close" onclick="window.closeModal()">×</button>
    </div>
  </div>
  <div class="modal-body" style="padding:0;background:#F1F5F9;max-height:78vh;overflow-y:auto">
    <div id="pitch-content" style="margin:16px;background:#fff;border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden">
      ${pitchHtml}
    </div>
  </div>`, true);

  // Store pitch data for download
  window._pitchData = { sirket: S.settings.sirket, tG, tD, net, period, gelirKat, giderKat };
};

window._pitchPDF = function() {
  toast('PDF hazırlanıyor… (Tarayıcı yazdırma penceresi açılıyor)', 'ok');
  setTimeout(() => {
    const content = document.getElementById('pitch-content');
    if (!content) return;
    const printWin = window.open('', '', 'width=900,height=700');
    printWin.document.write(`<!DOCTYPE html><html><head><title>AI Pitch — ${window._pitchData?.sirket?.ad || 'GDA Finance'}</title>
    <style>body{margin:0;font-family:'Outfit',sans-serif;background:#fff;color:#111}@page{margin:0}</style></head>
    <body>${content.innerHTML}</body></html>`);
    printWin.document.close();
    setTimeout(() => printWin.print(), 500);
  }, 200);
};

window._pitchExcel = function() {
  const d = window._pitchData || {};
  const rows = [
    ['GDA Finance — Finansal Sunum', d.period || '', '', ''],
    ['Şirket', d.sirket?.ad || '', '', ''],
    ['', '', '', ''],
    ['ÖZET', '', '', ''],
    ['Toplam Gelir', d.tG || 0, '', ''],
    ['Toplam Gider', d.tD || 0, '', ''],
    ['Net Kâr/Zarar', d.net || 0, '', ''],
    ['', '', '', ''],
    ['GELİR KATEGORİLERİ', '', '', ''],
    ...Object.entries(d.gelirKat || {}).map(([k, v]) => [k, v, '', '']),
    ['', '', '', ''],
    ['GİDER KATEGORİLERİ', '', '', ''],
    ...Object.entries(d.giderKat || {}).map(([k, v]) => [k, v, '', '']),
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `GDA_Pitch_${d.period || 'rapor'}.csv`;
  a.click();
  toast('Excel (CSV) dosyası indirildi ✓');
};
