import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY, IS_DURUMLAR } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

function musName(id) {
  if (!id) return '—';
  const m = S.musteriler.find(x => x.id === id);
  if (!m) return '—';
  return m.tip === 'kurumsal' ? m.sirketAd : `${m.ad} ${m.soyad}`;
}

// ── İş Takip ─────────────────────────────────────────────────────────────────
export function renderIsTakip() {
  document.getElementById('ph-actions').innerHTML =
    `<button class="btn btn-orange" onclick="window._openIsModal()">İŞ EKLE</button>`;
  document.getElementById('filter-bar').style.display = 'flex';
  document.getElementById('filter-bar').innerHTML = `
    <div class="stabs" style="margin-bottom:0;border:none">
      <button class="stab active" id="is-view-kanban" onclick="window._switchIsView('kanban')">Kanban</button>
      <button class="stab" id="is-view-liste" onclick="window._switchIsView('liste')">Liste</button>
    </div>
    <div class="fb-grow"></div>
    <span style="font-size:12px;color:var(--t3);align-self:center">${S.isTakip.length} iş</span>`;

  document.getElementById('page-body').innerHTML = `<div id="is-content"></div>`;
  renderIsKanban();
}

window._switchIsView = function(view) {
  document.getElementById('is-view-kanban')?.classList.toggle('active', view === 'kanban');
  document.getElementById('is-view-liste')?.classList.toggle('active', view === 'liste');
  if (view === 'kanban') renderIsKanban(); else renderIsListe();
};

function renderIsKanban() {
  document.getElementById('is-content').innerHTML = `
    <div class="kanban">
      ${IS_DURUMLAR.map(d => {
        const items = S.isTakip.filter(i => i.durum === d.val);
        return `<div class="kanban-col">
          <div class="kanban-col-hdr">
            <div style="display:flex;align-items:center;gap:7px">
              <span style="width:9px;height:9px;border-radius:50%;background:${d.color};flex-shrink:0"></span>
              <span class="kanban-col-title">${d.lbl}</span>
            </div>
            <span class="kanban-count" style="background:rgba(0,0,0,.06);color:var(--t2)">${items.length}</span>
          </div>
          ${items.map(it => {
            const onc = { yuksek: 'onc-yuksek', orta: 'onc-orta', dusuk: 'onc-dusuk' };
            const mName = musName(it.musteri);
            return `<div class="kanban-card" onclick="window._openIsModal('${it.id}')">
              <div class="kanban-card-title">${it.baslik}</div>
              ${mName !== '—' ? `<div style="font-size:12px;color:var(--t2);margin-bottom:6px">${mName}</div>` : ''}
              <div class="kanban-card-meta">
                <span class="onc-badge ${onc[it.oncelik] || 'onc-orta'}">${it.oncelik === 'yuksek' ? 'YÜKSEK' : it.oncelik === 'orta' ? 'ORTA' : 'DÜŞÜK'}</span>
                ${it.tutar ? `<span style="margin-left:auto;font-weight:600;color:var(--blue);font-size:11.5px">${TL(it.tutar)}</span>` : ''}
              </div>
              ${it.bitis ? `<div style="font-size:11px;color:var(--t3);margin-top:6px">Bitiş: ${DT(it.bitis)}</div>` : ''}
            </div>`;
          }).join('')}
          <button class="btn btn-ghost btn-xs" style="width:100%;justify-content:center;margin-top:4px" onclick="window._openIsModal(null,'${d.val}')">EKLE</button>
        </div>`;
      }).join('')}
    </div>`;
}

function renderIsListe() {
  document.getElementById('is-content').innerHTML = `
    <div class="card"><div class="tbl-wrap"><table>
      <thead><tr><th>İş Adı</th><th>Müşteri</th><th>Öncelik</th><th>Başlangıç</th><th>Bitiş</th><th class="tr">Tutar</th><th>Durum</th><th></th></tr></thead>
      <tbody>${S.isTakip.map(it => {
        const d = IS_DURUMLAR.find(x => x.val === it.durum);
        const onc = { yuksek: 'bg-red', orta: 'bg-amber', dusuk: 'bg-green' };
        return `<tr>
          <td style="font-weight:600">${it.baslik}</td>
          <td>${musName(it.musteri)}</td>
          <td><span class="badge ${onc[it.oncelik] || 'bg-gray'}">${it.oncelik === 'yuksek' ? 'Yüksek' : it.oncelik === 'orta' ? 'Orta' : 'Düşük'}</span></td>
          <td style="font-size:12px;color:var(--t3)">${it.baslangic ? DT(it.baslangic) : '—'}</td>
          <td style="font-size:12px;color:var(--t3)">${it.bitis ? DT(it.bitis) : '—'}</td>
          <td class="tr mono">${it.tutar ? TL(it.tutar) : '—'}</td>
          <td><span class="badge" style="background:${d?.color||'#888'}22;color:${d?.color||'#888'}">${d?.lbl || it.durum}</span></td>
          <td style="white-space:nowrap">
            <button class="btn btn-light btn-xs" onclick="window._openIsModal('${it.id}')" style="margin-right:4px">Düzenle</button>
            <button class="btn btn-danger-soft btn-xs" onclick="window._delIs('${it.id}')">Sil</button>
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
}

