import { S, saveStore } from './state.js';
import { PAGE_META } from './constants.js';

/**
 * SPA Router
 * Handles navigation, page headers, and module rendering orchestration.
 */
export function navigate(view) {
    S.view = view;
    saveStore();

    // 1. Update Navigation UI Active States
    updateNavigationUI(view);

    // 2. Prepare Page Metadata
    const meta = PAGE_META[view] || { title: view, sub: '' };
    renderPageHeader(meta);

    // 3. Clean up and Prepare Page Body
    const pb = document.getElementById('page-body');
    if (pb) {
        pb.innerHTML = ''; // Clear current content
        pb.classList.remove('anim');
        void pb.offsetWidth; // Trigger reflow for animation
        pb.classList.add('anim');
    }

    // 4. Route to Module Renderer
    routeToRenderer(view);
}

function updateNavigationUI(view) {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-view') === view);
    });

    // Handle tab visibility (General vs Analysis)
    const isAnalysis = ['analiz', 'raporlar', 'kdv'].includes(view);
    const mainTab = document.getElementById('tab-main');
    const analTab = document.getElementById('tab-analiz');
    if (mainTab) mainTab.classList.toggle('active', !isAnalysis);
    if (analTab) analTab.classList.toggle('active', isAnalysis);
}

function renderPageHeader(meta) {
    const container = document.getElementById('page-header-container');
    if (!container) return;

    container.innerHTML = `
        <div class="page-hdr">
            <div class="page-hdr-left">
                <h1 class="ph-title" id="ph-title">${meta.title}</h1>
                <p class="ph-sub" id="ph-sub">${meta.sub}</p>
            </div>
            <div class="page-hdr-right" id="ph-actions">
                <!-- Page specific actions will be injected by the renderer -->
            </div>
        </div>
    `;

    // Update breadcrumb
    const crumb = document.getElementById('breadcrumb');
    if (crumb) {
        crumb.innerHTML = `<span class="tb-crumb">Finance</span> <span class="tb-sep">/</span> <span class="tb-crumb current">${meta.title}</span>`;
    }
}

async function routeToRenderer(view) {
    // Dynamic imports for better performance
    try {
        let renderer;
        switch (view) {
            case 'dashboard':
                renderer = await import('../pages/dashboard.js');
                renderer.renderDashboard();
                break;
            case 'gelirler':
                renderer = await import('../pages/gelir-gider.js');
                renderer.renderGelirler();
                break;
            case 'giderler':
                renderer = await import('../pages/gelir-gider.js');
                renderer.renderGiderler();
                break;
            case 'faturalar':
                renderer = await import('../pages/faturalar.js');
                renderer.renderFaturalar();
                break;
            case 'fatura-editor':
                renderer = await import('../pages/fatura-editor.js');
                renderer.renderFaturaEditor();
                break;
            case 'musteriler':
                renderer = await import('../pages/customers.js');
                renderer.renderMusteriler();
                break;
            case 'personeller':
                renderer = await import('../pages/staff.js');
                renderer.renderPersoneller();
                break;
            case 'urunler':
                renderer = await import('../pages/products.js');
                renderer.renderUrunler();
                break;
            case 'ayarlar':
                renderer = await import('../pages/settings.js');
                renderer.renderSettings();
                break;
            default:
                console.warn(`No renderer found for view: ${view}`);
                const pb = document.getElementById('page-body');
                if (pb) pb.innerHTML = `<div style="padding:40px;text-align:center;color:var(--t3)">Modül henüz hazır değil: ${view}</div>`;
        }
    } catch (error) {
        console.error("Navigation error:", error);
    }
}
