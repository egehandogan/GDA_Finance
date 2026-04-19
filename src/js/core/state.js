import { uid } from '../utils/formatters.js';

/**
 * Global State Management
 * Refactored to English/ASCII identifiers for production reliability.
 */
export let S = {
    isLoggedIn: false,
    user: null,
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
    
    invoiceTemplates: [], 
    activeTemplateId: 't1',
    
    settings: {
        sirket: {
            ad: 'Şirket Adı A.Ş.',
            vkn: '1234567890',
            vergiDairesi: 'Kadıköy VD',
            adres: 'Merkez Mah. Atatürk Cad. No:1',
            ilce: 'Kadıköy',
            il: 'İstanbul',
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

export const DEMO_USERS = [
    { email: 'admin@gda.com.tr', pass: 'gda123', name: 'Ege Han', role: 'Admin' },
    { email: 'demo@gda.com.tr', pass: 'demo123', name: 'Demo User', role: 'Viewer' }
];

const STORAGE_KEY = 'gdaf_finance_pro';

export function loadStore() {
    console.log('State: loading storage...');
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
            const loaded = JSON.parse(s);
            console.log('State: loaded data from storage. isLoggedIn:', loaded.isLoggedIn);
            
            // Refactored to Object.assign to maintain object references across modules
            Object.assign(S, loaded);
        } else {
            console.log('State: no storage found, seeding data...');
            seedData();
        }
        
        if (!S.invoiceTemplates || S.invoiceTemplates.length < 5) {
            seedTemplates();
        }
    } catch (e) {
        console.error('State load error:', e);
        seedData();
    }
}

export function saveStore() {
    console.log('State: saving storage... isLoggedIn:', S.isLoggedIn);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
}

function seedData() {
    S.settings.kanallar = [
        { id: uid(), ad: 'Web Sitesi', renk: '#2563EB', aktif: true },
        { id: uid(), ad: 'Mağaza', renk: '#059669', aktif: true },
        { id: uid(), ad: 'B2B', renk: '#7C3AED', aktif: true },
    ];
    
    S.urunler = [
        { id: uid(), kod: 'SRV-001', ad: 'Web Geliştirme', aciklama: 'Full-stack web geliştirme hizmeti', kategori: 'Yazılım', birimFiyat: 5000, kdvOrani: 20, birim: 'saat' },
        { id: uid(), kod: 'SRV-002', ad: 'UI/UX Tasarım', aciklama: 'Kullanıcı deneyimi ve arayüz tasarımı', kategori: 'Tasarım', birimFiyat: 3500, kdvOrani: 20, birim: 'saat' },
        { id: uid(), kod: 'CNS-001', ad: 'Danışmanlık', aciklama: 'Dijital strateji danışmanlığı', kategori: 'Danışmanlık', birimFiyat: 8000, kdvOrani: 20, birim: 'gün' },
        { id: uid(), kod: 'PRJ-001', ad: 'Proje Yönetimi', aciklama: 'Agile proje yönetimi ve koordinasyon', kategori: 'Yönetim', birimFiyat: 12000, kdvOrani: 20, birim: 'proje' },
        { id: uid(), kod: 'LNS-001', ad: 'Yazılım Lisansı', aciklama: 'Yıllık yazılım kullanım lisansı', kategori: 'Lisans', birimFiyat: 2400, kdvOrani: 20, birim: 'yıl' },
        { id: uid(), kod: 'SUP-001', ad: 'Teknik Destek', aciklama: 'Aylık teknik destek paketi', kategori: 'Destek', birimFiyat: 1800, kdvOrani: 20, birim: 'ay' },
    ];
    
    S.musteriler = [
        { id: 'm1', tip: 'kurumsal', sirketAd: 'TechVision Ltd.', vkn: '1234567890', vergiDairesi: 'Levent VD', yetkili: 'Murat Çelik', tel: '0212 555 10 20', email: 'info@techvision.com', adres: 'Levent, İstanbul', web: 'techvision.com', renk: '#2563EB' },
        { id: 'm2', tip: 'kurumsal', sirketAd: 'Kreatif Ajans', vkn: '9876543210', vergiDairesi: 'Çankaya VD', yetkili: 'Elif Kaya', tel: '0312 444 30 40', email: 'info@kreatifajans.com', adres: 'Çankaya, Ankara', web: '', renk: '#7C3AED' },
        { id: 'm3', tip: 'kurumsal', sirketAd: 'NovaMed Sağlık', vkn: '5551234567', vergiDairesi: 'Konak VD', yetkili: 'Dr. Serkan Demir', tel: '0232 333 50 60', email: 'bilgi@novamed.com.tr', adres: 'Konak, İzmir', web: '', renk: '#059669' },
        { id: 'm4', tip: 'bireysel', ad: 'Kemal', soyad: 'Arslan', tc: '12345678901', tel: '0216 777 80 90', email: 'kemal.arslan@gmail.com', adres: 'Kadıköy, İstanbul', renk: '#D97706' },
    ];

    S.hesaplar = [
        { id: uid(), ad: 'Ana Kasa', tip: 'kasa', bakiye: 28500 },
        { id: uid(), ad: 'İş Bankası Vadesiz', tip: 'banka', bakiye: 87350 },
        { id: uid(), ad: 'Garanti BBVA', tip: 'banka', bakiye: 45200 }
    ];

    S.isTakip = [
        { id: uid(), baslik: 'Web Sitesi Yenileme', aciklama: 'Şirket web sitesinin tasarım ve içerik güncellemesi', musteri: 'm1', oncelik: 'yuksek', durum: 'devam', baslangic: '2026-04-01', bitis: '2026-04-30', etiket: 'Tasarım', atanan: 'Ayşe Kaya', tutar: 25000, notlar: '' },
        { id: uid(), baslik: 'E-Ticaret Entegrasyonu', aciklama: 'Mevcut sisteme ödeme altyapısı entegrasyonu', musteri: 'm2', oncelik: 'orta', durum: 'bekliyor', baslangic: '2026-05-01', bitis: '2026-06-15', etiket: 'Yazılım', atanan: 'Mehmet Demir', tutar: 18000, notlar: '' },
        { id: uid(), baslik: 'Marka Kimliği Revizyonu', aciklama: 'Logo, renk paleti ve tipografi güncellemesi', musteri: 'm3', oncelik: 'dusuk', durum: 'yapildi', baslangic: '2026-03-01', bitis: '2026-03-31', etiket: 'Tasarım', atanan: 'Fatma Şahin', tutar: 12000, notlar: 'Teslim edildi' },
        { id: uid(), baslik: 'CRM Yazılımı', aciklama: 'Özel müşteri yönetim sistemi geliştirme', musteri: 'm4', oncelik: 'yuksek', durum: 'iptal', baslangic: '2026-02-01', bitis: '2026-04-01', etiket: 'Yazılım', atanan: 'Ayşe Kaya', tutar: 45000, notlar: 'Bütçe yetersizliği' },
    ];

    S.odemeTakip = [
        { id: uid(), baslik: 'Sunucu Barındırma Ücreti', alici: 'DigitalOcean', tutar: 850, vade: '2026-04-20', tekrar: 'aylik', durum: 'bekliyor', kategori: 'Yazılım & Abonelik', notlar: '' },
        { id: uid(), baslik: 'Muhasebe Yazılımı Lisansı', alici: 'Yazılım A.Ş.', tutar: 2400, vade: '2026-04-25', tekrar: 'yillik', durum: 'bekliyor', kategori: 'Yazılım & Abonelik', notlar: '' },
        { id: uid(), baslik: 'Kira Ödemesi', alici: 'Mülk Sahibi', tutar: 12000, vade: '2026-04-05', tekrar: 'aylik', durum: 'odendi', kategori: 'Kira', notlar: '' },
        { id: uid(), baslik: 'Elektrik Faturası', alici: 'TEDAŞ', tutar: 1850, vade: '2026-04-28', tekrar: 'aylik', durum: 'bekliyor', kategori: 'Diğer', notlar: '' },
        { id: uid(), baslik: 'TechVision Ltd. Fatura Tahsilatı', alici: 'TechVision Ltd.', tutar: 21600, vade: '2026-04-30', tekrar: 'tek', durum: 'bekliyor', kategori: 'Tahsilat', notlar: 'FAT-2026001' },
        { id: uid(), baslik: 'İnternet + Telefon', alici: 'Türktelekom', tutar: 680, vade: '2026-04-18', tekrar: 'aylik', durum: 'gecikti', kategori: 'Diğer', notlar: 'Son ödeme tarihi geçti' },
    ];

    S.calendarEvents = [
        { id: uid(), baslik: 'Vergi Beyannamesi Son Gün', tarih: '2026-04-25', tip: 'odeme', renk: 'purple', aciklama: 'KDV beyannamesi son günü', tum_gun: true },
        { id: uid(), baslik: 'Kiracı Toplantısı', tarih: '2026-04-22', tip: 'not', renk: 'blue', aciklama: 'Bina yönetimi ile görüşme', tum_gun: false, saat: '14:00' },
    ];

    S.kartlar = [
        { id: uid(), ad: 'İş Seyahat Kartı', tip: 'yol', banka: 'İşbank', sonDort: '4521', renk: 'kart-mavi', limit: 5000, bakiyeler: [{ id: uid(), ay: '2026-01', tutar: 1200, aciklama: 'Ocak yükleme' }, { id: uid(), ay: '2026-02', tutar: 1200, aciklama: 'Şubat yükleme' }, { id: uid(), ay: '2026-03', tutar: 1500, aciklama: 'Mart yükleme' }, { id: uid(), ay: '2026-04', tutar: 1200, aciklama: 'Nisan yükleme' }] },
        { id: uid(), ad: 'Yemek Kartı', tip: 'yemek', banka: 'Sodexo', sonDort: '8834', renk: 'kart-yesil', limit: 3000, bakiyeler: [{ id: uid(), ay: '2026-01', tutar: 2200, aciklama: 'Ocak yükleme' }, { id: uid(), ay: '2026-02', tutar: 2200, aciklama: 'Şubat yükleme' }, { id: uid(), ay: '2026-03', tutar: 2500, aciklama: 'Mart yükleme' }, { id: uid(), ay: '2026-04', tutar: 2200, aciklama: 'Nisan yükleme' }] },
        { id: uid(), ad: 'Şirket Kredi Kartı', tip: 'sirket', banka: 'Garanti BBVA', sonDort: '7712', renk: 'kart-siyah', limit: 50000, bakiyeler: [{ id: uid(), ay: '2026-01', tutar: 12400, aciklama: 'Ocak harcamaları' }, { id: uid(), ay: '2026-02', tutar: 8900, aciklama: 'Şubat harcamaları' }, { id: uid(), ay: '2026-03', tutar: 15300, aciklama: 'Mart harcamaları' }, { id: uid(), ay: '2026-04', tutar: 9800, aciklama: 'Nisan harcamaları' }] },
    ];

    const POZLER = [['Yazılım Geliştirici', 'Teknoloji'], ['UI/UX Tasarımcı', 'Tasarım'], ['Pazarlama Uzmanı', 'Pazarlama'], ['İK Uzmanı', 'İnsan Kaynakları'], ['Muhasebe Uzmanı', 'Muhasebe']];
    S.personeller = [
        { id: uid(), ad: 'Ayşe', soyad: 'Kaya', tc: '34567890123', pozisyon: POZLER[0][0], departman: POZLER[0][1], iseGiris: '2022-03-01', brutMaas: 48000, medeni: 'bekar', cocuk: 0, es: false, durumu: 'aktif', maaslar: [], notlar: '' },
        { id: uid(), ad: 'Mehmet', soyad: 'Demir', tc: '45678901234', pozisyon: POZLER[1][0], departman: POZLER[1][1], iseGiris: '2021-09-15', brutMaas: 38000, medeni: 'evli', cocuk: 1, es: false, durumu: 'aktif', maaslar: [], notlar: '' },
        { id: uid(), ad: 'Fatma', soyad: 'Şahin', tc: '56789012345', pozisyon: POZLER[2][0], departman: POZLER[2][1], iseGiris: '2023-06-01', brutMaas: 32000, medeni: 'bekar', cocuk: 0, es: false, durumu: 'aktif', maaslar: [], notlar: '' },
    ];

    const gv = [
        { m: 18000, mu: 'm1', k: 'Hizmet Geliri', ay: '2025-01' }, { m: 22000, mu: 'm2', k: 'Proje Geliri', ay: '2025-02' },
        { m: 15500, mu: 'm3', k: 'Danışmanlık', ay: '2025-03' }, { m: 31000, mu: 'm1', k: 'Proje Geliri', ay: '2025-04' },
        { m: 19800, mu: 'm4', k: 'Hizmet Geliri', ay: '2025-05' }, { m: 26400, mu: 'm2', k: 'Proje Geliri', ay: '2025-06' },
        { m: 34000, mu: 'm1', k: 'Hizmet Geliri', ay: '2025-07' }, { m: 28500, mu: 'm3', k: 'Danışmanlık', ay: '2025-08' },
        { m: 39000, mu: 'm4', k: 'Proje Geliri', ay: '2025-09' }, { m: 33200, mu: 'm1', k: 'Hizmet Geliri', ay: '2025-10' },
        { m: 41000, mu: 'm2', k: 'Proje Geliri', ay: '2025-11' }, { m: 47500, mu: 'm3', k: 'Hizmet Geliri', ay: '2025-12' },
        { m: 38000, mu: 'm1', k: 'Proje Geliri', ay: '2026-01' }, { m: 44000, mu: 'm4', k: 'Hizmet Geliri', ay: '2026-02' },
        { m: 52000, mu: 'm2', k: 'Danışmanlık', ay: '2026-03' }, { m: 29000, mu: 'm1', k: 'Hizmet Geliri', ay: '2026-04' },
    ];
    S.gelirler = gv.map((g, i) => { const net = g.m, kdv = 20; return { id: uid(), tarih: `${g.ay}-${String(10 + i % 18).padStart(2, '0')}`, kategori: g.k, aciklama: `${g.k} — ${S.musteriler.find(m => m.id === g.mu)?.sirketAd || ''}`, musteri: g.mu, tutar: net, kdvOrani: kdv, kdvTutar: Math.round(net * .2), toplamTutar: Math.round(net * 1.2), durum: 'odendi', belgeNo: `GEL-${2025000 + i}` }; });

    const dv = [
        { m: 8500, k: 'Kira', ay: '2025-01' }, { m: 3200, k: 'Personel Gideri', ay: '2025-02' }, { m: 9000, k: 'Kira', ay: '2025-03' },
        { m: 4100, k: 'Pazarlama', ay: '2025-04' }, { m: 8500, k: 'Kira', ay: '2025-05' }, { m: 5600, k: 'Personel Gideri', ay: '2025-06' },
        { m: 9500, k: 'Kira', ay: '2025-07' }, { m: 7200, k: 'Yazılım & Abonelik', ay: '2025-08' }, { m: 9500, k: 'Kira', ay: '2025-09' },
        { m: 6800, k: 'Pazarlama', ay: '2025-10' }, { m: 10000, k: 'Kira', ay: '2025-11' }, { m: 12000, k: 'Personel Gideri', ay: '2025-12' },
        { m: 10000, k: 'Kira', ay: '2026-01' }, { m: 8500, k: 'Pazarlama', ay: '2026-02' }, { m: 10500, k: 'Kira', ay: '2026-03' },
        { m: 9000, k: 'Personel Gideri', ay: '2026-04' },
    ];
    S.giderler = dv.map((g, i) => { const net = g.m, kdv = g.k === 'Kira' ? 20 : 10; return { id: uid(), tarih: `${g.ay}-${String(5 + i % 20).padStart(2, '0')}`, kategori: g.k, aciklama: `${g.k} ödemesi`, tedarikci: g.k === 'Kira' ? 'Mülk Sahibi' : 'Çeşitli Tedarikçi', tutar: net, kdvOrani: kdv, kdvTutar: Math.round(net * kdv / 100), toplamTutar: Math.round(net * (1 + kdv / 100)), durum: 'odendi', belgeNo: `GID-${2025000 + i}` }; });

    S.faturalar = [
        { id: uid(), no: 'FAT-2026001', tarih: '2026-04-01', vade: '2026-04-30', musteri: 'm1', kalemler: [{ aciklama: 'Web Geliştirme Hizmeti', miktar: 1, fiyat: 18000, kdv: 20, toplam: 21600 }], ara: 18000, kdv: 3600, toplam: 21600, durum: 'odendi', not: 'Proje tamamlandı' },
        { id: uid(), no: 'FAT-2026002', tarih: '2026-04-05', vade: '2026-05-05', musteri: 'm2', kalemler: [{ aciklama: 'Marka Tasarımı', miktar: 1, fiyat: 12000, kdv: 20, toplam: 14400 }, { aciklama: 'Logo Paketi', miktar: 1, fiyat: 3500, kdv: 20, toplam: 4200 }], ara: 15500, kdv: 3100, toplam: 18600, durum: 'bekliyor', not: '30 gün vadeli ödeme' },
        { id: uid(), no: 'FAT-2026003', tarih: '2026-03-15', vade: '2026-04-15', musteri: 'm3', kalemler: [{ aciklama: 'Danışmanlık Hizmeti', miktar: 10, fiyat: 2500, kdv: 20, toplam: 30000 }], ara: 25000, kdv: 5000, toplam: 30000, durum: 'gecikti', not: 'Ödeme takip edilmekte' },
        { id: uid(), no: 'FAT-2026004', tarih: '2026-04-10', vade: '2026-05-10', musteri: 'm4', kalemler: [{ aciklama: 'Proje Yönetimi', miktar: 1, fiyat: 22000, kdv: 20, toplam: 26400 }], ara: 22000, kdv: 4400, toplam: 26400, durum: 'bekliyor', not: '' },
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
