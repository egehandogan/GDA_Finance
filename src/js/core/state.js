import { uid } from '../utils/formatters.js';

/**
 * Global State Management
 * This Store is prepared to be synchronized with a remote API.
 */
export let S = {
    isLoggedIn: false,
    user: null,
    view: 'dashboard',
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
    faturaTasarımları: [],
    activeTemplateId: 't1',
    settings: {
        sirket: {
            ad: 'Şirket Adı A.Ş.',
            vkn: '1234567890',
            vergiDairesi: 'Kadıköy VD',
            mersiNo: '',
            adres: 'Merkez Mah. Atatürk Cad. No:1',
            ilce: 'Kadıköy',
            il: 'İstanbul',
            postaKodu: '34710',
            tel: '0212 555 10 10',
            email: 'info@sirket.com.tr',
            web: 'www.sirket.com.tr',
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

export function loadStore() {
    try {
        const s = localStorage.getItem('gdaf_v8');
        if (s) {
            const loaded = JSON.parse(s);
            S = { ...S, ...loaded };
            // Health checks
            if (!S.settings) S.settings = { sirket: {}, vergi: {}, kanallar: [] };
            if (!S.urunler) S.urunler = [];
            if (!S.personeller) S.personeller = [];
            if (!S.faturaTasarımları || S.faturaTasarımları.length < 10) seedFaturaDefault();
        } else {
            seedData();
        }
    } catch (e) {
        seedData();
    }
}

export function saveStore() {
    localStorage.setItem('gdaf_v8', JSON.stringify(S));
}

/**
 * Data Seeds
 */
function seedData() {
    S.settings.kanallar = [
        { id: uid(), ad: 'Web Sitesi', renk: '#2563EB', aktif: true },
        { id: uid(), ad: 'Mağaza', renk: '#059669', aktif: true },
        { id: uid(), ad: 'B2B', renk: '#7C3AED', aktif: true },
    ];
    S.urunler = [
        { id: uid(), kod: 'SRV-001', ad: 'Web Geliştirme', aciklama: 'Full-stack web geliştirme hizmeti', kategori: 'Yazılım', birimFiyat: 5000, kdvOrani: 20, birim: 'saat' },
        { id: uid(), kod: 'SRV-002', ad: 'UI/UX Tasarım', aciklama: 'Kullanıcı deneyimi ve arayüz tasarımı', kategori: 'Tasarım', birimFiyat: 3500, kdvOrani: 20, birim: 'saat' },
    ];
    // ... More seed data can be added here or fetched from API
    S.musteriler = [
        { id: 'm1', tip: 'kurumsal', sirketAd: 'TechVision Ltd.', vkn: '1234567890', vergiDairesi: 'Levent VD', yetkili: 'Murat Çelik', tel: '0212 555 10 20', email: 'info@techvision.com', adres: 'Levent, İstanbul', web: 'techvision.com', renk: '#2563EB' },
        { id: 'm2', tip: 'kurumsal', sirketAd: 'Kreatif Ajans', vkn: '9876543210', vergiDairesi: 'Çankaya VD', yetkili: 'Elif Kaya', tel: '0312 444 30 40', email: 'info@kreatifajans.com', adres: 'Çankaya, Ankara', web: '', renk: '#7C3AED' },
    ];
    S.hesaplar = [
        { id: uid(), ad: 'Ana Kasa', tip: 'kasa', bakiye: 28500 },
        { id: uid(), ad: 'İş Bankası Vadesiz', tip: 'banka', bakiye: 87350 }
    ];
    S.faturalar = [
        { id: uid(), no: 'FAT-2026001', tarih: '2026-04-01', vade: '2026-04-30', musteri: 'm1', kalemler: [{ aciklama: 'Web Geliştirme Hizmeti', miktar: 1, fiyat: 18000, kdv: 20, toplam: 21600 }], ara: 18000, kdv: 3600, toplam: 21600, durum: 'odendi', not: 'Proje tamamlandı' },
    ];
    seedFaturaDefault();
    saveStore();
}

function seedFaturaDefault() {
    const T = [
        { id: 't1', name: 'Modern Azure', color: '#2563eb', font: 'Outfit', radius: '16px', layout: { header: 'logo-left', parties: 'cards', table: 'modern', summary: 'side', footer: 'standard' }, active: true },
        { id: 't2', name: 'Corporate Slate', color: '#334155', font: 'Inter', radius: '4px', layout: { header: 'full-width', parties: 'columns', table: 'striped', summary: 'full', footer: 'compact' }, active: false },
        { id: 't3', name: 'Minimalist', color: '#18181b', font: 'Inter', radius: '0', layout: { header: 'minimal', parties: 'stacked', table: 'plain', summary: 'compact', footer: 'minimal' }, active: false },
        { id: 't4', name: 'Premium Glass', color: '#6366f1', font: 'Outfit', radius: '24px', layout: { header: 'logo-center', parties: 'cards', table: 'glass', summary: 'floating', footer: 'standard' }, active: false },
        { id: 't5', name: 'Creative Agency', color: '#ec4899', font: 'Outfit', radius: '12px', layout: { header: 'banner', parties: 'columns', table: 'modern', summary: 'side', footer: 'large' }, active: false },
        { id: 't6', name: 'Startup Orange', color: '#f97316', font: 'Outfit', radius: '20px', layout: { header: 'logo-left', parties: 'columns', table: 'striped', summary: 'full', footer: 'standard' }, active: false },
        { id: 't7', name: 'Eco Nature', color: '#10b981', font: 'Inter', radius: '10px', layout: { header: 'minimal', parties: 'cards', table: 'modern', summary: 'full', footer: 'standard' }, active: false },
        { id: 't8', name: 'Classic Ledger', color: '#4b5563', font: 'Inter', radius: '0', layout: { header: 'full-width', parties: 'stacked', table: 'striped', summary: 'full', footer: 'compact' }, active: false },
        { id: 't9', name: 'Midnight Pro', color: '#0f172a', font: 'Inter', radius: '8px', layout: { header: 'banner', parties: 'stacked', table: 'modern', summary: 'compact', footer: 'minimal' }, active: false },
        { id: 't10', name: 'Official TR', color: '#dc2626', font: 'Inter', radius: '2px', layout: { header: 'full-width', parties: 'columns', table: 'plain', summary: 'full', footer: 'standard' }, active: false }
    ];
    S.faturaTasarımları = T;
    S.activeTemplateId = 't1';
}
