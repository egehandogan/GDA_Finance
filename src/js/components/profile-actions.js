import { showModal, closeModal, toast } from './ui.js';
import { logout } from '../core/auth.js';
import { navigate } from '../core/router.js';
import { S } from '../core/state.js';

/**
 * Profile Related Actions — 1:1 v8 parity
 * Destek Talebi, Yönetici Atama, Profil Görüntüle, Çıkış
 */

// ── Profil Menü Toggle ────────────────────────────────────────────────────────
export function initProfilePopover() {
  const trigger = document.getElementById('sn-company-card');
  if (!trigger) return;

  trigger.onclick = (e) => {
    e.stopPropagation();
    document.getElementById('profile-popover')?.classList.toggle('active');
  };

  document.addEventListener('click', (e) => {
    const pop = document.getElementById('profile-popover');
    if (pop && !pop.contains(e.target) && !trigger.contains(e.target)) {
      pop.classList.remove('active');
    }
  });
}

function closePopover() {
  document.getElementById('profile-popover')?.classList.remove('active');
}

// ── Profil Görüntüle ──────────────────────────────────────────────────────────
export function openProfilModal() {
  closePopover();
  const u = S.user || {};
  const s = S.settings.sirket || {};

  showModal(`<div class="modal-hdr">
    <div class="modal-title">Hesap Profili</div>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div class="modal-body">
    <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--bg);border-radius:var(--rlg);margin-bottom:16px">
      <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--purple));color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;flex-shrink:0">
        ${(u.name || u.email || 'A')[0].toUpperCase()}
      </div>
      <div>
        <div style="font-size:15px;font-weight:700;color:var(--t1)">${u.name || 'Kullanıcı'}</div>
        <div style="font-size:12.5px;color:var(--t3);margin-top:2px">${u.email || '—'}</div>
        <div style="margin-top:6px"><span class="badge ${u.role === 'Admin' ? 'bg-blue' : 'bg-amber'}">${u.role || 'Viewer'}</span></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px">
      <div style="background:var(--bg);border-radius:8px;padding:10px 12px">
        <div style="color:var(--t3);font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Şirket</div>
        <div style="font-weight:600">${s.ad || '—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:10px 12px">
        <div style="color:var(--t3);font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">VKN</div>
        <div style="font-weight:600">${s.vkn || '—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:10px 12px">
        <div style="color:var(--t3);font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Telefon</div>
        <div style="font-weight:600">${s.tel || '—'}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:10px 12px">
        <div style="color:var(--t3);font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">E-posta</div>
        <div style="font-weight:600;font-size:11.5px;overflow:hidden;text-overflow:ellipsis">${s.email || '—'}</div>
      </div>
    </div>
  </div>
  <div class="modal-ftr">
    <button class="btn btn-ghost" onclick="window.closeModal()">Kapat</button>
    <button class="btn btn-light" onclick="window.closeModal();navigate('ayarlar')">Şirket Ayarları</button>
  </div>`);
}

// ── Teknik Destek ─────────────────────────────────────────────────────────────
export function openSupportModal() {
  closePopover();
  showModal(`<div class="modal-hdr">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:32px;height:32px;border-radius:8px;background:var(--blue-50);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:15px">🎧</div>
      <div class="modal-title">Teknik Destek</div>
    </div>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div class="modal-body">
    <div style="background:var(--blue-50);border-radius:var(--r);padding:12px 14px;font-size:12.5px;color:var(--blue);margin-bottom:16px;display:flex;align-items:flex-start;gap:8px;line-height:1.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
      Destek talebiniz GDA Kurumsal ekibine iletilecektir. Yanıt süremiz iş günleri içinde 24 saattir.
    </div>
    <div class="fg" style="margin-bottom:12px">
      <label>Kategori *</label>
      <select id="sup-kat" oninput="window._valSupport()">
        <option value="">— Seçiniz —</option>
        <option>Genel Sorular</option>
        <option>Gelir &amp; Gider</option>
        <option>Faturalandırma</option>
        <option>Müşteri Kayıtları</option>
        <option>Raporlama &amp; Analiz</option>
        <option>Sistem Ayarları</option>
        <option>Diğer</option>
      </select>
    </div>
    <div class="fg" style="margin-bottom:12px">
      <label>Konu *</label>
      <input type="text" id="sup-konu" placeholder="Destek başlığını yazın…" oninput="window._valSupport()">
    </div>
    <div class="fg">
      <label>Açıklama *</label>
      <textarea id="sup-desc" placeholder="Sorununuzu detaylıca açıklayın…" oninput="window._valSupport()" style="min-height:110px"></textarea>
    </div>
  </div>
  <div class="modal-ftr">
    <button class="btn btn-ghost" onclick="window.closeModal()">İptal</button>
    <button class="btn btn-blue" id="sup-btn" onclick="window._sendSupport()" disabled>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      Destek Talebi Gönder
    </button>
  </div>`);
}

window._valSupport = function() {
  const k = document.getElementById('sup-kat')?.value;
  const t = document.getElementById('sup-konu')?.value.trim();
  const d = document.getElementById('sup-desc')?.value.trim();
  const btn = document.getElementById('sup-btn');
  if (btn) btn.disabled = !(k && t && d);
};

