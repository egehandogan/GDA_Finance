export const GELIR_KAT = ['Hizmet Geliri', 'Proje Geliri', 'Danışmanlık', 'Ürün Satışı', 'Kira Geliri', 'Diğer'];
export const GIDER_KAT = ['Kira', 'Personel Gideri', 'Ulaşım', 'Yazılım & Abonelik', 'Ofis Malzemeleri', 'Pazarlama', 'Hukuk & Muhasebe', 'Vergi & Resimler', 'Diğer'];
export const KDV = [0, 1, 10, 20];
export const MS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const MS_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const CAT_COLORS = ['#2563EB', '#F97316', '#059669', '#7C3AED', '#DC2626', '#D97706', '#0891B2', '#BE185D', '#065F46'];

export const DEMO_USERS = [
    { email: 'admin@gda.com.tr', pass: 'gda123', name: 'Ege Han', role: 'Admin' },
    { email: 'demo@gda.com.tr', pass: 'demo123', name: 'Demo User', role: 'Viewer' }
];

export const PAGE_META = {
    dashboard: { title: 'Dashboard', sub: 'Mali durumunuzun genel özeti' },
    gelirler: { title: 'Gelirler', sub: 'Tüm gelir kayıtları' },
    giderler: { title: 'Giderler', sub: 'Tüm gider kayıtları' },
    faturalar: { title: 'Faturalar', sub: 'Oluşturulan ve bekleyen faturalar' },
    musteriler: { title: 'Müşteriler', sub: 'Müşteri ve firma kayıtları' },
    hesaplar: { title: 'Kasa & Banka', sub: 'Genel kasa ve hesap bakiyeleri' },
    kartlar: { title: 'Kart Yönetimi', sub: 'Yol, yemek ve şirket kartları' },
    analiz: { title: 'Detaylı Analiz', sub: 'Gelir, gider ve kârlılık analizleri' },
    raporlar: { title: 'Raporlar', sub: 'Dönemsel finansal raporlar' },
    kdv: { title: 'KDV Analizi', sub: 'KDV beyanname özeti' },
    'fatura-goruntule': { title: 'Fatura Görüntüle', sub: '' },
    settings: { title: 'Ayarlar', sub: 'Şirket, vergi ve sistem ayarları' },
    urunler: { title: 'Ürünler', sub: 'Ürün ve hizmet kataloğu' },
    personeller: { title: 'Personeller', sub: 'Personel yönetimi ve bordro' },
    'maas-hesap': { title: 'Maaş Hesaplama', sub: 'Brüt → Net maaş ve işveren maliyeti hesaplama aracı' },
    'toplu-hesap': { title: 'Toplu Hesaplama', sub: 'Çoklu ürün fiyatlandırma ve teklif aracı' },
    'is-takip': { title: 'İş Takip', sub: 'Proje ve görev yönetimi' },
    'odeme-takip': { title: 'Ödeme Takip', sub: 'Gelen ve giden ödeme takvimi' },
    takvim: { title: 'Takvim', sub: 'Finansal takvim, notlar ve hatırlatıcılar' },
    'fatura-editor': { title: 'Fatura Editörü', sub: 'Kurumsal fatura şablonlarınızı özelleştirin ve tasarlayın' },
};
