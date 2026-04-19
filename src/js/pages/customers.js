import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY, hashColor } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';
import { navigate } from '../core/router.js';

// ── Müşteri Listesi ────────────────────────────────────────────────────────
export function renderMusteriler() {
  document.getElementById('ph-actions').innerHTML =
    `<button class="btn btn-orange" onclick="window._openMusteriModal()">YENİ MÜŞTERİ EKLE</button>`;
  document.getElementById('filter-bar').style.display = 'flex';
  document.getElementById('filter-bar').innerHTML = `
    <div style="display:flex;align-items:center;background:var(--border2);border-radius:6px;padding:0 10px">
      <input type="text" id="mus-s" placeholder="🔍 İsim, yetkili, VKN…" oninput="window._tMuster()" style="padding:6px 0;font-size:12.5px;width:220px;border:none;background:transparent">
    </div>
    <select id="mus-tip" onchange="window._tMuster()" style="padding:5px 10px;font-size:12px;border-radius:6px">
      <option value="">Tüm Tipler</option>
      <option value="kurumsal">Kurumsal</option>
      <option value="bireysel">Bireysel</option>
    </select>
    <div class="fb-grow"></div>
    <span id="mus-count" style="font-size:12px;color:var(--t3);align-self:center;font-weight:600"></span>`;

  document.getElementById('page-body').innerHTML = `
    <div class="stabs anim">
      <button class="stab active" onclick="window._switchMusStab(0)">Kart Görünümü</button>
      <button class="stab" onclick="window._switchMusStab(1)">Liste Görünümü</button>
    </div>
    <div id="mus-stab-0" id="mus-cards"></div>
    <div id="mus-stab-1" style="display:none" id="mus-table"></div>`;

  window._switchMusStab = (idx) => {
    document.querySelectorAll('.stab').forEach((b, i) => b.classList.toggle('active', i === idx));
    [0, 1].forEach(i => {
      const el = document.getElementById(`mus-stab-${i}`);
      if (el) el.style.display = i === idx ? (i === 0 ? 'block' : 'block') : 'none';
    });
    window._tMuster();
  };

  window._tMuster();
}

window._tMuster = function() {
  const q = (document.getElementById('mus-s')?.value || '').toLowerCase();
  const tip = document.getElementById('mus-tip')?.value || '';
  let rows = [...S.musteriler];
  if (q) rows = rows.filter(m => {
    const name = m.tip === 'kurumsal' ? m.sirketAd : `${m.ad} ${m.soyad}`;
    return name.toLowerCase().includes(q) || (m.yetkili || '').toLowerCase().includes(q) || (m.vkn || '').includes(q) || (m.email || '').toLowerCase().includes(q);
  });
  if (tip) rows = rows.filter(m => m.tip === tip);
  const cnt = document.getElementById('mus-count'); if (cnt) cnt.textContent = `${rows.length} müşteri`;

  const isListe = document.getElementById('mus-stab-1')?.style.display !== 'none';
  if (isListe) renderMusTable(rows);
  else renderMusCards(rows);
};

function mName(m) {
  return m.tip === 'bireysel' ? `${m.ad || ''} ${m.soyad || ''}`.trim() : (m.sirketAd || '');
}

