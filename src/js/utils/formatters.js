/**
 * GDA Finance Utility Formatters
 * Standardized formatting for Currency, Dates, and UI helpers
 */

// Month names (short)
export const MS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

// Month names (long)
export const MS_LONG = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

// KDV rates
export const KDV = [0, 1, 10, 20];

// Expense categories (Gider)
export const GIDER_KAT = [
  'Kira','Personel Gideri','Ulaşım','Yazılım & Abonelik',
  'Ofis Malzemeleri','Pazarlama','Hukuk & Muhasebe',
  'Vergi & Resimler','Akaryakıt','Yemek','Telefon & İnternet','Diğer'
];

// Card types
export const KART_TIPLER = [
  {val:'yol',lbl:'Yol Kartı',icon:'🚌',desc:'Ulaşım'},
  {val:'yemek',lbl:'Yemek Kartı',icon:'🍽️',desc:'Yemek'},
  {val:'sirket',lbl:'Şirket Kredi Kartı',icon:'💳',desc:'Genel'},
  {val:'akaryakit',lbl:'Akaryakıt Kartı',icon:'⛽',desc:'Yakıt'},
  {val:'diger',lbl:'Diğer Kart',icon:'🪪',desc:'Diğer'},
];

// Card color classes
export const KART_RENKLER = [
  {val:'kart-siyah',lbl:'Siyah'},
  {val:'kart-mavi',lbl:'Mavi'},
  {val:'kart-yesil',lbl:'Yeşil'},
  {val:'kart-mor',lbl:'Mor'},
  {val:'kart-kirmizi',lbl:'Kırmızı'},
  {val:'kart-turuncu',lbl:'Turuncu'},
];

// Work task statuses
export const IS_DURUMLAR = [
  {val:'bekliyor',lbl:'Bekliyor',color:'#9CA3AF'},
  {val:'devam',lbl:'Devam Ediyor',color:'#2563EB'},
  {val:'inceleme',lbl:'İncelemede',color:'#D97706'},
  {val:'yapildi',lbl:'Tamamlandı',color:'#059669'},
  {val:'iptal',lbl:'İptal',color:'#DC2626'},
];

// ASG (minimum wage 2025)
export const ASG_UCRET = 22104;

// Currency Formatter (TL)
export const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);

// Date Formatter (Short)
export const DT = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Date Formatter (Long with Month Name)
export const DTL = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Unique ID Generator
export const uid = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

// Today's Date String (YYYY-MM-DD)
export const TODAY = () => new Date().toISOString().split('T')[0];

/**
 * Generates a consistent background color based on a string name
 * Used for user avatars and category badges
 */
export const hashColor = (str) => {
  const colors = [
    '#2563EB', '#7C3AED', '#059669', '#D97706',
    '#DC2626', '#0891B2', '#BE185D', '#065F46'
  ];
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    n = (n * 31 + str.charCodeAt(i)) & 0xffff;
  }
  return colors[n % colors.length];
};

/**
 * Creates a simple SVG Sparkline for mini-charts in KPIs
 */
export const spark = (data, color = '#2563EB') => {
  if (!data || data.length < 2) return '';
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  const w = 50, h = 20;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">
    <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${pts}" />
  </svg>`;
};

/**
 * CountUp Animation Helper
 */
export const countUp = (el, target, duration = 800) => {
  const start = 0;
  const end = parseFloat(target);
  const startTime = performance.now();
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = start + progress * (end - start);
    
    // Check if it should be formatted as currency
    if (el.classList.contains('kpi-val') || el.classList.contains('sc-val')) {
      el.textContent = TL(value);
    } else {
      el.textContent = Math.round(value).toLocaleString('tr-TR');
    }
    
    if (progress < 1) requestAnimationFrame(animate);
    else el.textContent = TL(end); // Ensure final value is exact
  };
  
  requestAnimationFrame(animate);
};
