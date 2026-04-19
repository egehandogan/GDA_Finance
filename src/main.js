import { S, loadStore } from './js/core/state.js';
import { navigate } from './js/core/router.js';
import { initProfilePopover } from './js/components/profile-actions.js';

/**
 * Findie Main Entry Point
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
        if (nav) nav.classList.toggle('collapsed');
    };

    window.switchTab = (tab) => {
        const analgesTab = document.getElementById('tab-analiz');
        const mainTab = document.getElementById('tab-main');
        
        if (analgesTab && mainTab) {
            analgesTab.classList.toggle('active', tab === 'analiz');
            mainTab.classList.toggle('active', tab === 'main');
        }
        updateSidebarModules();
    };

    window.toggleProfileMenu = (e) => {
        if (e) e.stopPropagation();
        const popover = document.getElementById('profile-popover');
        if (popover) popover.classList.toggle('active');
    };

    window.logout = () => {
        S.isLoggedIn = false;
        S.user = null;
        // Keep storage key but clear sensitive state if needed
        // For demo purposes, we just reload to the login screen
        localStorage.setItem('gdaf_finance_pro', JSON.stringify(S));
        window.location.reload();
    };

    // Global click listener for popover closing
    document.addEventListener('click', (e) => {
        const trigger = document.getElementById('sn-company-card');
        const popover = document.getElementById('profile-popover');
        if (popover && trigger && !popover.contains(e.target) && !trigger.contains(e.target)) {
            popover.classList.remove('active');
        }
    });

    // 3. Sync Company Branding UI
    syncBranding();

    // 4. Initialize Sidebar Modules
    updateSidebarModules();

    // 5. Profile popover setup
    initProfilePopover();

    // 6. Initial Navigation
    navigate(S.view || 'dashboard');
}

function syncBranding() {
    const s = S.settings.sirket;
    const u = S.user || {};

    // Sidebar company card
    const nameEl = document.querySelector('.sn-cn');
    const vknEl = document.querySelector('.sn-cs');
    const logoEl = document.querySelector('.sn-av');
    if (nameEl) nameEl.textContent = s.ad || 'Şirket Adı';
    if (vknEl) vknEl.textContent = `VKN: ${s.vkn || '—'}`;
    if (logoEl && s.logo) {
        logoEl.innerHTML = `<img src="${s.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
    } else if (logoEl) {
        logoEl.textContent = (s.ad || 'Ş')[0].toUpperCase();
    }

    // Popover user card
    const ppAv   = document.getElementById('pp-user-av');
    const ppName = document.getElementById('pp-user-name');
    const ppRole = document.getElementById('pp-user-role');
    if (ppAv)   ppAv.textContent   = (u.name || u.email || 'A')[0].toUpperCase();
    if (ppName) ppName.textContent = u.name || u.email || 'Kullanıcı';
    if (ppRole) ppRole.textContent = u.role || 'Viewer';
}

/**
 * Renders Sidebar Nav items based on active modules in settings
 */
