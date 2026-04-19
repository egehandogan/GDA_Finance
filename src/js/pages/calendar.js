import { S, saveStore } from '../core/state.js';
import { TL, uid, TODAY, MS, MS_LONG } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

let calState = { year: new Date().getFullYear(), month: new Date().getMonth() };

// ── Takvim ────────────────────────────────────────────────────────────────────
export function renderTakvim() {
  document.getElementById('ph-actions').innerHTML =
    `<button class="btn btn-orange" onclick="window._openCalEventModal()">ETKİNLİK EKLE</button>`;
  document.getElementById('filter-bar').style.display = 'flex';
  document.getElementById('filter-bar').innerHTML = `
    <div class="cal-nav">
      <button class="cal-nav-btn" onclick="window._calPrev()" style="font-size:11px;font-weight:700">GERİ</button>
      <div style="font-size:14px;font-weight:700;color:var(--t1);min-width:160px;text-align:center" id="cal-month-label"></div>
      <button class="cal-nav-btn" onclick="window._calNext()" style="font-size:11px;font-weight:700">İLERİ</button>
    </div>
    <div class="fb-grow"></div>
    <div style="display:flex;gap:6px;font-size:11.5px">
      <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:#059669;display:inline-block"></span>Gelir</span>
      <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:#DC2626;display:inline-block"></span>Gider</span>
      <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:#D97706;display:inline-block"></span>Fatura</span>
      <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:#7C3AED;display:inline-block"></span>Ödeme</span>
      <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:#6B7280;display:inline-block"></span>Not</span>
    </div>`;
  buildCalendar();
}

window._calPrev = function() { calState.month--; if (calState.month < 0) { calState.month = 11; calState.year--; } buildCalendar(); };
window._calNext = function() { calState.month++; if (calState.month > 11) { calState.month = 0; calState.year++; } buildCalendar(); };

