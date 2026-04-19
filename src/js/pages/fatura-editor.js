import { S, saveStore } from '../core/state.js';
import { TL, DT, TODAY, musName } from '../utils/formatters.js';
import { toast } from '../components/ui.js';

/**
 * Fatura Tasarım Editörü (Invoice Template Editor)
 */
export function renderFaturaEditor() {
    const pb = document.getElementById('page-body');
    if (!pb) return;

    // Reset view
    pb.innerHTML = `
        <div class="editor-wrap anim">
            <div id="editor-sidebar-container"></div>
            <div class="editor-preview">
                <div id="editor-preview-area" style="width:100%; max-width:850px"></div>
            </div>
        </div>
    `;

    renderEditorSidebar();
    updatePreview();
}

function renderEditorSidebar() {
    const container = document.getElementById('editor-sidebar-container');
    if (!container) return;

    const activeT = S.faturaTasarımları.find(x => x.id === S.activeTemplateId) || S.faturaTasarımları[0];

    container.innerHTML = `
        <div class="editor-sidebar">
            <div class="inv-party-label" style="margin-bottom:15px">ŞABLON SEÇİMİ</div>
            <div style="display:flex;flex-direction:column;gap:10px">
                ${S.faturaTasarımları.map(t => `
                    <div class="template-card ${t.id === S.activeTemplateId ? 'active' : ''}" data-id="${t.id}">
                        <div class="template-dot" style="background:${t.color}"></div>
                        <div style="flex:1">
                            <div style="font-size:13px;font-weight:700">${t.name}</div>
                            <div style="font-size:11px;color:var(--t3)">${t.font} · ${t.layout.header}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <hr class="hdivider">

            <div class="inv-party-label" style="margin-bottom:15px">RENK VE STİL</div>
            <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
                ${['#2563eb','#334155','#18181b','#6366f1','#ec4899','#f97316','#10b981','#dc2626','#7c3aed','#000000'].map(c => `
                    <div class="color-swatch ${c === activeT.color ? 'active' : ''}" style="background:${c}" data-color="${c}"></div>
                `).join('')}
            </div>
            
            <div class="fg" style="margin-bottom:15px">
                <label>Yazı Tipi</label>
                <select id="edit-font" style="width:100%">
                    <option value="Outfit" ${activeT.font === 'Outfit' ? 'selected' : ''}>Outfit (Modern)</option>
                    <option value="Inter" ${activeT.font === 'Inter' ? 'selected' : ''}>Inter (Profesyonel)</option>
                    <option value="Roboto" ${activeT.font === 'Roboto' ? 'selected' : ''}>Roboto (Klasik)</option>
                </select>
            </div>

            <div class="fg">
                <label>Kenar Yuvarlaklığı</label>
                <input type="range" id="edit-radius" min="0" max="32" value="${parseInt(activeT.radius) || 0}" style="width:100%">
            </div>

            <div style="margin-top:auto; padding-top:20px">
                <button class="btn btn-blue" id="save-tpl-btn" style="width:100%;justify-content:center">TASARIMI KAYDET</button>
            </div>
        </div>
    `;

    // Event Listeners
    container.querySelectorAll('.template-card').forEach(el => {
        el.onclick = () => {
            S.activeTemplateId = el.dataset.id;
            renderEditorSidebar();
            updatePreview();
        };
    });

    container.querySelectorAll('.color-swatch').forEach(el => {
        el.onclick = () => {
            activeT.color = el.dataset.color;
            renderEditorSidebar();
            updatePreview();
        };
    });

    document.getElementById('edit-font').onchange = (e) => {
        activeT.font = e.target.value;
        updatePreview();
    };

    document.getElementById('edit-radius').oninput = (e) => {
        activeT.radius = e.target.value + 'px';
        updatePreview();
    };

    document.getElementById('save-tpl-btn').onclick = () => {
        saveStore();
        toast('Tasarım değişiklikleri kaydedildi ✓');
    };
}

export function updatePreview() {
    const previewArea = document.getElementById('editor-preview-area');
    if (!previewArea) return;
    
    const activeT = S.faturaTasarımları.find(x => x.id === S.activeTemplateId) || S.faturaTasarımları[0];
    
    // Dummy data for preview
    const dummyFatura = {
        no: 'FAT-2026-001',
        tarih: TODAY(),
        vade: TODAY(),
        musteri: S.musteriler[0]?.id || '',
        kalemler: [
            { aciklama: 'Kurumsal Web Tasarım & Geliştirme', miktar: 1, fiyat: 15000, kdv: 20, toplam: 18000 },
            { aciklama: 'Sunucu ve Bakım Hizmetleri', miktar: 12, fiyat: 500, kdv: 20, toplam: 7200 }
        ],
        ara: 21000,
        kdv: 4200,
        toplam: 25200,
        durum: 'bekliyor',
        not: 'Bu bir tasarım önizleme faturasıdır. Kayıtlı verilerinizi etkilemez.'
    };

    previewArea.innerHTML = getFaturaHTML(dummyFatura, activeT);
}

/**
 * The core Invoice Rendering Engine
 */
export function getFaturaHTML(f, t) {
    const m = S.musteriler.find(x => x.id === f.musteri);
    const styleStr = `style="--primary-color:${t.color}; border-radius:${t.radius}; font-family:'${t.font}', sans-serif;"`;

    // Logo & Header
    const logoUrl = S.settings?.sirket?.logo;
    const logoHtml = logoUrl 
        ? `<img src="${logoUrl}" style="max-height:60px; max-width:200px">` 
        : `<div class="inv-logo-mark" style="background:${t.color}">GF</div>`;

    let headerHTML = '';
    if (t.layout.header === 'logo-left') {
        headerHTML = `
            <div class="inv-header">
                <div class="inv-logo">${logoHtml}<div><div class="inv-logo-name">${S.settings?.sirket?.ad}</div><div class="inv-logo-sub">VKN: ${S.settings?.sirket?.vkn}</div></div></div>
                <div class="inv-meta"><div class="inv-no">${f.no}</div><div class="inv-date">Tarih: ${DT(f.tarih)}</div></div>
            </div>`;
    } else {
        headerHTML = `
            <div class="inv-header logo-center" style="text-align:center; flex-direction:column">
                <div class="inv-logo" style="justify-content:center">${logoHtml}</div>
                <div class="inv-logo-name" style="margin-top:10px">${S.settings?.sirket?.ad}</div>
                <div class="inv-meta" style="margin-top:10px"><div class="inv-no">${f.no}</div><div>${DT(f.tarih)}</div></div>
            </div>`;
    }

    return `
        <div class="invoice-page" ${styleStr}>
            ${headerHTML}
            <div class="inv-parties">
                <div><div class="inv-party-label">GÖNDEREN</div><div class="inv-party-name">${S.settings?.sirket?.ad}</div><div class="inv-party-detail">VKN: ${S.settings?.sirket?.vkn}<br>${S.settings.sirket.adres}</div></div>
                <div><div class="inv-party-label">ALICI</div><div class="inv-party-name">${musName(f.musteri)}</div><div class="inv-party-detail">${m?.email || ''}<br>${m?.adres || '—'}</div></div>
            </div>
            <table class="inv-table">
                <thead><tr><th>Açıklama</th><th class="tr">Miktar</th><th class="tr">Fiyat</th><th class="tr">KDV</th><th class="tr">Toplam</th></tr></thead>
                <tbody>
                    ${f.kalemler.map(k => `<tr><td>${k.aciklama}</td><td class="tr">${k.miktar}</td><td class="tr">${TL(k.fiyat)}</td><td class="tr">%${k.kdv}</td><td class="tr" style="font-weight:700">${TL(k.toplam)}</td></tr>`).join('')}
                </tbody>
            </table>
            <div class="inv-totals" style="margin-left:auto; width:250px">
                <div class="inv-total-row"><span>Ara Toplam</span><span>${TL(f.ara)}</span></div>
                <div class="inv-total-row"><span>KDV</span><span>${TL(f.kdv)}</span></div>
                <div class="inv-total-row grand"><span>GENEL TOPLAM</span><span>${TL(f.toplam)}</span></div>
            </div>
            <div class="inv-footer">
                <div class="inv-notes"><b>Not:</b> ${f.not || '—'}</div>
                <div style="font-size:11px; color:var(--t3); margin-top:20px">IBAN: ${S.settings.sirket.iban || '—'}</div>
            </div>
        </div>
    `;
}