function renderMusCards(rows) {
  const el = document.getElementById('mus-stab-0'); if (!el) return;
  if (!rows.length) {
    el.innerHTML = `<div style="text-align:center;padding:80px;color:var(--t3)"><div style="font-size:40px;margin-bottom:14px"><svg class="lucide lucide-users inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><div style="font-size:14px;font-weight:700;color:var(--t1);margin-bottom:8px">Müşteri bulunamadı</div>Yeni müşteri eklemek için "YENİ MÜŞTERİ EKLE" butonunu kullanın.<br><button class="btn btn-orange btn-sm" onclick="window._openMusteriModal()" style="margin-top:14px">MÜŞTERİ EKLE</button></div>`;
    return;
  }
  el.innerHTML = `<div class="mc-grid anim">
    ${rows.map(m => {
      const nm = mName(m);
      const totalRev = S.gelirler.filter(g => g.musteri === m.id).reduce((s, g) => s + g.toplamTutar, 0);
      const totalFat = S.faturalar.filter(f => f.musteri === m.id).length;
      const bekFat = S.faturalar.filter(f => f.musteri === m.id && f.durum !== 'odendi').length;
      const color = m.renk || hashColor(m.id || nm);
      const init = nm ? nm[0].toUpperCase() : '?';
      return `<div class="mc-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="mc-av" style="background:${color}">${init}</div>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--t1)">${nm}</div>
              <div style="font-size:11.5px;color:var(--t3);margin-top:1px">${m.tip === 'kurumsal' ? (m.yetkili || 'Kurumsal') : 'Bireysel'}</div>
            </div>
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-light btn-xs" onclick="window._openMusteriModal('${m.id}')">Düzenle</button>
          </div>
        </div>
        ${m.tip === 'kurumsal' ? `
          <div style="font-size:11.5px;color:var(--t3);margin-bottom:4px">VKN: ${m.vkn || '—'} · ${m.vergiDairesi || ''}</div>
        ` : `
          <div style="font-size:11.5px;color:var(--t3);margin-bottom:4px">TC: ${m.tc ? m.tc.slice(0,3)+'****'+m.tc.slice(-4) : '—'}</div>
        `}
        <div style="font-size:12px;color:var(--t2)">${m.tel || ''} ${m.email ? '· ' + m.email : ''}</div>
        <div class="hdivider" style="margin:12px 0"></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center">
          <div style="background:var(--bg);border-radius:8px;padding:8px 4px">
            <div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Toplam Gelir</div>
            <div style="font-size:13px;font-weight:700;color:var(--green)">${TL(totalRev)}</div>
          </div>
          <div style="background:var(--bg);border-radius:8px;padding:8px 4px">
            <div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Fatura</div>
            <div style="font-size:13px;font-weight:700">${totalFat}</div>
          </div>
          <div style="background:var(--bg);border-radius:8px;padding:8px 4px">
            <div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Bekleyen</div>
            <div style="font-size:13px;font-weight:700;color:${bekFat > 0 ? 'var(--orange)' : 'var(--t3)'}">${bekFat}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" style="width:100%;margin-top:10px;justify-content:center" onclick="window._openMusteriDetay('${m.id}')">Detayları Gör →</button>
      </div>`;
    }).join('')}
  </div>`;
}

function renderMusTable(rows) {
  const el = document.getElementById('mus-stab-1'); if (!el) return;
  if (!rows.length) { el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--t3)">Müşteri bulunamadı</div>`; return; }
  el.innerHTML = `<div class="card"><div class="tbl-wrap"><table>
    <thead><tr><th>Müşteri</th><th>Tip</th><th>VKN / TC</th><th>Yetkili</th><th>Telefon</th><th>E-posta</th><th class="tr">Toplam Gelir</th><th></th></tr></thead>
    <tbody>${rows.map(m => {
      const nm = mName(m);
      const totalRev = S.gelirler.filter(g => g.musteri === m.id).reduce((s, g) => s + g.toplamTutar, 0);
      const color = m.renk || hashColor(m.id || nm);
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${nm[0]?.toUpperCase() || '?'}</div>
          <div style="font-weight:600">${nm}</div>
        </div></td>
        <td><span class="badge ${m.tip === 'kurumsal' ? 'bg-blue' : 'bg-amber'}">${m.tip === 'kurumsal' ? 'Kurumsal' : 'Bireysel'}</span></td>
        <td style="font-size:12px;color:var(--t2)">${m.vkn || m.tc || '—'}</td>
        <td>${m.yetkili || '—'}</td>
        <td style="font-size:12.5px">${m.tel || '—'}</td>
        <td style="font-size:12px;color:var(--t2)">${m.email || '—'}</td>
        <td class="tr mono" style="font-weight:700;color:var(--green)">${TL(totalRev)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-light btn-xs" onclick="window._openMusteriModal('${m.id}')" style="margin-right:4px">Düzenle</button>
          <button class="btn btn-danger-soft btn-xs" onclick="window._delMusteri('${m.id}')">Sil</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div></div>`;
}

