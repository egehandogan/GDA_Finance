import { uid } from '../utils/formatters.js';

/**
 * Global State Management
 * Refactored to English/ASCII identifiers for production reliability.
 */
export let S = {
    isLoggedIn: true, // Default to true for demo/local storage purposes
    user: { id: 'u1', name: 'GDA Admin', role: 'admin' },
    view: 'dashboard',
    
    // Core Data Modules
    gelirler: [],
    giderler: [],
    faturalar: [],
    musteriler: [],
    hesaplar: [],
    kartlar: [],
    urunler: [],
    personeller: [],
    isTakip: [],
    odemeTakip: [],
    calendarEvents: [],
    
    // Invoicing
    invoiceTemplates: [], // Renamed from non-ASCII 'faturaTasarımları'
    activeTemplateId: 't1',
    
    settings: {
        sirket: {
            ad: 'GDA Kurumsal Finance',
            vkn: '1234567890',
            vergiDairesi: 'Kadıköy VD',
            adres: 'Merkez Mah. Atatürk Cad. No:1',
            ilce: 'Kadıköy',
            il: 'İstanbul',
            tel: '0212 555 10 10',
            email: 'info@gdafinance.com',
            web: 'www.gdafinance.com',
            iban: 'TR00 0000 0000 0000 0000 000000',
            logo: null
        },
        vergi: { varsayilanKdv: 20, stopaj: 0, earsiv: false },
        kanallar: [],
        depolama: {
            aktif: false,
            tip: 'drive',
            driveFolderUrl: '',
            driveApiKey: '',
            driveClientId: '',
            otomatikYukle: true,
            klasorYapi: 'yil-ay'
        },
        moduller: {
            dashboard: true, gelirler: true, giderler: true, faturalar: true,
            musteriler: true, hesaplar: true, kartlar: true, urunler: true,
            personeller: true, analiz: true, raporlar: true, kdv: true,
            'maas-hesap': true, 'toplu-hesap': true, 'is-takip': true,
            'odeme-takip': true, takvim: true
        }
    }
};

const STORAGE_KEY = 'gdaf_finance_pro';

export function loadStore() {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
            const loaded = JSON.parse(s);
            
            // Handle migration from old non-ASCII key if it exists
            if (loaded.faturaTasarımları && !loaded.invoiceTemplates) {
                loaded.invoiceTemplates = loaded.faturaTasarımları;
                delete loaded.faturaTasarımları;
            }
            
            S = { ...S, ...loaded };
        } else {
            seedData();
        }
        
        // Ensure templates are always present
        if (!S.invoiceTemplates || S.invoiceTemplates.length < 5) {
            seedTemplates();
        }
    } catch (e) {
        console.error('State load error:', e);
        seedData();
    }
}

export function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
}

function seedData() {
    // Initial Seed from v8 logic
    S.musteriler = [
        { id: 'm1', tip: 'kurumsal', sirketAd: 'TechVision Ltd.', vkn: '1234567890', vergiDairesi: 'Levent VD', yetkili: 'Murat Çelik', tel: '0212 555 10 20', email: 'info@techvision.com', adres: 'Levent, İstanbul', web: 'techvision.com', renk: '#2563EB' },
        { id: 'm2', tip: 'kurumsal', sirketAd: 'Kreatif Ajans', vkn: '9876543210', vergiDairesi: 'Çankaya VD', yetkili: 'Elif Kaya', tel: '0312 444 30 40', email: 'info@kreatifajans.com', adres: 'Çankaya, Ankara', web: '', renk: '#7C3AED' },
    ];
    
    S.hesaplar = [
        { id: uid(), ad: 'Ana Kasa', tip: 'kasa', bakiye: 28500 },
        { id: uid(), ad: 'İş Bankası Vadesiz', tip: 'banka', bakiye: 87350 }
    ];
    
    S.settings.kanallar = [
        { id: uid(), ad: 'Web Sitesi', renk: '#2563EB', aktif: true },
        { id: uid(), ad: 'Mağaza', renk: '#059669', aktif: true },
        { id: uid(), ad: 'B2B', renk: '#7C3AED', aktif: true },
    ];
    
    S.urunler = [
        { id: uid(), kod: 'SRV-001', ad: 'Web Geliştirme', aciklama: 'Full-stack development', kategori: 'Yazılım', birimFiyat: 1500, kdvOrani: 20, birim: 'saat' },
        { id: uid(), kod: 'SRV-002', ad: 'UI/UX Tasarım', aciklama: 'Product design', kategori: 'Tasarım', birimFiyat: 1200, kdvOrani: 20, birim: 'saat' },
    ];

    seedTemplates();
    saveStore();
}

function seedTemplates() {
    S.invoiceTemplates = [
        { id: 't1', name: 'Modern Azure', color: '#2563eb', font: 'Outfit', radius: '16px', layout: { header: 'logo-left', parties: 'cards', table: 'modern', summary: 'side', footer: 'standard' } },
        { id: 't2', name: 'Corporate Slate', color: '#334155', font: 'Inter', radius: '4px', layout: { header: 'full-width', parties: 'columns', table: 'striped', summary: 'full', footer: 'compact' } },
        { id: 't3', name: 'Minimalist', color: '#18181b', font: 'Inter', radius: '0', layout: { header: 'minimal', parties: 'stacked', table: 'plain', summary: 'compact', footer: 'minimal' } },
        { id: 't4', name: 'Premium Glass', color: '#6366f1', font: 'Outfit', radius: '24px', layout: { header: 'logo-center', parties: 'cards', table: 'glass', summary: 'floating', footer: 'standard' } },
        { id: 't5', name: 'Creative Agency', color: '#ec4899', font: 'Outfit', radius: '12px', layout: { header: 'banner', parties: 'columns', table: 'modern', summary: 'side', footer: 'large' } },
        { id: 't6', name: 'Startup Orange', color: '#f97316', font: 'Outfit', radius: '20px', layout: { header: 'logo-left', parties: 'columns', table: 'striped', summary: 'full', footer: 'standard' } },
        { id: 't7', name: 'Eco Nature', color: '#10b981', font: 'Inter', radius: '10px', layout: { header: 'minimal', parties: 'cards', table: 'modern', summary: 'full', footer: 'standard' } },
        { id: 't8', name: 'Classic Ledger', color: '#4b5563', font: 'Inter', radius: '0', layout: { header: 'full-width', parties: 'stacked', table: 'striped', summary: 'full', footer: 'compact' } },
        { id: 't9', name: 'Midnight Pro', color: '#0f172a', font: 'Inter', radius: '8px', layout: { header: 'banner', parties: 'stacked', table: 'modern', summary: 'compact', footer: 'minimal' } },
        { id: 't10', name: 'Official TR', color: '#dc2626', font: 'Inter', radius: '2px', layout: { header: 'full-width', parties: 'columns', table: 'plain', summary: 'full', footer: 'standard' } }
    ];
}