export function updateSidebarModules() {
    const navContent = document.getElementById('nav-content');
    if (!navContent) return;

    const mod = S.settings.moduller;
    const isAnaliz = document.getElementById('tab-analiz')?.classList.contains('active');

    let html = '';

    const ICONS = {
        dashboard: '<svg viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>',
        gelirler: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
        giderler: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
        faturalar: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        musteriler: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        hesaplar: '<svg viewBox="0 0 24 24"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="5 21 5 10"/><polyline points="9 21 9 10"/><polyline points="15 21 15 10"/><polyline points="19 21 19 10"/><polyline points="3 10 12 3 21 10"/></svg>',
        kartlar: '<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
        urunler: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        personeller: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',
        'is-takip': '<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
        'odeme-takip': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        takvim: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        'maas-hesap': '<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>',
        'toplu-hesap': '<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="16" y1="18" x2="16" y2="18.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="6" x2="16" y2="6"/></svg>',
        analiz: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        raporlar: '<svg viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
        kdv: '<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        ayarlar: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
    };

    if (!isAnaliz) {
        html += `<div class="sec-label">TEMEL MODÜLLER</div>`;
        if (mod.dashboard !== false) html += createNavItem('dashboard', ICONS.dashboard, 'Dashboard', 0, 'Genel mali durum özeti');
        if (mod.gelirler !== false) html += createNavItem('gelirler', ICONS.gelirler, 'Gelirler', 0, 'Gelir kayıtları ve KDV');
        if (mod.giderler !== false) html += createNavItem('giderler', ICONS.giderler, 'Giderler', 0, 'Harcamalar ve belgeler');
        if (mod.faturalar !== false) html += createNavItem('faturalar', ICONS.faturalar, 'Faturalar', S.faturalar.filter(f => f.durum !== 'odendi').length, 'Fatura oluştur ve takip et');
        if (mod['odeme-takip'] !== false) html += createNavItem('odeme-takip', ICONS['odeme-takip'], 'Ödeme Takip', 0, 'Vade ve ödeme takvimi');
        
        html += `<div class="sec-label">YÖNETİM</div>`;
        if (mod.musteriler !== false) html += createNavItem('musteriler', ICONS.musteriler, 'Müşteriler', 0, 'Müşteri kartları ve CRM');
        if (mod.hesaplar !== false) html += createNavItem('hesaplar', ICONS.hesaplar, 'Kasa & Banka', 0, 'Nakit ve banka hesapları');
        if (mod.kartlar !== false) html += createNavItem('kartlar', ICONS.kartlar, 'Kart Yönetimi', 0, 'Yol ve yemek kartları');
        if (mod.urunler !== false) html += createNavItem('urunler', ICONS.urunler, 'Ürünler', 0, 'Ürün ve hizmet kataloğu');
        if (mod.personeller !== false) html += createNavItem('personeller', ICONS.personeller, 'Personeller', 0, 'Bordro ve personel');

        html += `<div class="sec-label">TAKİP & ARAÇLAR</div>`;
        if (mod['is-takip'] !== false) html += createNavItem('is-takip', ICONS['is-takip'], 'İş Takip', 0, 'Görev takip sistemi');
        if (mod.takvim !== false) html += createNavItem('takvim', ICONS.takvim, 'Takvim', 0, 'Finansal hatırlatıcılar');
        
        html += `<div class="sec-label">HESAPLAMALAR</div>`;
        if (mod['maas-hesap'] !== false) html += createNavItem('maas-hesap', ICONS['maas-hesap'], 'Maaş Hesaplama', 0, 'Brüt → Net hesap aracı');
        if (mod['toplu-hesap'] !== false) html += createNavItem('toplu-hesap', ICONS['toplu-hesap'], 'Toplu Hesaplama', 0, 'Çoklu teklif aracı');
    } else {
        html += `<div class="sec-label">ANALİZ & RAPORLAR</div>`;
        if (mod.analiz !== false) html += createNavItem('analiz', ICONS.analiz, 'Detaylı Analiz', 0, 'Kârlılık analizleri');
        if (mod.raporlar !== false) html += createNavItem('raporlar', ICONS.raporlar, 'Raporlar', 0, 'Dönemsel raporlar');
        if (mod.kdv !== false) html += createNavItem('kdv', ICONS.kdv, 'KDV Analizi', 0, 'Beyanname özeti');
    }

    html += `<div class="sec-label" style="margin-top:auto">SİSTEM</div>`;
    html += createNavItem('ayarlar', ICONS.ayarlar, 'Ayarlar', 0, 'Şirket bilgileri ve tercihler');

    navContent.innerHTML = html;
}

function createNavItem(view, icon, text, badge = 0, sub = '') {
    const isActive = S.view === view;
    return `
        <a class="nav-item ${isActive ? 'active' : ''}" data-view="${view}" onclick="navigate('${view}')">
            <span class="nav-icon">${icon}</span>
            <span class="nav-text">
                <span class="nav-label">${text}</span>
                ${sub ? `<span class="nav-sub">${sub}</span>` : ''}
            </span>
            ${badge > 0 ? `<span class="nav-badge">${badge}</span>` : ''}
        </a>
    `;
}

window.updateSidebarModules = updateSidebarModules;
window.syncBranding = syncBranding;
