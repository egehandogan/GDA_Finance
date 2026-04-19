import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Calendar Module
 */

let calState = { month: new Date().getMonth(), year: new Date().getFullYear() };
const MS_LONG = ["OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN", "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"];

export function renderCalendar() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `
      <div class="cal-nav">
        <button class="cal-nav-btn" onclick="window.changeCalMonth(-1)">‹</button>
        <div style="font-weight:700;font-size:16px;min-width:140px;text-align:center">${MS_LONG[calState.month]} ${calState.year}</div>
        <button class="cal-nav-btn" onclick="window.changeCalMonth(1)">›</button>
      </div>
      <button class="btn btn-orange" onclick="window.openCalEventModal()">ETKİNLİK EKLE</button>
    `;
  }

  buildCalendar(pb);
}

function buildCalendar(container) {
  const firstDay = new Date(calState.year, calState.month, 1);
  const lastDay = new Date(calState.year, calState.month + 1, 0);
  let startDow = firstDay.getDay(); if(startDow===0) startDow=7; startDow--;

  const ym = `${calState.year}-${String(calState.month+1).padStart(2,'0')}`;
  
  // Combine all events (Income, Expense, Invoices, Tasks, Manual Events)
  const allEvs = [
    ...S.gelirler.filter(g => g.tarih.startsWith(ym)).map(g => ({ date: g.tarih, tip: 'gelir', label: `↑ ${g.kategori}` })),
    ...S.giderler.filter(g => g.tarih.startsWith(ym)).map(g => ({ date: g.tarih, tip: 'gider', label: `↓ ${g.kategori}` })),
    ...S.faturalar.filter(f => f.vade?.startsWith(ym)).map(f => ({ date: f.vade, tip: 'fatura', label: `🧾 ${f.no}` })),
    ...S.calendarEvents.filter(e => e.tarih.startsWith(ym)).map(e => ({ date: e.tarih, tip: 'not', label: e.baslik, id: e.id }))
  ];

  let cells = '';
  // Padding cells
  for(let i=0; i<startDow; i++) cells += `<div class="cal-cell other-month"></div>`;
  
  // Real cells
  for(let d=1; d<=lastDay.getDate(); d++) {
    const dStr = `${ym}-${String(d).padStart(2,'0')}`;
    const dayEvs = allEvs.filter(e => e.date === dStr);
    cells += `
      <div class="cal-cell ${dStr === TODAY() ? 'today' : ''}" onclick="window.openCalDay('${dStr}')">
        <span class="cal-date">${d}</span>
        ${dayEvs.slice(0,3).map(e => `<span class="cal-event ${e.tip}" title="${e.label}">${e.label}</span>`).join('')}
        ${dayEvs.length > 3 ? `<span class="cal-more">+${dayEvs.length-3} dahat</span>` : ''}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="card anim" style="overflow:hidden">
      <div class="cal-grid">
        ${['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(h => `<div class="cal-day-hdr">${h}</div>`).join('')}
        ${cells}
      </div>
    </div>
  `;
}

window.changeCalMonth = (dir) => {
  calState.month += dir;
  if(calState.month < 0) { calState.month = 11; calState.year--; }
  if(calState.month > 11) { calState.month = 0; calState.year++; }
  renderCalendar();
};

window.openCalDay = (dateStr) => {
  showModal(`
    <div class="modal-hdr"><div class="modal-title">${DT(dateStr)}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
       <div id="cal-day-items" style="display:flex;flex-direction:column;gap:8px">
          <p style="text-align:center;padding:20px;color:var(--t3)">Bu gün için detaylı görünüm hazırlanıyor...</p>
       </div>
    </div>
    <div class="modal-ftr"><button class="btn btn-orange" onclick="closeModal();window.openCalEventModal('${dateStr}')">ETKİNLİK EKLE</button></div>
  `);
};

window.openCalEventModal = (date) => {
  showModal(`
    <div class="modal-hdr"><div class="modal-title">Etkinlik / Not Ekle</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>Başlık</label><input type="text" id="ce-bas" placeholder="Toplantı, Hatırlatıcı vb."></div>
      <div class="fg"><label>Tarih</label><input type="date" id="ce-tar" value="${date || TODAY()}"></div>
    </div>
    <div class="modal-ftr">
      <button class="btn btn-ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn-orange" onclick="window.saveCalEvent()">Kaydet</button>
    </div>
  `);
};

window.saveCalEvent = () => {
  const b = document.getElementById('ce-bas').value;
  const t = document.getElementById('ce-tar').value;
  if(!b || !t) return;
  S.calendarEvents.push({ id: uid(), baslik: b, tarih: t });
  saveStore();
  closeModal();
  renderCalendar();
  toast('Takvim güncellendi ✓');
};
