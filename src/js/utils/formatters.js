import { MS } from '../core/constants.js';
import { S } from '../core/state.js';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);


export const TODAY = () => new Date().toISOString().split('T')[0];

export const TL = (n) => Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

export const DT = (d) => new Date(d).toLocaleDateString('tr-TR');

export const countUp = (el, target, suffix = ' ₺', dur = 700) => {
    if (!el) return;
    const s = performance.now();
    const end = parseFloat(target) || 0;
    (function step(t) {
        const p = Math.min((t - s) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Number(end * e).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + suffix;
        if (p < 1) requestAnimationFrame(step);
    })(s);
};

export const spark = (data, color = '#2563EB', w = 80, h = 32) => {
    if (!data || data.length < 2) return '';
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    const apts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`);
    const area = `${apts.join(' ')} ${w},${h} 0,${h}`;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" style="overflow:visible">
        <polygon points="${area}" fill="${color}" opacity=".08"/>
        <polyline points="${pts}" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`;
};

export const months12 = () => {
    const out = []; const ref = new Date(2026, 3, 18);
    for (let i = 11; i >= 0; i--) {
        const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
        out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
};

export const monthLabel = (m) => {
    const p = m.split('-');
    return MS[parseInt(p[1]) - 1] + "'" + (p[0].slice(2));
};

export const musName = (id) => {
    const m = S.musteriler.find(x => x.id === id);
    if (!m) return '—';
    return m.tip === 'bireysel' ? `${m.ad || ''} ${m.soyad || ''}`.trim() : m.sirketAd || '—';
};

export const musColor = (id) => {
    return S.musteriler.find(m => m.id === id)?.renk || '#6B7280';
};

export const musInit = (id) => {
    const n = musName(id) || '?';
    return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
};

export const hashColor = (str) => {
    if (!str) return '#2563EB';
    const h = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#BE185D', '#065F46'];
    let n = 0;
    for (let i = 0; i < str.length; i++) {
        n = (n * 31 + str.charCodeAt(i)) & 0xFFFF;
    }
    return h[n % h.length];
};

