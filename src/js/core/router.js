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
  'ocr': 'expenses',
  'login': 'login'
};

export async function navigate(view, params = null) {
  console.log('Router: navigating to', view);

  // Auth Guard
  if (!S.isLoggedIn && view !== 'login') {
    console.log('Router: Auth blocked, redirecting to login');
    view = 'login';
  }

  // Prevent logged-in users from seeing the login screen
  if (S.isLoggedIn && view === 'login') {
    console.log('Router: Already logged in, redirecting to dashboard');
    view = 'dashboard';
  }

  // Update State
  S.view = view;
  S.activeParams = params;
  saveStore();

  // Update Sidebar UI (hidden in login)
  const nav = document.getElementById('sb-nav');
  
  if (view === 'login') {
    if (nav) nav.style.display = 'none';
  } else {
    if (nav) nav.style.display = 'flex';
  }

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  // Breadcrumb / Title Updates
  updateBreadcrumbs(view);

  // Dynamic Module Loading
  try {
    const moduleName = ROUTES[view];
    if (moduleName) {
      console.log('Router: importing module', moduleName);
      const module = await import(`../pages/${moduleName}.js`);
      
      // Build render function name from view
      // e.g. 'is-takip' -> 'renderIsTakip', 'maas-hesap' -> 'renderMaasHesap'
      const camelView = view.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const renderFnName = `render${camelView.charAt(0).toUpperCase() + camelView.slice(1)}`;
      
      if (typeof module[renderFnName] === 'function') {
        module[renderFnName](params);
      } else if (typeof module.render === 'function') {
        module.render(params);
      } else {
        console.warn(`No render function found for ${view} (tried: ${renderFnName})`);
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
  const PAGE_META = {
    'dashboard':    { title: 'Genel Bakış', sub: 'Mali durumunuza genel bakış' },
    'gelirler':     { title: 'Gelirler', sub: 'Tüm gelir kayıtlarınız' },
    'giderler':     { title: 'Giderler', sub: 'Harcamalar ve belgeler' },
    'faturalar':    { title: 'Faturalar', sub: 'Fatura oluştur ve takip et' },
    'fatura-edit':  { title: 'Fatura Tasarımcı', sub: 'Fatura şablonu düzenle' },
    'musteriler':   { title: 'Müşteriler', sub: 'Müşteri kartları ve CRM' },
    'hesaplar':     { title: 'Kasa & Banka', sub: 'Nakit ve banka hesapları' },
    'kartlar':      { title: 'Kart Yönetimi', sub: 'Yol, yemek ve şirket kartları' },
    'urunler':      { title: 'Ürünler', sub: 'Ürün ve hizmet kataloğu' },
    'personeller':  { title: 'Personeller', sub: 'Bordro ve personel yönetimi' },
    'analiz':       { title: 'Detaylı Analiz', sub: 'Kârlılık ve gelir/gider analizi' },
    'raporlar':     { title: 'Raporlar', sub: 'Dönemsel mali raporlar' },
    'kdv':          { title: 'KDV Analizi', sub: 'KDV beyanname özeti' },
    'maas-hesap':   { title: 'Maaş Hesaplama', sub: 'Brüt → Net hesaplama aracı' },
    'toplu-hesap':  { title: 'Toplu Hesaplama', sub: 'Çoklu ürün ve teklif hazırla' },
    'is-takip':     { title: 'İş Takip', sub: 'Proje ve görev yönetimi' },
    'odeme-takip':  { title: 'Ödeme Takip', sub: 'Vade ve ödeme takvimi' },
    'takvim':       { title: 'Takvim', sub: 'Finansal etkinlikler ve hatırlatıcılar' },
    'ayarlar':      { title: 'Ayarlar', sub: 'Şirket bilgileri ve sistem tercihleri' },
    'login':        { title: 'Giriş', sub: '' },
  };

  const meta = PAGE_META[view] || { title: view, sub: '' };
  
  const titleEl = document.getElementById('ph-title');
  const subEl = document.getElementById('ph-sub');
  if (titleEl) titleEl.textContent = meta.title;
  if (subEl) subEl.textContent = meta.sub;
}

window.navigate = navigate;
