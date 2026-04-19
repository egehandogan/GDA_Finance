import './css/main.css';
import { loadStore, S } from './js/core/state.js';
import { navigate } from './js/core/router.js';
import { checkAuth } from './js/core/auth.js';
import { openSupportModal, openSetAdminModal, handleLogout } from './js/components/profile-actions.js';


/**
 * GDA Finance - Main Application Entry
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Data
    loadStore();

    // 2. Auth Check
    if (!checkAuth()) return;

    // 3. Initial UI Setup
    initApp();

    navigate(S.view || 'dashboard');
});


function initApp() {
    // Sidebar Toggle
    const toggleBtn = document.getElementById('nav-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.getElementById('sb-nav').classList.toggle('collapsed');
        });
    }

    // Profile Popover
    const profileTrigger = document.getElementById('profile-trigger');
    const popover = document.getElementById('profile-popover');
    
    if (profileTrigger && popover) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            popover.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!popover.contains(e.target) && !profileTrigger.contains(e.target)) {
                popover.classList.remove('active');
            }
        });

        // Popover Item Actions
        document.getElementById('pp-support')?.addEventListener('click', () => {
            popover.classList.remove('active');
            openSupportModal();
        });
        document.getElementById('pp-admin')?.addEventListener('click', () => {
            popover.classList.remove('active');
            openSetAdminModal();
        });
        document.getElementById('pp-logout')?.addEventListener('click', () => {
            popover.classList.remove('active');
            handleLogout();
        });
    }


    // Dynamic Navigation Menu Rendering
    renderSidebarMenu();
}

function renderSidebarMenu() {
    const navContent = document.getElementById('nav-content');
    if (!navContent) return;

    // This logic mimics the original v8 dynamic sidebar
    // We can expand this with more SVGs and modules
    navContent.innerHTML = `
        <div class="sec-label">Genel</div>
        <a class="nav-item" data-view="dashboard">
            <span class="nav-icon">📊</span>
            <span class="nav-text">Dashboard</span>
        </a>
        
        <div class="sec-label">Mali İşlemler</div>
        <a class="nav-item" data-view="gelirler">
            <span class="nav-icon">📈</span>
            <span class="nav-text">Gelirler</span>
        </a>
        <a class="nav-item" data-view="giderler">
            <span class="nav-icon">📉</span>
            <span class="nav-text">Giderler</span>
        </a>
        <a class="nav-item" data-view="faturalar">
            <span class="nav-icon">📄</span>
            <span class="nav-text">Faturalar</span>
        </a>
        
        <div class="sec-label">Kayıtlar</div>
        <a class="nav-item" data-view="musteriler">
            <span class="nav-icon">👥</span>
            <span class="nav-text">Müşteriler</span>
        </a>
        <a class="nav-item" data-view="personeller">
            <span class="nav-icon">👔</span>
            <span class="nav-text">Personeller</span>
        </a>
    `;

    // Add click events to nav items
    navContent.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            navigate(view);
        });
    });
}
