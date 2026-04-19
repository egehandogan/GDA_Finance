import { S } from '../core/state.js';
import { TL, DT, MS, spark, countUp } from '../utils/formatters.js';
import { navigate } from '../core/router.js';

let charts = {};

// ── Default Widget Config ─────────────────────────────────────────────────────
const DEFAULT_WIDGETS = {
  kpi_gelir:     true,
  kpi_gider:     true,
  kpi_net:       true,
  kpi_bekleyen:  true,
  trend_chart:   true,
  dist_chart:    true,
  personel:      true,
  takvim_hafta:  true,
  son_islemler:  true,
  kart_ozetleri: true,
  fatura_durum:  true,
  musteri_top:   true,
};

function getWidgets() {
  return { ...DEFAULT_WIDGETS, ...(S.settings?.dashboardWidgets || {}) };
}

// ── Dashboard Render ─────────────────────────────────────────────────────────
export function renderDashboard() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  const fbar = document.getElementById('filter-bar');
  if (fbar) fbar.style.display = 'none';

  if (actionHdr) {
    actionHdr.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="navigate('ai-pitch')" style="gap:6px">🚀 AI Pitch</button>
      <button class="btn btn-ghost btn-sm" onclick="navigate('analiz')">Analiz</button>
      <button class="btn btn-orange" onclick="navigate('gelirler')">+ GELİR EKLE</button>`;
  }

  const w = getWidgets();

  // ── Data Calculations ────────────────────────────────────────────────────
  const totalG = S.gelirler.reduce((s, g) => s + g.toplamTutar, 0);
  const totalD = S.giderler.reduce((s, g) => s + g.toplamTutar, 0);
  const net = totalG - totalD;
  const bek = S.faturalar.filter(f => f.durum === 'bekliyor' || f.durum === 'gecikti');
  const bekTop = bek.reduce((s, f) => s + (f.toplam || 0), 0);

  const prevMonthStart = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
  const thisMonthStart = new Date().toISOString().slice(0, 7);
  const prevG = S.gelirler.filter(g => g.tarih.startsWith(prevMonthStart)).reduce((s, g) => s + g.toplamTutar, 0);
  const thisG = S.gelirler.filter(g => g.tarih.startsWith(thisMonthStart)).reduce((s, g) => s + g.toplamTutar, 0);
  const gChg = prevG > 0 ? Math.round((thisG - prevG) / prevG * 100) : 0;

  // Last 6 months
  const last6 = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); last6.push(d.toISOString().slice(0, 7)); }
  const gd1 = last6.map(m => S.gelirler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + g.toplamTutar, 0));
  const dd1 = last6.map(m => S.giderler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + g.toplamTutar, 0));

  // Personel summary
  const personeller = S.personeller || [];
  const totalMaas = personeller.reduce((s, p) => s + (p.brutMaas || 0), 0);
  const deptMap = {};
  personeller.forEach(p => { const d = p.departman || 'Diğer'; deptMap[d] = (deptMap[d] || 0) + 1; });

  // This week calendar events
  const today = new Date();
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const weekEvents = (S.calendarEvents || []).filter(e => {
    const d = new Date(e.tarih); return d >= weekStart && d <= weekEnd;
  }).sort((a, b) => a.tarih.localeCompare(b.tarih));

  // Top customers
  const custTop = S.musteriler.map(m => ({
    nm: m.tip === 'kurumsal' ? m.sirketAd : `${m.ad || ''} ${m.soyad || ''}`.trim(),
    renk: m.renk || '#2563EB',
    val: S.gelirler.filter(g => g.musteri === m.id).reduce((s, g) => s + g.toplamTutar, 0)
  })).filter(x => x.val > 0).sort((a, b) => b.val - a.val).slice(0, 5);

  // Kart özeti
  const kartlar = S.kartlar || [];
  const kartBakiye = kartlar.reduce((s, k) => s + (k.bakiye || 0), 0);
  const kartHarcama = kartlar.reduce((s, k) => s + (k.harcama || 0), 0);

  // Fatura durum
  const fatDurum = { odendi: 0, bekliyor: 0, gecikti: 0 };
  S.faturalar.forEach(f => { fatDurum[f.durum] = (fatDurum[f.durum] || 0) + 1; });

  pb.innerHTML = `
    <!-- KPI Grid -->
    ${w.kpi_gelir || w.kpi_gider || w.kpi_net || w.kpi_bekleyen ? `
    <div class="kpi-grid anim" style="grid-template-columns:repeat(${[w.kpi_gelir,w.kpi_gider,w.kpi_net,w.kpi_bekleyen].filter(Boolean).length},1fr);margin-bottom:16px">
      ${w.kpi_gelir ? `<div class="kpi">
        <div class="kpi-label">Toplam Gelir</div>
        <div class="kpi-row"><div>
          <div class="kpi-val" style="color:var(--green)" data-count="${totalG}">${TL(0)}</div>
          <div class="kpi-change ${gChg >= 0 ? 'up' : 'down'}" style="margin-top:6px">${gChg >= 0 ? '▲' : '▼'} %${Math.abs(gChg)} geçen ay</div>
        </div><div class="sparkline">${spark(gd1, '#059669')}</div></div>
      </div>` : ''}
      ${w.kpi_gider ? `<div class="kpi">
        <div class="kpi-label">Toplam Gider</div>
        <div class="kpi-row"><div>
          <div class="kpi-val" style="color:var(--red)" data-count="${totalD}">${TL(0)}</div>
          <div class="kpi-change down" style="margin-top:6px">${S.giderler.length} kayıt</div>
        </div><div class="sparkline">${spark(dd1, '#DC2626')}</div></div>
      </div>` : ''}
      ${w.kpi_net ? `<div class="kpi">
        <div class="kpi-label">Net Kâr</div>
        <div class="kpi-row"><div>
          <div class="kpi-val" style="color:${net >= 0 ? 'var(--green)' : 'var(--red)'}" data-count="${net}">${TL(0)}</div>
          <div class="kpi-change ${net >= 0 ? 'up' : 'down'}" style="margin-top:6px">%${totalG > 0 ? Math.round(net / totalG * 100) : 0} kârlılık</div>
        </div><div class="sparkline">${spark(gd1.map((g, i) => g - dd1[i]), net >= 0 ? '#059669' : '#EF4444')}</div></div>
      </div>` : ''}
      ${w.kpi_bekleyen ? `<div class="kpi">
        <div class="kpi-label">Bekleyen Tahsilat</div>
        <div class="kpi-row"><div>
          <div class="kpi-val" style="color:var(--orange)" data-count="${bekTop}">${TL(0)}</div>
          <div class="kpi-change warn" style="margin-top:6px">${bek.length} fatura bekliyor</div>
        </div></div>
      </div>` : ''}
    </div>` : ''}

    <!-- Row 1: Trend Chart + Distribution Chart -->
    ${w.trend_chart || w.dist_chart ? `
    <div class="card-row anim d1" style="margin-bottom:16px">
      ${w.trend_chart ? `<div class="card cp" style="flex:2">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="ct" style="margin-bottom:0">Gelir &amp; Gider Trendi</div>
          <div style="display:flex;gap:10px;font-size:11px">
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:2px;background:#059669;display:inline-block;border-radius:2px"></span>Gelir</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:2px;background:#DC2626;display:inline-block;border-radius:2px"></span>Gider</span>
          </div>
        </div>
        <div class="chart-box" style="height:220px"><canvas id="mainChart"></canvas></div>
      </div>` : ''}
      ${w.dist_chart ? `<div class="card cp" style="flex:1">
        <div class="ct">Müşteri Dağılımı</div>
        <div class="chart-box" style="height:220px"><canvas id="distChart"></canvas></div>
      </div>` : ''}
    </div>` : ''}

    <!-- Row 2: Personel + Takvim + Son İşlemler -->
    <div class="card-row anim d2" style="margin-bottom:16px;align-items:start">
      ${w.personel ? `<div class="card cp" style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div class="ct" style="margin-bottom:0">👥 Personel Özeti</div>
          <button class="btn btn-light btn-xs" onclick="navigate('personeller')">Tümü →</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          <div style="background:var(--blue-50);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--blue);text-transform:uppercase;font-weight:700;margin-bottom:4px">Toplam Personel</div>
            <div style="font-size:22px;font-weight:800;color:var(--blue)">${personeller.length}</div>
          </div>
          <div style="background:var(--amber-50);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--amber);text-transform:uppercase;font-weight:700;margin-bottom:4px">Toplam Brüt Maaş</div>
            <div style="font-size:14px;font-weight:800;color:var(--amber)">${TL(totalMaas)}</div>
          </div>
        </div>
        ${personeller.length === 0 ? `<div style="text-align:center;padding:20px;color:var(--t3);font-size:12.5px">Henüz personel kaydı yok</div>` :
          `<div style="display:flex;flex-direction:column;gap:4px">
            ${personeller.slice(0, 4).map(p => `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border2)">
              <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#8B5CF6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0">${(p.ad||'?')[0]}</div>
              <div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.ad} ${p.soyad||''}</div><div style="font-size:10.5px;color:var(--t3)">${p.pozisyon||'—'}</div></div>
              <div style="font-size:12px;font-weight:700;color:var(--t2)">${TL(p.brutMaas||0)}</div>
            </div>`).join('')}
            ${personeller.length > 4 ? `<div style="font-size:11.5px;color:var(--t3);text-align:center;padding:6px">+${personeller.length - 4} personel daha</div>` : ''}
          </div>`}
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
          <div style="font-size:10.5px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">Departman Dağılımı</div>
          ${Object.entries(deptMap).slice(0,4).map(([d, n]) => `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><span style="font-size:12px">${d}</span><span class="badge bg-blue">${n} kişi</span></div>`).join('')}
        </div>
      </div>` : ''}

      ${w.takvim_hafta ? `<div class="card cp" style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div class="ct" style="margin-bottom:0">📅 Bu Haftaki Etkinlikler</div>
          <button class="btn btn-light btn-xs" onclick="navigate('takvim')">Takvim →</button>
        </div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);margin-bottom:10px">
          ${weekStart.toLocaleDateString('tr-TR', { day:'numeric', month:'long' })} – ${weekEnd.toLocaleDateString('tr-TR', { day:'numeric', month:'long' })}
        </div>
        ${weekEvents.length === 0 ? `<div style="text-align:center;padding:30px 10px;color:var(--t3)"><div style="font-size:28px;margin-bottom:8px">📭</div><div style="font-size:12.5px">Bu hafta etkinlik bulunmuyor</div></div>` :
          weekEvents.slice(0, 6).map(e => `<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid var(--border2)">
            <div style="background:var(--blue-50);border-radius:6px;padding:4px 7px;text-align:center;flex-shrink:0">
              <div style="font-size:14px;font-weight:800;color:var(--blue)">${new Date(e.tarih).getDate()}</div>
              <div style="font-size:9px;color:var(--blue);text-transform:uppercase">${MS[new Date(e.tarih).getMonth()]}</div>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:600">${e.baslik || '—'}</div>
              <div style="font-size:11px;color:var(--t3);margin-top:1px">${e.aciklama || ''}</div>
            </div>
            ${e.tutar ? `<div style="font-size:12px;font-weight:700;color:var(--blue);white-space:nowrap">${TL(e.tutar)}</div>` : ''}
          </div>`).join('')}
      </div>` : ''}

      ${w.son_islemler ? `<div class="card cp" style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div class="ct" style="margin-bottom:0">🕐 Son İşlemler</div>
          <button class="btn btn-light btn-xs" onclick="navigate('gelirler')">Tümü →</button>
        </div>
        ${[...S.gelirler.map(g => ({...g, _type:'gelir'})), ...S.giderler.map(g => ({...g, _type:'gider'}))].sort((a,b)=>b.tarih.localeCompare(a.tarih)).slice(0,8).map(it => `
          <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border2)">
            <div style="width:28px;height:28px;border-radius:8px;background:${it._type==='gelir'?'var(--green-50)':'var(--red-50)'};display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">${it._type==='gelir'?'💰':'📋'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.aciklama || it.kategori || '—'}</div>
              <div style="font-size:10.5px;color:var(--t3)">${DT(it.tarih)}</div>
            </div>
            <div class="mono" style="font-size:12.5px;font-weight:700;color:${it._type==='gelir'?'var(--green)':'var(--red)'}">${TL(it.toplamTutar)}</div>
          </div>`).join('')}
        ${S.gelirler.length === 0 && S.giderler.length === 0 ? `<div style="text-align:center;padding:30px;color:var(--t3);font-size:12.5px">Henüz işlem yok</div>` : ''}
      </div>` : ''}
    </div>

    <!-- Row 3: Kart Özetleri + Müşteriler + Fatura Durum -->
    <div class="card-row anim d3" style="align-items:start">
      ${w.kart_ozetleri ? `<div class="card cp" style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div class="ct" style="margin-bottom:0">💳 Kart Özetleri</div>
          <button class="btn btn-light btn-xs" onclick="navigate('kartlar')">Kartlar →</button>
        </div>
        ${kartlar.length === 0 ? `<div style="text-align:center;padding:20px;color:var(--t3);font-size:12.5px">Kayıtlı kart yok</div>` :
          `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
            <div style="background:linear-gradient(135deg,#1E293B,#334155);border-radius:10px;padding:14px;color:#fff">
              <div style="font-size:9px;text-transform:uppercase;opacity:.7;letter-spacing:.5px;margin-bottom:6px">Toplam Bakiye</div>
              <div style="font-size:18px;font-weight:800">${TL(kartBakiye)}</div>
            </div>
            <div style="background:linear-gradient(135deg,#7C3AED,#6366F1);border-radius:10px;padding:14px;color:#fff">
              <div style="font-size:9px;text-transform:uppercase;opacity:.7;letter-spacing:.5px;margin-bottom:6px">Toplam Harcama</div>
              <div style="font-size:18px;font-weight:800">${TL(kartHarcama)}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            ${kartlar.slice(0, 4).map(k => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg);border-radius:7px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:14px">${k.tip==='yemek'?'🍽️':k.tip==='yol'?'🚌':k.tip==='akaryakit'?'⛽':'💳'}</span>
                <span style="font-size:12.5px;font-weight:600">${k.ad || k.tip}</span>
              </div>
              <span style="font-size:12.5px;font-weight:700;color:var(--blue)">${TL(k.bakiye||0)}</span>
            </div>`).join('')}
          </div>`}
      </div>` : ''}

      ${w.musteri_top && custTop.length > 0 ? `<div class="card cp" style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div class="ct" style="margin-bottom:0">🏆 En İyi Müşteriler</div>
          <button class="btn btn-light btn-xs" onclick="navigate('musteriler')">Tümü →</button>
        </div>
        ${custTop.map((cx, i) => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border2)">
          <div style="width:20px;font-size:13px;font-weight:800;color:${i===0?'#F59E0B':i===1?'#9CA3AF':i===2?'#CD7C2F':'var(--t3)'}">${i===0?'1.':i===1?'2.':i===2?'3.':(i+1)+'.'}</div>
          <div style="width:28px;height:28px;border-radius:50%;background:${cx.renk};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${cx.nm.slice(0,2).toUpperCase()}</div>
          <div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cx.nm}</div>
            <div style="margin-top:3px;height:3px;background:var(--border2);border-radius:99px"><div style="height:100%;width:${custTop[0].val>0?Math.round(cx.val/custTop[0].val*100):0}%;background:${cx.renk};border-radius:99px"></div></div>
          </div>
          <div style="font-size:12.5px;font-weight:700;color:var(--blue);white-space:nowrap">${TL(cx.val)}</div>
        </div>`).join('')}
      </div>` : ''}

      ${w.fatura_durum ? `<div class="card cp" style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div class="ct" style="margin-bottom:0">📄 Fatura Durumu</div>
          <button class="btn btn-light btn-xs" onclick="navigate('faturalar')">Faturalar →</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${[{key:'odendi',lbl:'Ödendi',c:'var(--green)',bg:'var(--green-50)',icon:'✓'},{key:'bekliyor',lbl:'Bekliyor',c:'var(--amber)',bg:'var(--amber-50)',icon:'⏳'},{key:'gecikti',lbl:'Gecikmiş',c:'var(--red)',bg:'var(--red-50)',icon:'⚠'}].map(r => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:${r.bg};border-radius:8px">
            <span style="font-size:16px">${r.icon}</span>
            <div style="flex:1"><div style="font-size:12.5px;font-weight:600;color:${r.c}">${r.lbl}</div></div>
            <div style="font-size:20px;font-weight:800;color:${r.c}">${fatDurum[r.key]||0}</div>
          </div>`).join('')}
          ${S.faturalar.length === 0 ? `<div style="text-align:center;padding:10px;color:var(--t3);font-size:12px">Henüz fatura yok</div>` : ''}
          <div style="text-align:center;font-size:11.5px;color:var(--t3);margin-top:4px">Toplam ${S.faturalar.length} fatura</div>
        </div>
      </div>` : ''}
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count));
    renderDashCharts(last6, gd1, dd1);
  }, 100);
}

function renderDashCharts(labels, incomes, expenses) {
  if (charts.main) charts.main.destroy();
  if (charts.dist) charts.dist.destroy();

  const ctx1 = document.getElementById('mainChart');
  if (ctx1) {
    charts.main = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: labels.map(l => MS[parseInt(l.split('-')[1]) - 1] || l),
        datasets: [
          { label: 'Gelir', data: incomes, borderColor: '#059669', tension: 0.4, fill: true, backgroundColor: 'rgba(5,150,105,.06)', pointRadius: 4, pointBackgroundColor: '#059669', pointBorderColor: '#fff', pointBorderWidth: 2 },
          { label: 'Gider', data: expenses, borderColor: '#DC2626', tension: 0.4, fill: true, backgroundColor: 'rgba(220,38,38,.04)', pointRadius: 4, pointBackgroundColor: '#DC2626', pointBorderColor: '#fff', pointBorderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111', cornerRadius: 8, callbacks: { label: c => ` ${c.dataset.label}: ${TL(c.raw)}` } } }, scales: { x: { ticks: { font: { size: 10 }, color: '#9CA3AF' }, grid: { display: false } }, y: { ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+'B' : v, font: { size: 10 }, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } } } }
    });
  }

  const ctx2 = document.getElementById('distChart');
  if (ctx2) {
    const data = {};
    S.musteriler.forEach(m => {
      const nm = m.tip === 'kurumsal' ? m.sirketAd : `${m.ad || ''} ${m.soyad || ''}`.trim();
      const val = S.gelirler.filter(g => g.musteri === m.id).reduce((s, g) => s + g.toplamTutar, 0);
      if (val > 0) data[nm] = val;
    });
    const keys = Object.keys(data); const vals = Object.values(data);
    charts.dist = new Chart(ctx2, {
      type: 'doughnut',
      data: { labels: keys, datasets: [{ data: vals, backgroundColor: ['#3B82F6','#8B5CF6','#F97316','#10B981','#EF4444','#EC4899'], borderWidth: 0, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 9, font: { size: 10 }, padding: 10 } }, tooltip: { callbacks: { label: c => ` ${c.label}: ${TL(c.raw)}` } } }, cutout: '62%' }
    });
  }
}
