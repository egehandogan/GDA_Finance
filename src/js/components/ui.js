/**
 * Toast Notifications
 */
export function toast(msg, type = 'ok') {
    const t = document.getElementById('toast');
    if (!t) return;

    const dotColor = {
        ok: '#10B981',
        warn: '#F59E0B',
        danger: '#EF4444'
    }[type] || '#3B82F6';

    const item = document.createElement('div');
    item.className = 'ti';
    item.innerHTML = `<span class="ti-dot" style="background:${dotColor}"></span>${msg}`;
    t.appendChild(item);

    setTimeout(() => {
        item.style.animation = 'tOut .3s forwards';
        setTimeout(() => item.remove(), 300);
    }, 3000);
}

/**
 * Standard Modal System
 */
export function showModal(content) {
    let overlay = document.getElementById('modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="modal anim-scale">${content}</div>`;
    overlay.style.display = 'flex';
    
    // Auto-focus first input if any
    setTimeout(() => overlay.querySelector('input, select')?.focus(), 50);
}

export function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
}

/**
 * Custom Confirm Dialog
 */
export function confirmDlg(title, msg, type = 'danger', onConfirm) {
    const icon = {
        danger: '🗑️',
        warn: '⚠️',
        info: 'ℹ️'
    }[type];

    const content = `
        <div class="confirm-box">
            <div class="confirm-icon-wrap">
                <div class="confirm-icon ${type}">${icon}</div>
            </div>
            <div class="confirm-title">${title}</div>
            <div class="confirm-msg">${msg}</div>
            <div class="confirm-actions">
                <button class="btn btn-ghost" id="confirm-cancel-btn">İptal</button>
                <button class="btn ${type === 'danger' ? 'btn-danger' : 'btn-blue'}" id="confirm-ok-btn">Onayla</button>
            </div>
        </div>
    `;

    // We reuse the modal overlay for confirm
    showModal(content);

    document.getElementById('confirm-cancel-btn')?.addEventListener('click', closeModal);
    document.getElementById('confirm-ok-btn')?.addEventListener('click', () => {
        onConfirm();
        closeModal();
    });
}
