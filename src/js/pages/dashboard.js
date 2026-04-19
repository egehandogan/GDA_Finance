import Chart from 'chart.js/auto';
import { S } from '../core/state.js';
import { TL, DT, spark, countUp } from '../utils/formatters.js';
import { navigate } from '../core/router.js';

let charts = {};

export function renderDashboard() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `<button class="btn btn-orange" onclick="navigate('gelirler')">GELİR EKLE</button>`;
  }

  // Calculate Metrics
  const totalG = S.gelirler.reduce((s, g) => s + g.toplamTutar, 0);
  const totalD = S.giderler.reduce((s, g) => s + g.toplamTutar, 0);
  const net = totalG - totalD;
  const bek = S.faturalar.filter(f => f.durum === 'bekliyor' || f.durum === 'gecikti');
  const bekTop = bek.reduce((s, f) => s + f.toplam, 0);

  // Monthly trends (Last 6 Months)
  const last6 = [];
  for(let i=5;i>=0;i--){
    const d=new Date();d.setMonth(d.getMonth()-i);
    last6.push(d.toISOString().slice(0,7));
  }
  const gd1 = last6.map(m=>S.gelirler.filter(g=>g.tarih.startsWith(m)).reduce((s,g)=>s+g.toplamTutar,0));
  const dd1 = last6.map(m=>S.giderler.filter(g=>g.tarih.startsWith(m)).reduce((s,g)=>s+g.toplamTutar,0));

  pb.innerHTML = `
    <div class="kpi-grid anim">
      ${[
        { label: 'Toplam Gelir', val: totalG, sparkData: gd1, sc: '#059669', chg: '+12%', cls: 'up' },
        { label: 'Toplam Gider', val: totalD, sparkData: dd1, sc: '#DC2626', chg: '-5%', cls: 'down' },
        { label: 'Net Kâr', val: net, sparkData: gd1.map((g,i)=>g-dd1[i]), sc: net >= 0? '#3B82F6':'#EF4444', chg: 'Gelir-Gider', cls: net>=0?'up':'down' },
        { label: 'Bekleyen Tahsilat', val: bekTop, sparkData: null, sc: '#D97706', chg: `${bek.length} Fatura`, cls: 'warn' },
      ].map(k => `
        <div class="kpi anim-scale">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-row">
            <div>
              <div class="kpi-val" style="color:${k.sc}" data-count="${k.val}">${TL(0)}</div>
              <div class="kpi-change ${k.cls}">${k.chg}</div>
            </div>
            <div class="sparkline">${k.sparkData ? spark(k.sparkData, k.sc) : ''}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card-row anim d1">
      <div class="card cp" style="flex:2">
        <div class="ct">Gelir & Gider Trendi</div>
        <div class="chart-box" style="height:240px"><canvas id="mainChart"></canvas></div>
      </div>
      <div class="card cp" style="flex:1">
        <div class="ct">Cari Dağılımı</div>
        <div class="chart-box" style="height:240px"><canvas id="distChart"></canvas></div>
      </div>
    </div>

    <div class="card-row anim d2">
      <div class="card cp">
        <div class="ct">Son İşlemler</div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>Tarih</th><th>Açıklama</th><th class="tr">Tutar</th></tr></thead>
            <tbody>
              ${[...S.gelirler, ...S.giderler].sort((a,b)=>b.tarih.localeCompare(a.tarih)).slice(0,5).map(it => `
                <tr>
                  <td style="font-size:12px;color:var(--t3)">${DT(it.tarih)}</td>
                  <td style="font-weight:500">${it.aciklama || it.kategori}</td>
                  <td class="tr mono ${it.musteri ? 'up' : 'down'}">${TL(it.toplamTutar)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count));
    renderCharts(last6, gd1, dd1);
  }, 100);
}

function renderCharts(labels, incomes, expenses) {
  if (charts.main) charts.main.destroy();
  if (charts.dist) charts.dist.destroy();

  const ctx1 = document.getElementById('mainChart');
  if (ctx1) {
    charts.main = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: labels.map(l => l.split('-')[1] + '. Ay'),
        datasets: [
          { label: 'Gelir', data: incomes, borderColor: '#059669', tension: 0.4, fill: true, backgroundColor: 'rgba(5, 150, 105, 0.05)' },
          { label: 'Gider', data: expenses, borderColor: '#DC2626', tension: 0.4, fill: true, backgroundColor: 'rgba(220, 38, 38, 0.05)' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  const ctx2 = document.getElementById('distChart');
  if (ctx2) {
    const data = {};
    S.musteriler.forEach(m => {
      data[m.sirketAd] = S.gelirler.filter(g => g.musteri === m.id).reduce((s, g) => s + g.toplamTutar, 0);
    });
    
    charts.dist = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: Object.keys(data),
        datasets: [{ data: Object.values(data), backgroundColor: ['#3B82F6', '#8B5CF6', '#F97316', '#10B981', '#EF4444'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
    });
  }
}