window._sendSupport = function() {
  const btn = document.getElementById('sup-btn');
  if (!btn || btn.disabled) return;
  btn.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></span> Gönderiliyor…';
  btn.disabled = true;
  setTimeout(() => {
    showModal(`<div style="padding:48px 24px;text-align:center">
      <div style="width:64px;height:64px;background:var(--green-50);color:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 20px;border:2px solid #d1fae5">✓</div>
      <h3 style="font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;margin-bottom:10px">Destek Talebi Gönderildi</h3>
      <p style="color:var(--t3);font-size:13.5px;margin-bottom:28px;line-height:1.6">Talebiniz başarıyla iletildi.<br>GDA Kurumsal ekibi en kısa sürede geri dönüş yapacaktır.</p>
      <button class="btn btn-blue" onclick="window.closeModal();navigate('dashboard')" style="width:100%;justify-content:center">
        Tamam
      </button>
    </div>`);
  }, 900);
};

// ── Yönetici Atama ────────────────────────────────────────────────────────────
export function openSetAdminModal() {
  closePopover();
  showModal(`<div class="modal-hdr">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:32px;height:32px;border-radius:8px;background:var(--purple-50);color:var(--purple);display:flex;align-items:center;justify-content:center;font-size:15px">🔐</div>
      <div class="modal-title">Yönetici Atama</div>
    </div>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div class="modal-body">
    <div style="background:var(--amber-50);border-radius:var(--r);padding:12px 14px;font-size:12.5px;color:#92400e;margin-bottom:16px;display:flex;gap:8px;align-items:flex-start;line-height:1.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      Atanan kullanıcı sisteme <b>tam yönetici erişimi</b> kazanacaktır. Sadece kurumsal e-posta adresleri kabul edilir.
    </div>
    <div class="fg" style="margin-bottom:12px">
      <label>Kurumsal E-posta *</label>
      <input type="email" id="adm-email" placeholder="kullanici@sirket.com.tr" oninput="window._valAdmin()" autocomplete="off">
    </div>
    <div class="fg" style="margin-bottom:8px">
      <label>Geçici Şifre *</label>
      <div style="position:relative">
        <input type="password" id="adm-pass" placeholder="••••••••" oninput="window._valAdmin()" autocomplete="new-password" style="width:100%;padding-right:36px">
        <button onclick="const el=document.getElementById('adm-pass');el.type=el.type==='password'?'text':'password'" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--t3);font-size:13px">👁</button>
      </div>
    </div>
    <div id="adm-err" style="color:var(--red);font-size:11.5px;min-height:16px;margin-bottom:8px"></div>
    <div style="background:var(--bg);padding:12px 14px;border-radius:8px;font-size:12.5px;color:var(--t2);line-height:1.5">
      Şifreyi kullanıcıya güvenli bir kanal üzerinden iletmeyi unutmayın.
    </div>
  </div>
  <div class="modal-ftr" style="display:flex;justify-content:space-between;align-items:center">
    <a href="#" style="font-size:12px;color:var(--blue);font-weight:600;text-decoration:none" onclick="event.preventDefault();window.openSupportModal()">
      🎧 Destek Ekibinden Yardım Al
    </a>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost" onclick="window.closeModal()">İptal</button>
      <button class="btn btn-blue" id="adm-btn" onclick="window._setAdmin()" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
        Yönetici Ata
      </button>
    </div>
  </div>`);
}

window._valAdmin = function() {
  const email = document.getElementById('adm-email')?.value.trim() || '';
  const pass = document.getElementById('adm-pass')?.value || '';
  const errEl = document.getElementById('adm-err');
  const btn = document.getElementById('adm-btn');
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  const isCorp = email.includes('@') && !email.endsWith('@gmail.com') && !email.endsWith('@hotmail.com') && !email.endsWith('@yahoo.com') && !email.endsWith('@outlook.com');

  if (errEl) {
    if (email && !emailRegex.test(email)) errEl.textContent = '⚠ Geçerli bir e-posta adresi girin.';
    else if (email && !isCorp) errEl.textContent = '⚠ Sadece kurumsal e-posta adresleri kabul edilir.';
    else if (pass && pass.length < 6) errEl.textContent = '⚠ Şifre en az 6 karakter olmalıdır.';
    else errEl.textContent = '';
  }
  if (btn) btn.disabled = !(emailRegex.test(email) && isCorp && pass.length >= 6);
};

window._setAdmin = function() {
  const email = document.getElementById('adm-email')?.value.trim();
  if (!email) return;
  const btn = document.getElementById('adm-btn');
  if (btn) { btn.textContent = 'Atanıyor…'; btn.disabled = true; }
  setTimeout(() => {
    closeModal();
    toast(`${email} yönetici olarak atandı ✓`, 'ok');
  }, 700);
};

// ── Çıkış ─────────────────────────────────────────────────────────────────────
export function handleLogout() {
  closePopover();
  // Show in-line confirm without importing confirmDlg from ui (avoid circular)
  showModal(`<div class="modal-hdr">
    <div class="modal-title">Çıkış Yap</div>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div style="padding:28px 24px;text-align:center">
    <div style="font-size:42px;margin-bottom:12px">👋</div>
    <div style="font-size:15px;font-weight:700;color:var(--t1);margin-bottom:8px">Çıkış yapmak istiyor musunuz?</div>
    <div style="font-size:13px;color:var(--t3);margin-bottom:24px">Tüm verileriniz yerel depoda güvende kalacaktır.</div>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="btn btn-ghost" onclick="window.closeModal()">Vazgeç</button>
      <button class="btn btn-danger" onclick="window.logout()">Evet, Çıkış Yap</button>
    </div>
  </div>`);
}

// ── Global Expose ─────────────────────────────────────────────────────────────
window.openSupportModal  = openSupportModal;
window.openSetAdminModal = openSetAdminModal;
window.openProfilModal   = openProfilModal;
window.handleLogout      = handleLogout;
