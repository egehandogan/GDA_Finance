import { S, loadStore } from './js/core/state.js';
import { navigate } from './js/core/router.js';

/**
 * GDA Finance Main Entry Point
 * Initializing application state and global UI handlers.
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Load Local State
    loadStore();

    // 2. Global UI Handlers
    window.toggleNav = () => {
        const nav = document.getElementById('sb-nav');
        nav.classList.toggle('collapsed');
    };

    window.switchTab = (tab) => {
        document.querySelectorAll('.sn-tab').forEach(t => t.classList.toggle('active', t.id === `tab-${tab}`));
        updateSidebarModules();
    };

    window.toggleProfileMenu = () => {
        const popover = document.getElementById('profile-popover');
        popover.classList.toggle('active');
    };

    window.logout = () => {
        S.isLoggedIn = false;
        S.user = null;
        localStorage.clear();
        window.location.reload();
    };

    // Global click listener for popover closing
    document.addEventListener('click', (e) => {
        const trigger = document.getElementById('profile-trigger');
        const popover = document.getElementById('profile-popover');
        if (popover && trigger && !popover.contains(e.target) && !trigger.contains(e.target)) {
            popover.classList.remove('active');
        }
    });

    // 3. Initialize Sidebar & Modules
    updateSidebarModules();

    // 4. Initial Navigation
    // If logged in, go to dashboard or previous view, else go to login (handled in router)
    navigate(S.view || 'dashboard');
    
    // 5. Profile trigger listener
    const trigger = document.getElementById('profile-trigger');
    if (trigger) trigger.onclick = window.toggleProfileMenu;
}

/**
 * Renders Sidebar Nav items based on active modules in settings
 */
export function updateSidebarModules() {
    const navContent = document.getElementById('nav-content');
    if (!navContent) return;

    const mod = S.settings.moduller;
    const isAnaliz = document.getElementById('tab-analiz').classList.contains('active');

    let html = '';

    if (!isAnaliz) {
        html += `<div class="sec-label">TEMEL MODÜLLER</div>`;
        if (mod.dashboard) html += createNavItem('dashboard', '🏠', 'Genel Bakış');
        if (mod.gelirler) html += createNavItem('gelirler', '💰', 'Gelirler');
        if (mod.giderler) html += createNavItem('giderler', '💸', 'Giderler');
        if (mod.faturalar) html += createNavItem('faturalar', '🧾', 'Faturalar', S.faturalar.filter(f => f.durum !== 'odendi').length);
        
        html += `<div class="sec-label">YÖNETİM</div>`;
        if (mod.musteriler) html += createNavItem('musteriler', '👥', 'Müşteriler');
        if (mod.urunler) html += createNavItem('urunler', '📦', 'Ürün / Hizmet');
        if (mod.personeller) html += createNavItem('personeller', '👔', 'Personel / İK');
        if (mod.hesaplar) html += createNavItem('hesaplar', '🏦', 'Kasa & Banka');

        html += `<div class="sec-label">TAKİP & ARAÇLAR</div>`;
        if (mod['is-takip']) html += createNavItem('is-takip', '📋', 'İş Takip');
        if (mod['odeme-takip']) html += createNavItem('odeme-takip', '📅', 'Ödeme Takibi');
        if (mod.takvim) html += createNavItem('takvim', '🗓', 'Takvim');
    } else {
        html += `<div class="sec-label">ANALİZ & RAPORLAR</div>`;
        if (mod.analiz) html += createNavItem('analiz', '📊', 'Finansal Analiz');
        if (mod.raporlar) html += createNavItem('raporlar', '📈', 'Detaylı Raporlar');
        if (mod.kdv) html += createNavItem('kdv', '🏛', 'KDV Analizi');
    }

    html += `<div class="sec-label" style="margin-top:auto">SİSTEM</div>`;
    html += createNavItem('ayarlar', '⚙️', 'Ayarlar');

    navContent.innerHTML = html;
}

function createNavItem(view, emoji, text, badge = 0) {
    const isActive = S.view === view;
    return `
        <a class="nav-item ${isActive ? 'active' : ''}" data-view="${view}" onclick="navigate('${view}')">
            <span class="nav-icon">${emoji}</span>
            <span class="nav-text">${text}</span>
            ${badge > 0 ? `<span class="nav-badge">${badge}</span>` : ''}
        </a>
    `;
}

window.updateSidebarModules = updateSidebarModules;