function buildCalendar() {
  const label = document.getElementById('cal-month-label');
  if (label) label.textContent = `${MS_LONG[calState.month]} ${calState.year}`;
  const today = new Date();
  const firstDay = new Date(calState.year, calState.month, 1);
  const lastDay = new Date(calState.year, calState.month + 1, 0);
  let startDow = firstDay.getDay(); if (startDow === 0) startDow = 7; startDow--;

  const ym = `${calState.year}-${String(calState.month + 1).padStart(2, '0')}`;
  const gelirEvs = S.gelirler.filter(g => g.tarih.startsWith(ym)).map(g => ({ date: g.tarih, tip: 'gelir', label: `↑ ${g.aciklama || g.kategori}`, tutar: g.toplamTutar }));
  const giderEvs = S.giderler.filter(g => g.tarih.startsWith(ym)).map(g => ({ date: g.tarih, tip: 'gider', label: `↓ ${g.aciklama || g.kategori}`, tutar: g.toplamTutar }));
  const faturaEvs = S.faturalar.filter(f => f.vade && f.vade.startsWith(ym)).map(f => ({ date: f.vade, tip: 'fatura', label: `🧾 ${f.no}`, tutar: f.toplam, durum: f.durum }));
  const odemeEvs = S.odemeTakip.filter(o => o.vade && o.vade.startsWith(ym)).map(o => ({ date: o.vade, tip: 'odeme', label: `💳 ${o.baslik}`, tutar: o.tutar, durum: o.durum }));
  const manualEvs = S.calendarEvents.filter(e => e.tarih.startsWith(ym)).map(e => ({ date: e.tarih, tip: 'not', label: e.baslik, id: e.id }));
  const allEvs = [...gelirEvs, ...giderEvs, ...faturaEvs, ...odemeEvs, ...manualEvs];

  let cells = '';
  for (let i = 0; i < startDow; i++) {
    const prevDate = new Date(calState.year, calState.month, -(startDow - i - 1));
    cells += `<div class="cal-cell other-month"><span class="cal-date">${prevDate.getDate()}</span></div>`;
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${calState.year}-${String(calState.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = today.getFullYear() === calState.year && today.getMonth() === calState.month && today.getDate() === d;
    const dayEvs = allEvs.filter(e => e.date === dateStr);
    const maxShow = 3;
    const shown = dayEvs.slice(0, maxShow);
    const extra = dayEvs.length - maxShow;
    cells += `<div class="cal-cell ${isToday ? 'today' : ''}" onclick="window._openCalDay('${dateStr}')">
      <span class="cal-date">${d}</span>
      ${shown.map(e => `<span class="cal-event ${e.tip}" title="${e.label}${e.tutar ? ' — ' + TL(e.tutar) : ''}">${e.label}</span>`).join('')}
      ${extra > 0 ? `<span class="cal-more">+${extra} daha</span>` : ''}
    </div>`;
  }
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;
  for (let i = 1; i <= totalCells - (startDow + lastDay.getDate()); i++) {
    cells += `<div class="cal-cell other-month"><span class="cal-date">${i}</span></div>`;
  }

  document.getElementById('page-body').innerHTML = `
    <div class="card" style="overflow:hidden">
      <div class="cal-grid">
        ${['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(g => `<div class="cal-day-hdr">${g}</div>`).join('')}
        ${cells}
      </div>
    </div>`;
}

window._openCalDay = function(dateStr) {
  const d = new Date(dateStr);
  const allEvs = [
    ...S.gelirler.filter(g => g.tarih === dateStr).map(g => ({ tip: 'gelir', label: `Gelir: ${g.aciklama || g.kategori}`, tutar: g.toplamTutar })),
    ...S.giderler.filter(g => g.tarih === dateStr).map(g => ({ tip: 'gider', label: `Gider: ${g.aciklama || g.kategori}`, tutar: g.toplamTutar })),
    ...S.faturalar.filter(f => f.vade === dateStr).map(f => ({ tip: 'fatura', label: `Fatura: ${f.no}`, tutar: f.toplam })),
    ...S.odemeTakip.filter(o => o.vade === dateStr).map(o => ({ tip: 'odeme', label: `Ödeme: ${o.baslik}`, tutar: o.tutar })),
    ...S.calendarEvents.filter(e => e.tarih === dateStr).map(e => ({ tip: 'not', label: e.baslik, id: e.id, aciklama: e.aciklama })),
  ];
  const label = `${d.getDate()} ${MS_LONG[d.getMonth()]} ${d.getFullYear()}`;
  showModal(`<div class="modal-hdr"><div class="modal-title">${label}</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    ${allEvs.length === 0 ? `<div style="text-align:center;padding:20px;color:var(--t3)">Bu gün için kayıt yok</div>` : `
    <div style="display:flex;flex-direction:column;gap:8px">
      ${allEvs.map(e => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg);border-radius:var(--r)">
        <span class="cal-event ${e.tip}" style="pointer-events:none;padding:4px 8px;font-weight:700">${e.label.toUpperCase()}</span>
        ${e.tutar ? `<span style="margin-left:auto;font-weight:700;font-size:13px">${TL(e.tutar)}</span>` : ''}
        ${e.aciklama ? `<div style="font-size:12px;color:var(--t3);margin-top:2px">${e.aciklama}</div>` : ''}
        ${e.id ? `<button class="btn btn-danger-soft btn-xs" onclick="window._delCalEvent('${e.id}')">SİL</button>` : ''}
      </div>`).join('')}
    </div>`}
    <hr class="hdivider">
    <button class="btn btn-orange btn-sm" onclick="window.closeModal();window._openCalEventModal('${dateStr}')">ETKİNLİK EKLE</button>
  </div>`);
};

window._openCalEventModal = function(tarih) {
  showModal(`<div class="modal-hdr"><div class="modal-title">Etkinlik / Not Ekle</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="form-grid c2">
      <div class="fg" style="grid-column:1/-1"><label>Başlık *</label><input type="text" id="ce-baslik" placeholder="Etkinlik adı"></div>
      <div class="fg"><label>Tarih *</label><input type="date" id="ce-tarih" value="${tarih || TODAY()}"></div>
      <div class="fg"><label>Saat</label><input type="time" id="ce-saat" placeholder="14:00"></div>
    </div>
    <div class="form-grid c2">
      <div class="fg"><label>Tip</label><select id="ce-tip">
        <option value="not">Not</option>
        <option value="odeme">Ödeme Tarihi</option>
        <option value="tatil">Tatil / İzin</option>
        <option value="toplanti">Toplantı</option>
      </select></div>
      <div class="fg"><label>Renk</label><select id="ce-renk">
        <option value="blue">Mavi</option><option value="green">Yeşil</option>
        <option value="red">Kırmızı</option><option value="purple">Mor</option>
        <option value="amber">Sarı</option>
      </select></div>
    </div>
    <div class="fg"><label>Açıklama</label><textarea id="ce-aciklama" rows="2" placeholder="Ek bilgi…"></textarea></div>
  </div>
  <div class="modal-ftr"><button class="btn btn-ghost" onclick="window.closeModal()">İptal</button><button class="btn btn-orange" onclick="window._saveCalEvent()">Kaydet</button></div>`);
};

window._saveCalEvent = function() {
  const baslik = document.getElementById('ce-baslik').value.trim();
  const tarih = document.getElementById('ce-tarih').value;
  if (!baslik || !tarih) { toast('Başlık ve tarih gerekli', 'warn'); return; }
  S.calendarEvents.push({ id: uid(), baslik, tarih, saat: document.getElementById('ce-saat').value || null, tip: document.getElementById('ce-tip').value, renk: document.getElementById('ce-renk').value, aciklama: document.getElementById('ce-aciklama').value, tum_gun: !document.getElementById('ce-saat').value });
  saveStore(); closeModal(); buildCalendar(); toast('Etkinlik eklendi ✓');
};

window._delCalEvent = function(id) {
  confirmDlg('Etkinlik silinecek', 'Bu takvim etkinliği kaldırılacak. Emin misiniz?', 'danger', () => {
    S.calendarEvents = S.calendarEvents.filter(e => e.id !== id); saveStore(); closeModal(); buildCalendar(); toast('Silindi', 'warn');
  });
};