window._openIsModal = function(id, defDurum) {
  const it = id ? S.isTakip.find(x => x.id === id) : null;
  showModal(`<div class="modal-hdr"><div class="modal-title">İş ${it ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="fg" style="margin-bottom:12px"><label>İş Adı *</label><input type="text" id="is-baslik" value="${it?.baslik || ''}" placeholder="Projenin adı"></div>
    <div class="form-grid c2">
      <div class="fg"><label>Müşteri</label><select id="is-musteri"><option value="">— Seç —</option>${S.musteriler.map(m => `<option value="${m.id}" ${it?.musteri === m.id ? 'selected' : ''}>${musName(m.id)}</option>`).join('')}</select></div>
      <div class="fg"><label>Etiket</label><input type="text" id="is-etiket" value="${it?.etiket || ''}" placeholder="Tasarım, Yazılım, vb."></div>
    </div>
    <div class="form-grid c2">
      <div class="fg"><label>Durum</label><select id="is-durum">${IS_DURUMLAR.map(d => `<option value="${d.val}" ${(it?.durum || defDurum || 'bekliyor') === d.val ? 'selected' : ''}>${d.lbl}</option>`).join('')}</select></div>
      <div class="fg"><label>Öncelik</label><select id="is-onc"><option value="dusuk" ${it?.oncelik==='dusuk'?'selected':''}>Düşük</option><option value="orta" ${!it||it.oncelik==='orta'?'selected':''}>Orta</option><option value="yuksek" ${it?.oncelik==='yuksek'?'selected':''}>Yüksek</option></select></div>
    </div>
    <div class="form-grid c2">
      <div class="fg"><label>Başlangıç</label><input type="date" id="is-bas" value="${it?.baslangic || TODAY()}"></div>
      <div class="fg"><label>Bitiş</label><input type="date" id="is-bit" value="${it?.bitis || ''}"></div>
    </div>
    <div class="fg" style="margin-bottom:12px"><label>Proje Tutarı (₺)</label><input type="number" id="is-tutar" value="${it?.tutar || ''}" min="0" step="100" placeholder="0"></div>
    <div class="fg"><label>Notlar</label><textarea id="is-not" rows="2" placeholder="Ek bilgiler…">${it?.notlar || ''}</textarea></div>
  </div>
  <div class="modal-ftr">
    <button class="btn btn-ghost" onclick="window.closeModal()">İptal</button>
    ${it ? `<button class="btn btn-danger-soft btn-sm" onclick="window._delIs('${it.id}')">Sil</button>` : ''}
    <button class="btn btn-orange" onclick="window._saveIs('${id || ''}')">Kaydet</button>
  </div>`);
};

window._saveIs = function(id) {
  const baslik = document.getElementById('is-baslik').value.trim();
  if (!baslik) { toast('İş adı gerekli', 'warn'); return; }
  const rec = { id: id || uid(), baslik, musteri: document.getElementById('is-musteri').value, etiket: document.getElementById('is-etiket').value, durum: document.getElementById('is-durum').value, oncelik: document.getElementById('is-onc').value, baslangic: document.getElementById('is-bas').value, bitis: document.getElementById('is-bit').value, tutar: parseFloat(document.getElementById('is-tutar').value) || 0, atanan: '', notlar: document.getElementById('is-not').value };
  if (id) { const i = S.isTakip.findIndex(x => x.id === id); S.isTakip[i] = rec; } else S.isTakip.push(rec);
  saveStore(); closeModal(); renderIsTakip(); toast('Kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

window._delIs = function(id) {
  confirmDlg('İş silinecek', 'Bu iş kaydı kaldırılacak. Emin misiniz?', 'danger', () => {
    S.isTakip = S.isTakip.filter(x => x.id !== id); saveStore(); closeModal(); renderIsTakip(); toast('Silindi', 'warn');
  });
};
