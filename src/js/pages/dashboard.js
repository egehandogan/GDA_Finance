import Chart from 'chart.js/auto';
import { S } from '../core/state.js';
import { CAT_COLORS } from '../core/constants.js';
import { TL, DT, spark, countUp, months12, monthLabel, musName, musColor } from '../utils/formatters.js';
import { navigate } from '../core/router.js';

let chartReg = {};

export function renderDashboard() {
    // Actions
    const actions = document.getElementById('ph-actions');
    if (actions) {
        actions.innerHTML = `<button class="btn btn-orange" id="add-gelir-btn">+ Gelir Ekle</button>`;
        document.getElementById('add-gelir-btn')?.addEventListener('click', () => {
            // This would call openGelirModal() which we'll migrate soon
            console.log('Open Gelir Modal triggered');
        });
    }

    const M12 = months12();
    const totalG = S.gelirler.reduce((s, g) => s + g.toplamTutar, 0);
    const totalD = S.giderler.reduce((s, g) => s + g.toplamTutar, 0);
    const net = totalG - totalD;
    const bek = S.faturalar.filter(f => f.durum === 'bekliyor' || f.durum === 'gecikti');
    const bekTop = bek.reduce((s, f) => s + f.toplam, 0);
    
    const gelirM = M12.map(m => S.gelirler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + g.toplamTutar, 0));
    const giderM = M12.map(m => S.giderler.filter(g => g.tarih.startsWith(m)).reduce((s, g) => s + g.toplamTutar, 0));
    const labels = M12.map(monthLabel);

    const pb = document.getElementById('page-body');
    pb.innerHTML = `
        <div class="kpi-grid anim">
            ${[
                { label: 'Toplam Gelir', val: totalG, sparkData: gelirM, sc: '#059669', chg: 'Tüm zamanlar', cls: 'up' },
                { label: 'Toplam Gider', val: totalD, sparkData: giderM, sc: '#DC2626', chg: 'Tüm zamanlar', cls: 'down' },
                { label: 'Net Kâr', val: net, sparkData: gelirM.map((g, i) => g - giderM[i]), sc: net >= 0 ? '#059669' : '#DC2626', chg: 'Gelir − Gider', cls: net >= 0 ? 'up' : 'down' },
                { label: 'Bekleyen Tahsilat', val: bekTop, sparkData: null, sc: '#D97706', chg: `${bek.length} fatura`, cls: 'warn' },
            ].map(k => `
                <div class="kpi anim-scale">
                    <div class="kpi-label">${k.label}</div>
                    <div class="kpi-row">
                        <div>
                            <div class="kpi-val" style="color:${k.sc}" data-count="${k.val}">0</div>
                            <div class="kpi-change ${k.cls}" style="margin-top:6px; font-weight:700">${k.chg}</div>
                        </div>
                        <div class="sparkline">${k.sparkData ? spark(k.sparkData, k.sc) : ''}</div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="card-row anim d1">
            <div class="card cp" style="flex:2">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                    <div class="ct" style="margin-bottom:0">Gelir & Gider Trendi <span style="font-size:11px;color:var(--t3);font-weight:400">Son 12 Ay</span></div>
                    <div style="display:flex;gap:12px;font-size:11px">
                        <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:2px;background:#059669;display:inline-block;border-radius:2px"></span>Gelir</span>
                        <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:2px;background:#DC2626;display:inline-block;border-radius:2px;border-top:2px dashed #DC2626;height:0"></span>Gider</span>
                    </div>
                </div>
                <div class="chart-box" style="height:220px"><canvas id="lineC"></canvas></div>
            </div>
            <div class="card cp" style="flex:1">
                <div class="ct">Gider Dağılımı</div>
                <div class="chart-box" style="height:160px"><canvas id="pieC"></canvas></div>
                <div id="pie-legend" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px"></div>
            </div>
        </div>

        <div class="card-row anim d2">
            <div class="card cp">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                    <div class="ct" style="margin-bottom:0">Son Gelirler</div>
                    <a id="all-gelir-link" href="#" style="font-size:11.5px;color:var(--blue);font-weight:600;text-decoration:none;text-transform:uppercase;letter-spacing:0.5px">LİSTEYİ GÖR</a>
                </div>
                <div class="tbl-wrap">
                    <table>
                        <thead><tr><th>Tarih</th><th>Müşteri</th><th>Kategori</th><th class="tr">Tutar</th></tr></thead>
                        <tbody>
                            ${S.gelirler.slice(-6).reverse().map(g => `
                                <tr>
                                    <td style="font-size:11.5px;color:var(--t3)">${DT(g.tarih)}</td>
                                    <td>
                                        <span style="display:flex;align-items:center;gap:6px">
                                            <span style="width:6px;height:6px;border-radius:50%;background:${musColor(g.musteri)};flex-shrink:0"></span>
                                            <span style="font-weight:500;font-size:12.5px">${musName(g.musteri)}</span>
                                        </span>
                                    </td>
                                    <td><span class="badge bg-green">${g.kategori}</span></td>
                                    <td class="tr mono" style="font-weight:600;color:var(--green)">${TL(g.toplamTutar)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card cp">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                    <div class="ct" style="margin-bottom:0">Bekleyen Faturalar</div>
                    <a id="all-fat-link" href="#" style="font-size:11.5px;color:var(--blue);font-weight:600;text-decoration:none;text-transform:uppercase;letter-spacing:0.5px">YÖNET</a>
                </div>
                ${bek.length === 0 ? `
                    <div style="padding:40px;text-align:center;color:var(--t3)">
                        <div style="font-size:14px;font-weight:600;margin-bottom:4px;color:var(--t1)">TERTEMİZ</div>
                        Bekleyen fatura bulunmuyor.
                    </div>
                ` : `
                    <div style="display:flex;flex-direction:column;gap:8px">
                        ${bek.map(f => {
                            const isG = f.durum === 'gecikti';
                            return `
                                <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 13px;border-radius:var(--r);background:${isG ? 'var(--red-50)' : 'var(--amber-50)'};border:1px solid ${isG ? 'rgba(220,38,38,.12)' : 'rgba(217,119,6,.12)'}">
                                    <div>
                                        <div style="font-size:12.5px;font-weight:700;color:${isG ? 'var(--red)' : 'var(--amber)'}">${f.no}</div>
                                        <div style="font-size:11px;color:var(--t2);margin-top:1px">${musName(f.musteri)} · Vade: ${DT(f.vade)}</div>
                                    </div>
                                    <div style="font-size:13px;font-weight:700;color:${isG ? 'var(--red)' : 'var(--amber)'};font-variant-numeric:tabular-nums">${TL(f.toplam)}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        </div>
    `;

    // Event listeners
    document.getElementById('all-gelir-link')?.addEventListener('click', (e) => { e.preventDefault(); navigate('gelirler'); });
    document.getElementById('all-fat-link')?.addEventListener('click', (e) => { e.preventDefault(); navigate('faturalar'); });

    setTimeout(() => {
        document.querySelectorAll('[data-count]').forEach(el => {
            countUp(el, el.dataset.count);
        });
        buildLine(labels, gelirM, giderM);
        buildPie();
    }, 50);
}

function buildLine(labels, gd, dd) {
    const el = document.getElementById('lineC');
    if (!el) return;
    if (chartReg.line) chartReg.line.destroy();

    chartReg.line = new Chart(el, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Gelir', data: gd, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,.06)', fill: true, tension: .4, pointRadius: 3, pointBackgroundColor: '#059669', pointBorderColor: '#fff', pointBorderWidth: 2, borderWidth: 2 },
                { label: 'Gider', data: dd, borderColor: '#DC2626', backgroundColor: 'rgba(220,38,38,.04)', fill: true, tension: .4, pointRadius: 3, pointBackgroundColor: '#DC2626', pointBorderColor: '#fff', pointBorderWidth: 2, borderWidth: 2, borderDash: [5, 4] }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111827',
                    cornerRadius: 8,
                    titleFont: { size: 11 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    callbacks: { label: c => ` ${c.dataset.label}: ${TL(c.raw)}` }
                }
            },
            scales: {
                y: { ticks: { callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'B' : v, font: { size: 10 }, color: '#9CA3AF' }, grid: { color: '#F3F4F6' }, border: { dash: [3, 3] } },
                x: { ticks: { font: { size: 10 }, color: '#9CA3AF' }, grid: { display: false } }
            },
            animation: { duration: 900, easing: 'easeInOutCubic' }
        }
    });
}

function buildPie() {
    const el = document.getElementById('pieC');
    if (!el) return;
    if (chartReg.pie) chartReg.pie.destroy();

    const kat = {};
    S.giderler.forEach(g => { kat[g.kategori] = (kat[g.kategori] || 0) + g.toplamTutar; });
    const lbls = Object.keys(kat);
    const vals = Object.values(kat);

    chartReg.pie = new Chart(el, {
        type: 'doughnut',
        data: {
            labels: lbls,
            datasets: [{ data: vals, backgroundColor: CAT_COLORS.slice(0, lbls.length), borderWidth: 0, borderRadius: 3, spacing: 2 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111827',
                    cornerRadius: 8,
                    callbacks: { label: c => ` ${c.label}: ${TL(c.raw)}` }
                }
            },
            animation: { animateRotate: true, duration: 800 }
        }
    });

    const legend = document.getElementById('pie-legend');
    if (legend) {
        legend.innerHTML = lbls.map((k, i) => `
            <span style="display:flex;align-items:center;gap:4px;font-size:10.5px;color:var(--t2)">
                <span style="width:8px;height:8px;border-radius:2px;background:${CAT_COLORS[i]};flex-shrink:0;display:inline-block"></span>
                ${k}
            </span>
        `).join('');
    }
}
