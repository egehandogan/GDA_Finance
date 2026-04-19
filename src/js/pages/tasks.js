import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY, GIDER_KAT } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';
import { countUp } from '../utils/formatters.js';

// ── Ödeme Takip ───────────────────────────────────────────────────────────────
export function renderOdemeTakip() {
  document.getElementById('ph-actions').innerHTML =
    `<button class="btn btn-orange" onclick="window._openOdemeModal()">ÖDEME EKLE</button>`;
  document.getElementById('filter-bar').style.display = 'flex';
  const today = new Date();
  const geciktiTop = S.odemeTakip.filter(o => o.durum === 'gecikti').reduce((s, o) => s + o.tutar, 0);
  const bekTop = S.odemeTakip.filter(o => o.durum === 'bekliyor').reduce((s, o) => s + o.tutar, 0);
  const odendi = S.odemeTakip.filter(o => o.durum === 'odendi');
  document.getElementById('filter-bar').innerHTML = `
    <select id="odm-tip" onchange="window._renderOdemeListesi()" style="padding:5px 10px;font-size:12px;border-radius:6px">
      <option value="">Tüm Ödemeler</option>
      <option value="bekliyor">Bekliyor</option>
      <option value="gecikti">Gecikmiş</option>
      <option value="odendi">Ödendi</option>
    </select>
    <div class="fb-grow"></div>
    <span style="font-size:12px;color:var(--red);font-weight:600">Gecikmiş: ${TL(geciktiTop)}</span>
    <span style="font-size:12px;color:var(--amber);font-weight:600;margin-left:14px">Bekleyen: ${TL(bekTop)}</span>`;

  document.getElementById('page-body').innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Bekleyen</div><div class="sc-val" style="color:var(--amber)" data-count="${bekTop}">—</div></div>
      <div class="sc"><div class="sc-label">Gecikmiş</div><div class="sc-val" style="color:var(--red)" data-count="${geciktiTop}">—</div></div>
      <div class="sc"><div class="sc-label">Bu Ay Ödendi</div><div class="sc-val" style="color:var(--green)" data-count="${odendi.reduce((s,o)=>s+o.tutar,0)}">—</div></div>
      <div class="sc"><div class="sc-label">Toplam Kayıt</div><div class="sc-val">${S.odemeTakip.length}</div></div>
    </div>
    <div class="card anim d1" id="odeme-listesi"></div>`;

  setTimeout(() => {
    document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count));
    window._renderOdemeListesi();
  }, 40);
}

window._renderOdemeListesi = function() {
  const filtre = document.getElementById('odm-tip')?.value || '';
  const today = new Date();
  let rows = [...S.odemeTakip].sort((a, b) => a.vade.localeCompare(b.vade));
  if (filtre) rows = rows.filter(o => o.durum === filtre);
  const el = document.getElementById('odeme-listesi'); if (!el) return;
  if (!rows.length) { el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--t3)">Kayıt bulunamadı</div>`; return; }
  el.innerHTML = `<div class="tbl-wrap"><table>
    <thead><tr>
      <th style="width:25%">Başlık</th>
      <th style="width:15%">Alıcı / Gönderici</th>
      <th style="width:12%">Kategori</th>
      <th style="width:12%">Vade</th>
      <th style="width:10%">Tekrar</th>
      <th style="width:10%" class="tr">Tutar</th>
      <th style="width:10%">Durum</th>
      <th style="width:6%"></th>
    </tr></thead>
    <tbody>${rows.map(o => {
      const vDate = new Date(o.vade);
      const diffDays = Math.ceil((vDate - today) / (1000 * 60 * 60 * 24));
      const rowCls = o.durum === 'gecikti' ? 'gecikti' : diffDays === 0 ? 'bugun' : diffDays <= 7 && o.durum !== 'odendi' ? 'yakin' : o.durum === 'odendi' ? 'odendi' : 'normal';
      const tekrarLabel = { tek: 'Tek Seferlik', aylik: 'Aylık', yillik: 'Yıllık', haftalik: 'Haftalık' }[o.tekrar] || o.tekrar;
      const statusBadge = { bekliyor: 'bg-amber', gecikti: 'bg-red', odendi: 'bg-green' }[o.durum] || 'bg-gray';
      const statusLabel = { bekliyor: 'Bekliyor', gecikti: 'Gecikmiş', odendi: 'Ödendi' }[o.durum] || o.durum;
      return `<tr class="odm-row ${rowCls}">
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="odm-dot"></span>
            <div>
              <div style="font-weight:600;font-size:13px">${o.baslik}</div>
              ${o.notlar ? `<div style="font-size:11.5px;color:var(--t3)">${o.notlar}</div>` : ''}
            </div>
          </div>
        </td>
        <td>${o.alici || '—'}</td>
        <td><span class="badge bg-gray">${o.kategori || 'Diğer'}</span></td>
        <td style="font-size:12.5px;color:${o.durum==='gecikti'?'var(--red)':o.durum==='odendi'?'var(--t3)':'var(--t1)'};font-weight:${o.durum==='gecikti'?'700':'400'}">
          ${DT(o.vade)}
          ${diffDays === 0 && o.durum !== 'odendi' ? '<span style="font-size:10px;color:var(--orange);font-weight:700;margin-left:4px">Bugün!</span>' : ''}
          ${diffDays > 0 && diffDays <= 7 && o.durum !== 'odendi' ? `<span style="font-size:10px;color:var(--amber);margin-left:4px">${diffDays}g kaldı</span>` : ''}
        </td>
        <td style="font-size:12px;color:var(--t3)">${tekrarLabel}</td>
        <td class="tr mono" style="font-weight:700">${TL(o.tutar)}</td>
        <td><span class="badge ${statusBadge}">${statusLabel}</span></td>
        <td style="white-space:nowrap">
          ${o.durum !== 'odendi' ? `<button class="btn btn-light btn-xs" onclick="window._markOdendi('${o.id}')" style="margin-right:4px">Ödendi ✓</button>` : ''}
          <button class="btn btn-danger-soft btn-xs" onclick="window._delOdeme('${o.id}')">Sil</button>
        </td>
      </tr>`;
    }).join('')}
    </tbody></table></div>`;
};

