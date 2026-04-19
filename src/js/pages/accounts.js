import { S, saveStore } from '../core/state.js';
import { TL, uid, TODAY, MS, KART_TIPLER, KART_RENKLER } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

// ── Hesaplar (Kasa & Banka) ───────────────────────────────────────────────────
export function renderHesaplar() {
  document.getElementById('ph-actions').innerHTML =
    `<button class="btn btn-orange" onclick="window._openHesapModal()">HESAP EKLE</button>`;
  document.getElementById('filter-bar').style.display = 'none';
  const topToplam = S.hesaplar.reduce((s, h) => s + h.bakiye, 0);
  const kasaToplam = S.hesaplar.filter(h => h.tip === 'kasa').reduce((s, h) => s + h.bakiye, 0);
  const bankaToplam = S.hesaplar.filter(h => h.tip === 'banka').reduce((s, h) => s + h.bakiye, 0);
  document.getElementById('page-body').innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Varlık</div><div class="sc-val" style="color:var(--blue)">${TL(topToplam)}</div></div>
      <div class="sc"><div class="sc-label">Kasa Toplamı</div><div class="sc-val">${TL(kasaToplam)}</div></div>
      <div class="sc"><div class="sc-label">Banka Toplamı</div><div class="sc-val">${TL(bankaToplam)}</div></div>
    </div>
    <div class="card anim d1"><div class="tbl-wrap"><table>
      <thead><tr><th>Hesap Adı</th><th>Tip</th><th class="tr">Bakiye</th><th></th></tr></thead>
      <tbody>${S.hesaplar.map(h => `<tr>
        <td style="font-weight:600">${h.ad}</td>
        <td><span class="badge ${h.tip === 'kasa' ? 'bg-amber' : 'bg-blue'}">${h.tip === 'kasa' ? 'Kasa' : 'Banka'}</span></td>
        <td class="tr mono" style="font-weight:700;font-size:15px;color:${h.bakiye >= 0 ? 'var(--green)' : 'var(--red)'}">${TL(h.bakiye)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-light btn-xs" onclick="window._openHesapModal('${h.id}')" style="margin-right:4px">Düzenle</button>
          <button class="btn btn-danger-soft btn-xs" onclick="window._delHesap('${h.id}')">Sil</button>
        </td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
}

window._openHesapModal = function(id) {
  const h = id ? S.hesaplar.find(x => x.id === id) : null;
  showModal(`<div class="modal-hdr"><div class="modal-title">Hesap ${h ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="fg" style="margin-bottom:12px"><label>Hesap Adı *</label><input type="text" id="h-ad" value="${h?.ad || ''}" placeholder="ör: Garanti Vadesiz"></div>
    <div class="form-grid c2">
      <div class="fg"><label>Tip</label><select id="h-tip"><option value="kasa" ${h?.tip==='kasa'?'selected':''}>Kasa</option><option value="banka" ${!h||h.tip==='banka'?'selected':''}>Banka</option></select></div>
      <div class="fg"><label>Mevcut Bakiye (₺)</label><input type="number" id="h-bakiye" value="${h?.bakiye || 0}" step="0.01"></div>
    </div>
  </div>
  <div class="modal-ftr"><button class="btn btn-ghost" onclick="window.closeModal()">İptal</button><button class="btn btn-orange" onclick="window._saveHesap('${id || ''}')">Kaydet</button></div>`);
};

window._saveHesap = function(id) {
  const ad = document.getElementById('h-ad').value.trim();
  if (!ad) { toast('Hesap adı gerekli', 'warn'); return; }
  const rec = { id: id || uid(), ad, tip: document.getElementById('h-tip').value, bakiye: parseFloat(document.getElementById('h-bakiye').value) || 0 };
  if (id) { const i = S.hesaplar.findIndex(x => x.id === id); S.hesaplar[i] = rec; } else S.hesaplar.push(rec);
  saveStore(); closeModal(); renderHesaplar(); toast('Hesap kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

window._delHesap = function(id) {
  confirmDlg('Hesap silinecek', 'Bu hesap kaldırılacak. Emin misiniz?', 'danger', () => {
    S.hesaplar = S.hesaplar.filter(h => h.id !== id); saveStore(); renderHesaplar(); toast('Silindi', 'warn');
  });
};

// ── Kart Yönetimi ─────────────────────────────────────────────────────────────
export function renderKartlar() {
  document.getElementById('ph-actions').innerHTML =
    `<button class="btn btn-orange" onclick="window._openKartModal()">KART EKLE</button>`;
  document.getElementById('filter-bar').style.display = 'none';

  document.getElementById('page-body').innerHTML = `
    <div class="stabs anim">
      <button class="stab active" onclick="window._switchStabK(0)">Kart Listesi</button>
      <button class="stab" onclick="window._switchStabK(1)">Aylık Bakiye Özeti</button>
    </div>
    <div id="stab-k-0">
      <div class="sc-row anim">
        <div class="sc"><div class="sc-label">Toplam Kart</div><div class="sc-val">${S.kartlar.length}</div></div>
      </div>
      ${S.kartlar.length === 0 ? `<div style="text-align:center;padding:60px;color:var(--t3)"><div style="font-size:40px;margin-bottom:12px"><svg class="lucide lucide-credit-card inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg></div>Henüz kart eklenmemiş<br><button class="btn btn-orange btn-sm" onclick="window._openKartModal()" style="margin-top:14px">+ İlk Kartı Ekle</button></div>` : `
      <div class="kart-grid anim d1">
        ${S.kartlar.map(k => {
          const sira = [...k.bakiyeler].sort((a, b) => b.ay.localeCompare(a.ay));
          const sonBak = sira[0]?.tutar || 0;
          const tipObj = KART_TIPLER.find(t => t.val === k.tip) || KART_TIPLER[0];
          return `<div class="kart-3d ${k.renk || 'kart-siyah'}" onclick="window._renderKartDetay('${k.id}')">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div class="kart-tip-badge">${tipObj.icon} ${tipObj.lbl}</div>
                <div class="kart-name" style="margin-top:10px">${k.ad}</div>
                <div class="kart-bank" style="margin-top:3px">${k.banka || ''}</div>
              </div>
              <div class="kart-chip" style="font-size:9px;opacity:0.6">CHIP</div>
            </div>
            <div>
              <div class="kart-no">•••• •••• •••• ${k.sonDort || '????'}</div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:12px">
                <div>
                  <div style="font-size:9px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.6px">Güncel Bakiye</div>
                  <div class="kart-bakiye">${TL(sonBak)}</div>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-xs" style="background:rgba(255,255,255,.15);color:#fff;border:none;font-size:11px" onclick="event.stopPropagation();window._openBakiyeModal('${k.id}')">YÜKLE</button>
                  <button class="btn btn-xs" style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:none;font-size:11px" onclick="event.stopPropagation();window._confirmSilKart('${k.id}')">SİL</button>
                </div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`}
    </div>
    <div id="stab-k-1" style="display:none">${buildAylikKartOzeti()}</div>`;

  window._switchStabK = (idx) => {
    document.querySelectorAll('.stab').forEach((b, i) => b.classList.toggle('active', i === idx));
    [0, 1].forEach(i => {
      const el = document.getElementById(`stab-k-${i}`);
      if (el) el.style.display = i === idx ? 'block' : 'none';
    });
  };
}

function buildAylikKartOzeti() {
  if (!S.kartlar.length) return `<div style="text-align:center;padding:40px;color:var(--t3)">Kart bulunmuyor</div>`;
  const aylar = [...new Set(S.kartlar.flatMap(k => k.bakiyeler.map(b => b.ay)))].sort().reverse().slice(0, 12);
  if (!aylar.length) return `<div style="text-align:center;padding:40px;color:var(--t3)">Bakiye geçmişi yok</div>`;
  return `<div class="card"><div class="tbl-wrap"><table>
    <thead><tr><th>Kart</th><th>Tür</th>${aylar.map(a => `<th class="tc">${MS[parseInt(a.split('-')[1]) - 1]} ${a.split('-')[0]}</th>`).join('')}<th class="tr">Toplam</th></tr></thead>
    <tbody>${S.kartlar.map(k => {
      const tipObj = KART_TIPLER.find(t => t.val === k.tip);
      const toplam = k.bakiyeler.reduce((s, b) => s + b.tutar, 0);
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:50%;background:${k.renk === 'kart-mavi' ? 'var(--blue)' : k.renk === 'kart-yesil' ? 'var(--green)' : k.renk === 'kart-mor' ? 'var(--purple)' : k.renk === 'kart-kirmizi' ? 'var(--red)' : '#333'}"></div><span style="font-weight:600">${k.ad}</span></div></td>
        <td><span class="badge bg-blue">${tipObj?.icon || ''} ${tipObj?.lbl || k.tip}</span></td>
        ${aylar.map(a => { const b = k.bakiyeler.find(x => x.ay === a); return `<td class="tc mono" style="font-size:12.5px">${b ? TL(b.tutar) : '<span style="color:var(--t3)">—</span>'}</td>`; }).join('')}
        <td class="tr mono" style="font-weight:700;color:var(--blue)">${TL(toplam)}</td>
      </tr>`;
    }).join('')}
    </tbody></table></div></div>`;
}

window._renderKartDetay = function(kartId) {
  const k = S.kartlar.find(x => x.id === kartId); if (!k) return;
  const tipObj = KART_TIPLER.find(t => t.val === k.tip) || KART_TIPLER[0];
  const sira = [...k.bakiyeler].sort((a, b) => b.ay.localeCompare(a.ay));
  const toplamYukleme = k.bakiyeler.reduce((s, b) => s + b.tutar, 0);
  document.getElementById('ph-title').textContent = k.ad;
  document.getElementById('ph-sub').textContent = `${tipObj.icon} ${tipObj.lbl} · ${k.banka || ''} · ****${k.sonDort || '????'}`;
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-ghost btn-sm" onclick="window._goBackKartlar()">← Kartlar</button>
    <button class="btn btn-light btn-sm" onclick="window._openKartModal('${k.id}')">Düzenle</button>
    <button class="btn btn-orange" onclick="window._openBakiyeModal('${k.id}')">+ Bakiye Yükle</button>`;
  document.getElementById('filter-bar').style.display = 'none';

  const chartData = sira.slice(0, 8).reverse();
  document.getElementById('page-body').innerHTML = `
    <div style="display:grid;grid-template-columns:320px 1fr;gap:16px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="kart-3d ${k.renk || 'kart-siyah'}" style="min-height:190px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div class="kart-tip-badge">${tipObj.icon} ${tipObj.lbl}</div>
              <div class="kart-name" style="margin-top:10px">${k.ad}</div>
              <div class="kart-bank" style="margin-top:3px">${k.banka || ''}</div>
            </div>
            <div class="kart-chip">EMV</div>
          </div>
          <div>
            <div class="kart-no">•••• •••• •••• ${k.sonDort || '????'}</div>
            <div style="margin-top:12px">
              <div style="font-size:9px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.6px">Son Yükleme</div>
              <div class="kart-bakiye">${TL(sira[0]?.tutar || 0)}</div>
              <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:2px">${sira[0] ? MS[parseInt(sira[0].ay.split('-')[1]) - 1] + ' ' + sira[0].ay.split('-')[0] : '—'}</div>
            </div>
          </div>
        </div>
        <div class="card cp">
          <div class="ct">Kart Özeti</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between"><span style="font-size:12.5px;color:var(--t2)">Toplam Yüklenen</span><span style="font-weight:700">${TL(toplamYukleme)}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="font-size:12.5px;color:var(--t2)">Kayıt Sayısı</span><span style="font-weight:700">${k.bakiyeler.length} ay</span></div>
            ${k.limit ? `<div style="display:flex;justify-content:space-between"><span style="font-size:12.5px;color:var(--t2)">Kart Limiti</span><span style="font-weight:700">${TL(k.limit)}</span></div>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card cp">
          <div class="ct">Aylık Bakiye Trendi</div>
          <div class="chart-box" style="height:200px"><canvas id="kartChart" role="img" aria-label="Kart bakiye trendi"></canvas></div>
        </div>
        <div class="card cp">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <div class="ct" style="margin-bottom:0">Bakiye Geçmişi</div>
            <button class="btn btn-orange btn-sm" onclick="window._openBakiyeModal('${k.id}')">+ Bakiye Ekle</button>
          </div>
          ${sira.length === 0 ? `<div style="text-align:center;padding:30px;color:var(--t3)">Bakiye kaydı yok</div>` : `
          <div style="display:flex;flex-direction:column;gap:4px">
            ${sira.map(b => `<div class="bakiye-item">
              <div>
                <div class="bakiye-ay">${MS[parseInt(b.ay.split('-')[1]) - 1]} ${b.ay.split('-')[0]}</div>
                ${b.aciklama ? `<div class="bakiye-aciklama">${b.aciklama}</div>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="bakiye-tutar">${TL(b.tutar)}</div>
                <button class="btn btn-danger-soft btn-xs" onclick="window._confirmSilBakiye('${k.id}','${b.id}')">Sil</button>
              </div>
            </div>`).join('')}
          </div>`}
        </div>
      </div>
    </div>`;

  setTimeout(() => {
    const el = document.getElementById('kartChart'); if (!el) return;
    if (window.Chart) {
      new window.Chart(el, {
        type: 'bar',
        data: {
          labels: chartData.map(b => MS[parseInt(b.ay.split('-')[1]) - 1]),
          datasets: [{ label: 'Bakiye', data: chartData.map(b => b.tutar), backgroundColor: 'rgba(37,99,235,.15)', borderColor: '#2563EB', borderWidth: 2, borderRadius: 6, borderSkipped: false }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111827', cornerRadius: 8, callbacks: { label: c => ` ${TL(c.raw)}` } } }, scales: { x: { ticks: { font: { size: 11 }, color: '#9CA3AF' }, grid: { display: false } }, y: { ticks: { callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'B ₺' : v + '₺', font: { size: 11 }, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } } }, animation: { duration: 700 } }
      });
    }
  }, 50);
};
window._goBackKartlar = () => renderKartlar();

window._openKartModal = function(id) {
  const k = id ? S.kartlar.find(x => x.id === id) : null;
  showModal(`<div class="modal-hdr"><div class="modal-title">Kart ${k ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div style="margin-bottom:14px">
      <label style="margin-bottom:8px;display:block">Kart Türü *</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${KART_TIPLER.map(t => `<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid ${(k?.tip||'yol')===t.val?'var(--blue)':'var(--border)'};border-radius:8px;cursor:pointer;background:${(k?.tip||'yol')===t.val?'var(--blue-50)':'var(--white)'}">
          <input type="radio" name="kt-tip" value="${t.val}" ${(k?.tip||'yol')===t.val?'checked':''} style="accent-color:var(--blue)" onchange="window._updateKartTipUI(this)">
          <div><div style="font-size:13px;font-weight:600">${t.icon} ${t.lbl}</div><div style="font-size:11px;color:var(--t3)">${t.desc}</div></div>
        </label>`).join('')}
      </div>
    </div>
    <div class="form-grid c2">
      <div class="fg" style="grid-column:1/-1"><label>Kart Adı *</label><input type="text" id="k-ad" value="${k?.ad || ''}" placeholder="ör: Personel Yemek Kartı"></div>
      <div class="fg"><label>Banka / Kurum</label><input type="text" id="k-banka" value="${k?.banka || ''}" placeholder="Garanti, Sodexo, vb."></div>
      <div class="fg"><label>Son 4 Hane</label><input type="text" id="k-son4" value="${k?.sonDort || ''}" placeholder="1234" maxlength="4"></div>
      <div class="fg"><label>Kart Limiti (₺)</label><input type="number" id="k-limit" value="${k?.limit || ''}" min="0" step="100" placeholder="0"></div>
      <div class="fg"><label>Kart Rengi</label><select id="k-renk">${KART_RENKLER.map(r => `<option value="${r.val}" ${(k?.renk||'kart-siyah')===r.val?'selected':''}>${r.lbl}</option>`).join('')}</select></div>
    </div>
  </div>
  <div class="modal-ftr"><button class="btn btn-ghost" onclick="window.closeModal()">İptal</button><button class="btn btn-orange" onclick="window._saveKart('${id || ''}')">Kaydet</button></div>`);
};

window._updateKartTipUI = function(el) {
  document.querySelectorAll('[name=kt-tip]').forEach(r => {
    const lbl = r.closest('label');
    lbl.style.borderColor = r.checked ? 'var(--blue)' : 'var(--border)';
    lbl.style.background = r.checked ? 'var(--blue-50)' : 'var(--white)';
  });
};

window._saveKart = function(id) {
  const ad = document.getElementById('k-ad').value.trim();
  if (!ad) { toast('Kart adı gerekli', 'warn'); return; }
  const tip = document.querySelector('[name=kt-tip]:checked')?.value || 'diger';
  const rec = { id: id || uid(), ad, tip, banka: document.getElementById('k-banka').value.trim(), sonDort: document.getElementById('k-son4').value.trim(), limit: parseFloat(document.getElementById('k-limit').value) || 0, renk: document.getElementById('k-renk').value, bakiyeler: id ? S.kartlar.find(x => x.id === id).bakiyeler : [] };
  if (id) { const i = S.kartlar.findIndex(x => x.id === id); S.kartlar[i] = rec; } else S.kartlar.push(rec);
  saveStore(); closeModal(); renderKartlar(); toast('Kart kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

window._openBakiyeModal = function(kartId) {
  const k = S.kartlar.find(x => x.id === kartId); if (!k) return;
  const tipObj = KART_TIPLER.find(t => t.val === k.tip);
  const buAy = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  showModal(`<div class="modal-hdr"><div class="modal-title">${tipObj?.icon || ''} ${k.ad} — Bakiye Yükle</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;background:var(--bg);margin-bottom:16px">
      <div><div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px">Son Bakiye</div><div style="font-size:18px;font-weight:700;color:var(--blue)">${TL(([...k.bakiyeler].sort((a,b)=>b.ay.localeCompare(a.ay))[0]?.tutar)||0)}</div></div>
      <div style="margin-left:auto;text-align:right"><div style="font-size:11px;color:var(--t3)">Kart</div><div style="font-size:13px;font-weight:600">****${k.sonDort || '????'}</div></div>
    </div>
    <div class="form-grid c2">
      <div class="fg"><label>Dönem (Ay) *</label><input type="month" id="b-ay" value="${buAy}"></div>
      <div class="fg"><label>Yüklenen Tutar (₺) *</label><input type="number" id="b-tutar" min="0" step="1" placeholder="0.00" style="font-size:18px;font-weight:700;padding:10px 12px"></div>
    </div>
    <div class="fg"><label>Açıklama</label><input type="text" id="b-aciklama" placeholder="ör: Ocak ayı yükleme"></div>
  </div>
  <div class="modal-ftr"><button class="btn btn-ghost" onclick="window.closeModal()">İptal</button><button class="btn btn-orange" onclick="window._saveBakiye('${kartId}')">Bakiyeyi Kaydet</button></div>`);
};

window._saveBakiye = function(kartId) {
  const k = S.kartlar.find(x => x.id === kartId); if (!k) return;
  const ay = document.getElementById('b-ay').value;
  const tutar = parseFloat(document.getElementById('b-tutar').value) || 0;
  if (!ay || !tutar) { toast('Dönem ve tutar gerekli', 'warn'); return; }
  const mevcut = k.bakiyeler.find(b => b.ay === ay);
  if (mevcut) {
    confirmDlg('Bakiye zaten var', `${MS[parseInt(ay.split('-')[1]) - 1]} için kayıt mevcut. Üzerine yazılsın mı?`, 'warn', () => {
      mevcut.tutar = tutar; mevcut.aciklama = document.getElementById('b-aciklama').value;
      saveStore(); closeModal(); window._renderKartDetay(kartId); toast('Bakiye güncellendi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
    }, 'Evet, Güncelle');
    return;
  }
  k.bakiyeler.push({ id: uid(), ay, tutar, aciklama: document.getElementById('b-aciklama').value });
  saveStore(); closeModal(); window._renderKartDetay(kartId); toast('Bakiye eklendi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

window._confirmSilKart = function(id) {
  const k = S.kartlar.find(x => x.id === id);
  confirmDlg('Kart silinecek', `"${k?.ad || 'Bu kart'}" ve tüm bakiye geçmişi silinecek. Emin misiniz?`, 'danger', () => {
    S.kartlar = S.kartlar.filter(x => x.id !== id); saveStore(); renderKartlar(); toast('Kart silindi', 'warn');
  });
};

window._confirmSilBakiye = function(kartId, bakId) {
  confirmDlg('Bakiye kaydı silinecek', 'Bu aya ait bakiye girişi kaldırılacak. Emin misiniz?', 'danger', () => {
    const k = S.kartlar.find(x => x.id === kartId); if (!k) return;
    k.bakiyeler = k.bakiyeler.filter(b => b.id !== bakId);
    saveStore(); window._renderKartDetay(kartId); toast('Silindi', 'warn');
  });
};
