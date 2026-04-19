import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Projects (İş Takip / Kanban) Module
 */

const IS_DURUMLAR = [
  { val: 'bekliyor', lbl: 'Bekliyor', color: '#9CA3AF' },
  { val: 'devam', lbl: 'Devam Ediyor', color: '#2563EB' },
  { val: 'inceleme', lbl: 'İncelemede', color: '#D97706' },
  { val: 'yapildi', lbl: 'Tamamlandı', color: '#059669' },
  { val: 'iptal', lbl: 'İptal', color: '#DC2626' },
];

export function renderProjects() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `<button class="btn btn-orange" onclick="window.openIsModal()">YENİ İŞ EKLE</button>`;
  }

  pb.innerHTML = `
    <div class="filter-bar no-print" style="margin-bottom:15px; border-radius:10px">
      <div class="fb-pill active" id="btn-kanban" onclick="window.switchIsView('kanban')">Kanban Görünümü</div>
      <div class="fb-pill" id="btn-list" onclick="window.switchIsView('list')">Liste Görünümü</div>
    </div>
    <div id="project-content"></div>
  `;

  window.switchIsView('kanban');
}

window.switchIsView = (view) => {
  const container = document.getElementById('project-content');
  if(!container) return;

  document.getElementById('btn-kanban').classList.toggle('active', view === 'kanban');
  document.getElementById('btn-list').classList.toggle('active', view === 'list');

  if(view === 'kanban') {
    container.innerHTML = `
      <div class="kanban anim">
        ${IS_DURUMLAR.map(d => {
          const items = S.isTakip.filter(it => it.durum === d.val);
          return `
            <div class="kanban-col">
              <div class="kanban-col-hdr">
                 <div style="display:flex;align-items:center;gap:8px">
                    <span style="width:10px;height:10px;border-radius:50%;background:${d.color}"></span>
                    <span class="kanban-col-title">${d.lbl}</span>
                 </div>
                 <span class="nav-badge" style="background:var(--border);color:var(--t2)">${items.length}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:10px">
                ${items.map(it => `
                  <div class="kanban-card anim-scale" onclick="window.openIsModal('${it.id}')">
                    <div class="kanban-card-title">${it.baslik}</div>
                    <div style="font-size:11px;color:var(--t3);margin-bottom:8px">Müşteri: ${S.musteriler.find(m => m.id === it.musteri)?.sirketAd || 'Belirsiz'}</div>
                    <div class="kanban-card-meta">
                       <span class="badge ${it.oncelik === 'yuksek' ? 'bg-red' : 'bg-blue'}" style="font-size:9px">${it.oncelik?.toUpperCase() || 'ORTA'}</span>
                       <span style="margin-left:auto;font-weight:700;color:var(--blue)">${TL(it.tutar || 0)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button class="btn btn-ghost btn-xs" style="width:100%;margin-top:10px" onclick="window.openIsModal(null, '${d.val}')">+ EKLE</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="card anim">
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>İş Adı</th><th>Müşteri</th><th>Durum</th><th class="tr">Tutar</th><th></th></tr></thead>
            <tbody>
              ${S.isTakip.map(it => `
                <tr>
                  <td style="font-weight:600">${it.baslik}</td>
                  <td>${S.musteriler.find(m => m.id === it.musteri)?.sirketAd || '—'}</td>
                  <td><span class="badge bg-gray">${IS_DURUMLAR.find(d => d.val === it.durum)?.lbl}</span></td>
                  <td class="tr mono">${TL(it.tutar || 0)}</td>
                  <td class="tr"><button class="btn btn-light btn-xs" onclick="window.openIsModal('${it.id}')">DÜZENLE</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};

window.openIsModal = (id, defDurum) => {
  const it = id ? S.isTakip.find(x => x.id === id) : null;
  showModal(`
    <div class="modal-hdr"><div class="modal-title">İş ${it ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>İş Adı / Proje Başlığı</label><input type="text" id="it-baslik" value="${it?.baslik || ''}"></div>
      <div class="form-grid c2">
         <div class="fg"><label>Müşteri</label><select id="it-mus">
           <option value="">— Seçilmedi —</option>
           ${S.musteriler.map(m => `<option value="${m.id}" ${it?.musteri === m.id ? 'selected' : ''}>${m.sirketAd}</option>`).join('')}
         </select></div>
         <div class="fg"><label>Öncelik</label><select id="it-onc">
           <option value="dusuk" ${it?.oncelik === 'dusuk' ? 'selected' : ''}>Düşük</option>
           <option value="orta" ${it?.oncelik === 'orta' || !it ? 'selected' : ''}>Orta</option>
           <option value="yuksek" ${it?.oncelik === 'yuksek' ? 'selected' : ''}>Yüksek</option>
         </select></div>
      </div>
      <div class="form-grid c2">
         <div class="fg"><label>Durum</label><select id="it-dur">
           ${IS_DURUMLAR.map(d => `<option value="${d.val}" ${ (it?.durum || defDurum) === d.val ? 'selected' : ''}>${d.lbl}</option>`).join('')}
         </select></div>
         <div class="fg"><label>Bitiş Tarihi</label><input type="date" id="it-bit" value="${it?.bitis || TODAY()}"></div>
      </div>
      <div class="fg"><label>Proje Değeri (₺)</label><input type="number" id="it-tutar" value="${it?.tutar || ''}"></div>
    </div>
    <div class="modal-ftr">
      ${it ? `<button class="btn btn-danger-soft btn-sm" onclick="window.delIs('${it.id}')">SİL</button>` : ''}
      <button class="btn btn-ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn-orange" onclick="window.saveIs('${id || ''}')">Kaydet</button>
    </div>
  `);
};

window.saveIs = (id) => {
  const baslik = document.getElementById('it-baslik').value;
  if(!baslik) return;
  const data = {
    id: id || uid(),
    baslik: baslik,
    musteri: document.getElementById('it-mus').value,
    oncelik: document.getElementById('it-onc').value,
    durum: document.getElementById('it-dur').value,
    bitis: document.getElementById('it-bit').value,
    tutar: parseFloat(document.getElementById('it-tutar').value) || 0
  };

  if(id) {
    const idx = S.isTakip.findIndex(x => x.id === id);
    S.isTakip[idx] = data;
  } else {
    S.isTakip.push(data);
  }
  saveStore();
  closeModal();
  renderProjects();
  toast('İş güncellendi ✓');
};

window.delIs = (id) => {
  confirmDlg('İş Silinecek', 'Bu iş kaydı kaldırılacaktır. Emin misiniz?', 'danger', () => {
    S.isTakip = S.isTakip.filter(x => x.id !== id);
    saveStore();
    closeModal();
    renderProjects();
    toast('Silindi', 'warn');
  });
};