window._openOdemeModal = function(id) {
  const o = id ? S.odemeTakip.find(x => x.id === id) : null;
  showModal(`<div class="modal-hdr"><div class="modal-title">Ödeme ${o ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="fg" style="margin-bottom:12px"><label>Başlık *</label><input type="text" id="o-baslik" value="${o?.baslik || ''}" placeholder="Ödeme adı"></div>
    <div class="form-grid c2">
      <div class="fg"><label>Alıcı / Borçlu</label><input type="text" id="o-alici" value="${o?.alici || ''}" placeholder="Firma veya kişi adı"></div>
      <div class="fg"><label>Kategori</label><select id="o-kat">${GIDER_KAT.map(k => `<option ${o?.kategori===k?'selected':''}>${k}</option>`).join('')}<option value="Tahsilat" ${o?.kategori==='Tahsilat'?'selected':''}>Tahsilat</option></select></div>
    </div>
    <div class="form-grid c2">
      <div class="fg"><label>Tutar (₺) *</label><input type="number" id="o-tutar" value="${o?.tutar || ''}" min="0" step="0.01" placeholder="0.00"></div>
      <div class="fg"><label>Vade Tarihi *</label><input type="date" id="o-vade" value="${o?.vade || TODAY()}"></div>
    </div>
    <div class="form-grid c2">
      <div class="fg"><label>Tekrar</label><select id="o-tekrar"><option value="tek" ${!o||o.tekrar==='tek'?'selected':''}>Tek Seferlik</option><option value="aylik" ${o?.tekrar==='aylik'?'selected':''}>Aylık</option><option value="haftalik" ${o?.tekrar==='haftalik'?'selected':''}>Haftalık</option><option value="yillik" ${o?.tekrar==='yillik'?'selected':''}>Yıllık</option></select></div>
      <div class="fg"><label>Durum</label><select id="o-durum"><option value="bekliyor" ${!o||o.durum==='bekliyor'?'selected':''}>Bekliyor</option><option value="odendi" ${o?.durum==='odendi'?'selected':''}>Ödendi</option><option value="gecikti" ${o?.durum==='gecikti'?'selected':''}>Gecikmiş</option></select></div>
    </div>
    <div class="fg"><label>Not</label><input type="text" id="o-not" value="${o?.notlar || ''}" placeholder="Ek bilgi"></div>
  </div>
  <div class="modal-ftr"><button class="btn btn-ghost" onclick="window.closeModal()">İptal</button><button class="btn btn-orange" onclick="window._saveOdeme('${id || ''}')">Kaydet</button></div>`);
};

window._saveOdeme = function(id) {
  const baslik = document.getElementById('o-baslik').value.trim();
  const tutar = parseFloat(document.getElementById('o-tutar').value) || 0;
  if (!baslik || !tutar) { toast('Başlık ve tutar gerekli', 'warn'); return; }
  const rec = { id: id || uid(), baslik, alici: document.getElementById('o-alici').value, kategori: document.getElementById('o-kat').value, tutar, vade: document.getElementById('o-vade').value, tekrar: document.getElementById('o-tekrar').value, durum: document.getElementById('o-durum').value, notlar: document.getElementById('o-not').value };
  if (id) { const i = S.odemeTakip.findIndex(x => x.id === id); S.odemeTakip[i] = rec; } else S.odemeTakip.push(rec);
  saveStore(); closeModal(); renderOdemeTakip(); toast('Kaydedildi ✓');
};

window._markOdendi = function(id) {
  const o = S.odemeTakip.find(x => x.id === id);
  if (o) { o.durum = 'odendi'; saveStore(); window._renderOdemeListesi(); toast('Ödeme işaretlendi ✓'); }
};

window._delOdeme = function(id) {
  confirmDlg('Ödeme kaydı silinecek', 'Bu ödeme takip kaydı kaldırılacak. Emin misiniz?', 'danger', () => {
    S.odemeTakip = S.odemeTakip.filter(x => x.id !== id); saveStore(); renderOdemeTakip(); toast('Silindi', 'warn');
  });
};
