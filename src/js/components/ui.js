/**
 * GDA Finance UI System
 * Toast, Modal, ConfirmDialog — all exposed globally for inline onclick handlers.
 */

/* ── TOAST ────────────────────────────────────────────────────────────────── */
export function toast(msg, type = 'ok') {
    const t = document.getElementById('toast');
    if (!t) return;
    const dotColor = { ok: '#10B981', warn: '#F59E0B', danger: '#EF4444' }[type] || '#3B82F6';
    const item = document.createElement('div');
    item.className = 'ti';
    item.innerHTML = `<span class="ti-dot" style="background:${dotColor}"></span>${msg}`;
    t.appendChild(item);
    setTimeout(() => {
        item.style.animation = 'tOut .3s forwards';
        setTimeout(() => item.remove(), 300);
    }, 3000);
}

/* ── MODAL ────────────────────────────────────────────────────────────────── */
export function showModal(content, wide = false) {
    let overlay = document.getElementById('modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="modal anim-scale${wide ? ' modal-wide' : ''}">${content}</div>`;
    overlay.style.display = 'flex';

    // Close on backdrop click
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    // ESC key closes modal
    const onKey = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);

    setTimeout(() => overlay.querySelector('input:not([type=hidden]), select')?.focus(), 60);
}

export function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.innerHTML = '';
    }
}

/* ── CONFIRM DIALOG ───────────────────────────────────────────────────────── */
export function confirmDlg(title, msg, type = 'danger', onConfirm, confirmLabel = 'Onayla') {
    const icon = { danger: '🗑️', warn: '⚠️', info: 'ℹ️' }[type] || '?';
    const btnCls = type === 'danger' ? 'btn-danger' : type === 'warn' ? 'btn-orange' : 'btn-blue';

    showModal(`
        <div class="confirm-box">
            <div class="confirm-icon-wrap">
                <div class="confirm-icon ${type}">${icon}</div>
            </div>
            <div class="confirm-title">${title}</div>
            <div class="confirm-msg">${msg}</div>
            <div class="confirm-actions">
                <button class="btn btn-ghost" onclick="window.closeModal()">İptal</button>
                <button class="btn ${btnCls}" id="cdn-ok-btn">${confirmLabel}</button>
            </div>
        </div>
    `);

    // Attach to DOM element directly (not inline, to avoid stale closures)
    setTimeout(() => {
        document.getElementById('cdn-ok-btn')?.addEventListener('click', () => {
            onConfirm();
            closeModal();
        });
    }, 10);
}

/* ── GLOBAL EXPOSURE (required for inline onclick="closeModal()") ─────────── */
window.closeModal  = closeModal;
window.showModal   = showModal;
window.toast       = toast;
window.confirmDlg  = confirmDlg;