// ── Müşteri Detay ─────────────────────────────────────────────────────────────
window._openMusteriDetay = function(id) {
  const m = S.musteriler.find(x => x.id === id); if (!m) return;
  const nm = mName(m);
  const faturalar = S.faturalar.filter(f => f.musteri === id);
  const gelirler = S.gelirler.filter(g => g.musteri === id);
  const topGen = gelirler.reduce((s, g) => s + g.toplamTutar, 0);
  const topBek = faturalar.filter(f => f.durum !== 'odendi').reduce((s, f) => s + f.toplam, 0);
  const color = m.renk || hashColor(m.id || nm);

  showModal(`<div class="modal-hdr">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">${nm[0]?.toUpperCase()}</div>
      <div class="modal-title">${nm}</div>
    </div>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div class="modal-body">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      <div style="text-align:center;background:var(--bg);border-radius:var(--r);padding:12px">
        <div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px">Toplam Gelir</div>
        <div style="font-size:16px;font-weight:700;color:var(--green);margin-top:4px">${TL(topGen)}</div>
      </div>
      <div style="text-align:center;background:var(--bg);border-radius:var(--r);padding:12px">
        <div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px">Fatura</div>
        <div style="font-size:16px;font-weight:700;margin-top:4px">${faturalar.length}</div>
      </div>
      <div style="text-align:center;background:var(--bg);border-radius:var(--r);padding:12px">
        <div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px">Bekleyen</div>
        <div style="font-size:16px;font-weight:700;color:var(--orange);margin-top:4px">${TL(topBek)}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;font-size:13px">
      <div><span style="color:var(--t3)">Telefon:</span> <b>${m.tel || '—'}</b></div>
      <div><span style="color:var(--t3)">E-posta:</span> <b>${m.email || '—'}</b></div>
      <div><span style="color:var(--t3)">VKN:</span> <b>${m.vkn || '—'}</b></div>
      <div><span style="color:var(--t3)">Vergi Dairesi:</span> <b>${m.vergiDairesi || '—'}</b></div>
      ${m.adres ? `<div style="grid-column:1/-1"><span style="color:var(--t3)">Adres:</span> <b>${m.adres}</b></div>` : ''}
    </div>
    ${faturalar.length > 0 ? `
    <div style="font-weight:700;font-size:12px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--t3)">Son Faturalar</div>
    <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
      ${faturalar.slice(-5).reverse().map(f => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg);border-radius:6px;font-size:12.5px">
        <div><b>${f.no}</b> · ${DT(f.tarih)}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-weight:700">${TL(f.toplam)}</span>
          <span class="badge ${f.durum==='odendi'?'bg-green':f.durum==='gecikti'?'bg-red':'bg-amber'}">${f.durum}</span>
        </div>
      </div>`).join('')}
    </div>` : ''}
  </div>
  <div class="modal-ftr">
    <button class="btn btn-ghost" onclick="window.closeModal()">Kapat</button>
    <button class="btn btn-light" onclick="window.closeModal();window._openMusteriModal('${id}')">Düzenle</button>
    <button class="btn btn-orange" onclick="window.closeModal();navigate('faturalar')">Fatura Oluştur</button>
  </div>`, true);
};

// ── Müşteri Modal ─────────────────────────────────────────────────────────────
window._openMusteriModal = function(id) {
  const m = id ? S.musteriler.find(x => x.id === id) : null;
  const isKur = !m || m.tip === 'kurumsal';

  showModal(`<div class="modal-hdr">
    <div class="modal-title">Müşteri ${m ? 'Düzenle' : 'Ekle'}</div>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div class="modal-body">
    <div style="margin-bottom:14px">
      <label style="margin-bottom:8px;display:block;font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px">Müşteri Tipi</label>
      <div style="display:flex;gap:8px">
        <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--bord);border-radius:8px;cursor:pointer" id="tip-kur-lbl">
          <input type="radio" name="mus-tip" value="kurumsal" ${isKur ? 'checked' : ''} onchange="window._onMusTipChange()" style="accent-color:var(--blue)">
          <div><div style="font-weight:600;font-size:13px">🏢 Kurumsal</div><div style="font-size:11px;color:var(--t3)">Şirket / İşletme</div></div>
        </label>
        <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--bord);border-radius:8px;cursor:pointer" id="tip-bir-lbl">
          <input type="radio" name="mus-tip" value="bireysel" ${!isKur ? 'checked' : ''} onchange="window._onMusTipChange()" style="accent-color:var(--blue)">
          <div><div style="font-weight:600;font-size:13px">👤 Bireysel</div><div style="font-size:11px;color:var(--t3)">Kişi / Vatandaş</div></div>
        </label>
      </div>
    </div>
    <div id="mus-kur-fields">
      <div class="fg" style="margin-bottom:12px"><label>Şirket / Ticaret Unvanı *</label><input type="text" id="m-sirketAd" value="${m?.sirketAd || ''}" placeholder="Firma A.Ş."></div>
      <div class="form-grid c2">
        <div class="fg"><label>Yetkili Kişi</label><input type="text" id="m-yetkili" value="${m?.yetkili || ''}" placeholder="Adı Soyadı"></div>
        <div class="fg"><label>VKN</label><input type="text" id="m-vkn" value="${m?.vkn || ''}" placeholder="1234567890" maxlength="10"></div>
      </div>
      <div class="form-grid c2">
        <div class="fg"><label>Vergi Dairesi</label><input type="text" id="m-vd" value="${m?.vergiDairesi || ''}" placeholder="Kadıköy VD"></div>
        <div class="fg"><label>Web Sitesi</label><input type="text" id="m-web" value="${m?.web || ''}" placeholder="www.firma.com"></div>
      </div>
    </div>
    <div id="mus-bir-fields" style="${isKur ? 'display:none' : ''}">
      <div class="form-grid c2">
        <div class="fg"><label>Ad *</label><input type="text" id="m-ad" value="${m?.ad || ''}" placeholder="Ad"></div>
        <div class="fg"><label>Soyad *</label><input type="text" id="m-soyad" value="${m?.soyad || ''}" placeholder="Soyad"></div>
      </div>
      <div class="fg" style="margin-bottom:12px"><label>T.C. Kimlik No</label><input type="text" id="m-tc" value="${m?.tc || ''}" placeholder="12345678901" maxlength="11"></div>
    </div>
    <div class="form-grid c2">
      <div class="fg"><label>Telefon</label><input type="text" id="m-tel" value="${m?.tel || ''}" placeholder="0212 555 10 10"></div>
      <div class="fg"><label>E-posta</label><input type="email" id="m-email" value="${m?.email || ''}" placeholder="info@firma.com"></div>
    </div>
    <div class="fg"><label>Adres</label><textarea id="m-adres" rows="2" placeholder="Açık adres…">${m?.adres || ''}</textarea></div>
  </div>
  <div class="modal-ftr">
    <button class="btn btn-ghost" onclick="window.closeModal()">İptal</button>
    ${m ? `<button class="btn btn-danger-soft btn-sm" onclick="window._delMusteri('${m.id}')">Sil</button>` : ''}
    <button class="btn btn-orange" onclick="window._saveMusteri('${id || ''}')">Kaydet</button>
  </div>`, true);

  window._onMusTipChange();
};

window._onMusTipChange = function() {
  const isKur = document.querySelector('[name="mus-tip"]:checked')?.value === 'kurumsal';
  const kur = document.getElementById('mus-kur-fields');
  const bir = document.getElementById('mus-bir-fields');
  if (kur) kur.style.display = isKur ? 'block' : 'none';
  if (bir) bir.style.display = isKur ? 'none' : 'block';
};

window._saveMusteri = function(id) {
  const tip = document.querySelector('[name="mus-tip"]:checked')?.value || 'kurumsal';
  let rec;
  if (tip === 'kurumsal') {
    const ad = document.getElementById('m-sirketAd')?.value.trim();
    if (!ad) { toast('Şirket adı gerekli', 'warn'); return; }
    rec = { id: id || uid(), tip, sirketAd: ad, yetkili: document.getElementById('m-yetkili')?.value || '', vkn: document.getElementById('m-vkn')?.value || '', vergiDairesi: document.getElementById('m-vd')?.value || '', web: document.getElementById('m-web')?.value || '', tel: document.getElementById('m-tel')?.value || '', email: document.getElementById('m-email')?.value || '', adres: document.getElementById('m-adres')?.value || '', renk: id ? S.musteriler.find(x => x.id === id)?.renk : hashColor(ad) };
  } else {
    const ad = document.getElementById('m-ad')?.value.trim();
    const soyad = document.getElementById('m-soyad')?.value.trim();
    if (!ad || !soyad) { toast('Ad ve soyad gerekli', 'warn'); return; }
    rec = { id: id || uid(), tip, ad, soyad, tc: document.getElementById('m-tc')?.value || '', tel: document.getElementById('m-tel')?.value || '', email: document.getElementById('m-email')?.value || '', adres: document.getElementById('m-adres')?.value || '', renk: id ? S.musteriler.find(x => x.id === id)?.renk : hashColor(`${ad}${soyad}`) };
  }
  if (id) { const i = S.musteriler.findIndex(x => x.id === id); S.musteriler[i] = rec; } else S.musteriler.push(rec);
  saveStore(); closeModal(); renderMusteriler(); toast('Müşteri kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

window._delMusteri = function(id) {
  confirmDlg('Müşteri silinecek', 'Bu müşteriye ait geçmiş veriler etkilenebilir. Emin misiniz?', 'danger', () => {
    S.musteriler = S.musteriler.filter(m => m.id !== id); saveStore(); closeModal(); renderMusteriler(); toast('Silindi', 'warn');
  });
};
