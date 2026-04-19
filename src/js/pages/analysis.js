import Chart from 'chart.js/auto';
import { S } from '../core/state.js';
import { TL, spark } from '../utils/formatters.js';

/**
 * Analysis, Reports, and VAT Module
 */

let charts = {};

export function renderAnalysis() {
  const pb = document.getElementById('page-body');
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-ghost" onclick="window.navigate('raporlar')">RAPORLAR</button>
    <button class="btn btn-ghost" onclick="window.navigate('kdv')">KDV ANALİZİ</button>
  `;

  const totalG = S.gelirler.reduce((s, g) => s + g.toplamTutar, 0);
  const totalD = S.giderler.reduce((s, g) => s + g.toplamTutar, 0);
  const topCategories = {};
  S.gelirler.forEach(g => topCategories[g.kategori] = (topCategories[g.kategori] || 0) + g.toplamTutar);

  pb.innerHTML = `
    <div class="kpi-grid anim">
      <div class="metric-card anim-scale">
        <div class="mc-label">Yıllık Ortalama Gelir</div>
        <div class="mc-val" style="color:var(--green)">${TL(totalG / 12 || 0)}</div>
        <div class="mc-sparkline">${spark([10, 20, 15, 30, 25, 40], '#059669')}</div>
      </div>
      <div class="metric-card anim-scale d1">
        <div class="mc-label">Yıllık Ortalama Gider</div>
        <div class="mc-val" style="color:var(--red)">${TL(totalD / 12 || 0)}</div>
        <div class="mc-sparkline">${spark([5, 10, 8, 15, 12, 20], '#DC2626')}</div>
      </div>
    </div>

    <div class="card cp anim d1" style="margin-top:20px">
      <div class="ct">Kategori Bazlı Dağılım</div>
      <div style="height:300px"><canvas id="analChart"></canvas></div>
    </div>
  `;

  setTimeout(() => {
    const ctx = document.getElementById('analChart');
    if (ctx) {
      if (charts.anal) charts.anal.destroy();
      charts.anal = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(topCategories),
          datasets: [{ label: 'Gelir', data: Object.values(topCategories), backgroundColor: '#3B82F6', borderRadius: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }, 100);
}

export function renderRaporlar() {
  const pb = document.getElementById('page-body');
  pb.innerHTML = `
    <div class="card cp anim">
      <div class="ct">Finansal Raporlar</div>
      <p style="color:var(--t3);font-size:13px">Bu alanda detaylı Excel ve PDF aktarımları hazırlanacaktır.</p>
      <div class="hdivider"></div>
      <button class="btn btn-light" onclick="toast('PDF Hazırlanıyor...')">EKSTRE İNDİR (PDF)</button>
    </div>
  `;
}

export function renderKdv() {
  const pb = document.getElementById('page-body');
  const kdvG = S.gelirler.reduce((s, g) => s + (g.toplamTutar * 0.20), 0); // Simplified 20%
  const kdvD = S.giderler.reduce((s, g) => s + (g.toplamTutar * 0.20), 0);
  const netKdv = kdvG - kdvD;

  pb.innerHTML = `
    <div class="card cp anim" style="max-width:500px">
      <div class="ct">KDV Durum Özeti (Tahmini)</div>
      <div class="mh-section">
        <div class="mh-row"><span class="mh-label">Hesaplanan KDV (Gelir)</span><span class="mh-val">${TL(kdvG)}</span></div>
        <div class="mh-row"><span class="mh-label">İndirilecek KDV (Gider)</span><span class="mh-val">${TL(kdvD)}</span></div>
        <div class="hdivider"></div>
        <div class="mh-row net-row">
          <span class="mh-label">ÖDENECEK KDV / DEVREDEN</span>
          <span class="mh-val">${TL(netKdv)}</span>
        </div>
      </div>
      <div style="font-size:11px;color:var(--t3);margin-top:12px">
        * Bu hesaplama tüm işlemlerin %20 KDV'li olduğu varsayımıyla yapılmıştır.
      </div>
    </div>
  `;
}
