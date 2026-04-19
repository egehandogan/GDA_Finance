import { S, saveStore } from './state.js';
import { toast } from '../components/ui.js';

/**
 * Dynamic SPA Router
 * Maps views to page modules and handles navigation state.
 */

// Route Mapping (View Name -> Module Filename)
const ROUTES = {
  'dashboard': 'dashboard',
  'gelirler': 'income',
  'giderler': 'expenses',
  'faturalar': 'invoices',
  'fatura-edit': 'invoices',
  'musteriler': 'customers',
  'hesaplar': 'accounts',
  'kartlar': 'accounts',
  'urunler': 'products',
  'personeller': 'staff',
  'analiz': 'analysis',
  'raporlar': 'analysis',
  'kdv': 'analysis',
  'maas-hesap': 'staff',
  'toplu-hesap': 'products',
  'is-takip': 'projects',
  'odeme-takip': 'tasks',
  'takvim': 'calendar',
  'ayarlar': 'settings',
  'ocr': 'expenses'
};

export async function navigate(view, params = null) {
  if (!S.isLoggedIn && view !== 'login') {
    S.view = 'login';
    return renderModule('login');
  }

  // Update State
  S.view = view;
  S.activeParams = params;
  saveStore();

  // Update Sidebar UI
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  // Breadcrumb / Title Updates
  updateBreadcrumbs(view);

  // Dynamic Module Loading
  try {
    const moduleName = ROUTES[view];
    if (moduleName) {
      // Lazy load the page module with static extension for Vite
      const module = await import(`../pages/${moduleName}.js`);
      
      // Look for a specific render function or default to a generic one
      const renderFnName = `render${view.charAt(0).toUpperCase() + view.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;
      
      if (typeof module[renderFnName] === 'function') {
        module[renderFnName](params);
      } else if (typeof module.render === 'function') {
        module.render(params);
      } else {
        console.warn(`No render function found for ${view}`);
      }
    } else {
      console.error(`Route not found: ${view}`);
      toast('Sayfa bulunamadı', 'warn');
    }
  } catch (error) {
    console.error('Routing Error:', error);
    toast('Sayfa yüklenirken hata oluştu', 'danger');
  }
}

function updateBreadcrumbs(view) {
  const titles = {
    'dashboard': 'Genel Bakış',
    'gelirler': 'Gelirler',
    'giderler': 'Giderler',
    'faturalar': 'Faturalar',
    'fatura-edit': 'Fatura Tasarımcı',
    'musteriler': 'Müşteri Yönetimi',
    'hesaplar': 'Kasa & Bankalar',
    'urunler': 'Ürün & Hizmetler',
    'personeller': 'Personel Yönetimi',
    'analiz': 'Finansal Analiz',
    'is-takip': 'İş Takip (Kanban)',
    'odeme-takip': 'Ödeme Takvimi',
    'takvim': 'Etkinlik Takvimi',
    'ayarlar': 'Sistem Ayarları'
  };

  const crumb = document.getElementById('tb-current-crumb');
  if (crumb) crumb.textContent = titles[view] || view;
}

// Global expose for onclick handlers in HTML/Template strings
window.navigate = navigate;
