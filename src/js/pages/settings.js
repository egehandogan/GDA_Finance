import { S, saveStore } from '../core/state.js';
import { toast } from '../components/ui.js';

/**
 * Ayarlar (Settings) Module
 */
export function renderSettings() {
    const actions = document.getElementById('ph-actions');
    if (actions) actions.innerHTML = '';

    const fbar = document.getElementById('filter-bar');
    if (fbar) fbar.style.display = 'none';

    const pb = document.getElementById('page-body');
    pb.innerHTML = `
        <div class="stabs anim">
            <button class="stab active" data-tab="company">Şirket Bilgileri</button>
            <button class="stab" data-tab="tax">Vergi Ayarları</button>
            <button class="stab" data-tab="channels">Satış Kanalları</button>
            <button class="stab" data-tab="drive">Google Drive</button>
        </div>
        <div id="settings-tab-content"></div>
    `;

    const tabs = pb.querySelectorAll('.stab');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTab(tab.dataset.tab);
        };
    });

    renderTab('company');
}

function renderTab(tab) {
    const container = document.getElementById('settings-tab-content');
    if (tab === 'company') container.innerHTML = buildCompanyTab();
    else if (tab === 'tax') container.innerHTML = buildTaxTab();
    else if (tab === 'channels') container.innerHTML = buildChannelsTab();
    else if (tab === 'drive') container.innerHTML = buildDriveTab();
    
    // Re-bind events for the current tab
    bindTabEvents(tab);
}

function buildCompanyTab() {
    const s = S.settings.sirket;
    return `
        <div class="settings-card anim">
            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:30px">
                <div>
                    <div class="settings-section">Şirket Logosu</div>
                    <div class="logo-drop" id="logo-drop-zone" style="height:150px; cursor:pointer; border:2px dashed var(--border); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center">
                        ${s.logo ? `<img src="${s.logo}" style="max-height:100px; max-width:80%">` : `<span style="font-size:12px; color:var(--t3)">Logo Yükle</span>`}
                    </div>
                    <input type="file" id="logo-in" accept="image/*" style="display:none">
                </div>
                <div>
                    <div class="settings-section">Resmi Bilgiler</div>
                    <div class="fg" style="margin-bottom:12px"><label>Şirket Ünvanı</label><input type="text" id="s-name" value="${s.ad}"></div>
                    <div class="form-grid c2">
                        <div class="fg"><label>VKN / TC</label><input type="text" id="s-vkn" value="${s.vkn}"></div>
                        <div class="fg"><label>Vergi Dairesi</label><input type="text" id="s-vd" value="${s.vergiDairesi}"></div>
                    </div>
                    <div class="fg" style="margin-top:12px"><label>IBAN</label><input type="text" id="s-iban" value="${s.iban}"></div>
                    <div class="fg" style="margin-top:12px"><label>Adres</label><textarea id="s-addr" rows="2">${s.adres}</textarea></div>
                    <div style="margin-top:20px; text-align:right">
                        <button class="btn btn-blue" id="save-sirket-btn">Değişiklikleri Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildTaxTab() {
    const v = S.settings.vergi;
    return `
        <div class="settings-card anim" style="max-width:600px">
            <div class="settings-section">Varsayılan KDV Oranı</div>
            <div style="display:flex; gap:10px; margin-bottom:30px">
                ${[0, 1, 10, 20].map(r => `
                    <label style="flex:1; padding:15px; border:1px solid ${v.varsayilanKdv === r ? 'var(--blue)' : 'var(--border)'}; border-radius:12px; cursor:pointer; background:${v.varsayilanKdv === r ? 'var(--blue-50)' : 'transparent'}; text-align:center">
                        <input type="radio" name="kdv-def" value="${r}" ${v.varsayilanKdv === r ? 'checked' : ''} style="display:none">
                        <span style="font-weight:700; color:${v.varsayilanKdv === r ? 'var(--blue)' : 'var(--t2)'}">%${r}</span>
                    </label>
                `).join('')}
            </div>
            <div class="settings-section">E-Fatura Ayarları</div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 0">
                <div>
                    <div style="font-weight:600">E-Arşiv / E-Fatura Kullanımı</div>
                    <div style="font-size:12px; color:var(--t3)">Faturalar otomatik olarak e-belge formatında hazırlanır.</div>
                </div>
                <label class="toggle"><input type="checkbox" ${v.earsiv ? 'checked' : ''}><span class="toggle-slider"></span></label>
            </div>
        </div>
    `;
}

function buildChannelsTab() {
    return `<div style="padding:40px; text-align:center; color:var(--t3)">Satış kanalları yönetimi yakında...</div>`;
}

function buildDriveTab() {
    return `<div style="padding:40px; text-align:center; color:var(--t3)">Google Drive entegrasyon ayarları yakında...</div>`;
}

function bindTabEvents(tab) {
    if (tab === 'company') {
        document.getElementById('save-sirket-btn').onclick = () => {
            const s = S.settings.sirket;
            s.ad = document.getElementById('s-name').value;
            s.vkn = document.getElementById('s-vkn').value;
            s.vergiDairesi = document.getElementById('s-vd').value;
            s.iban = document.getElementById('s-iban').value;
            s.adres = document.getElementById('s-addr').value;
            saveStore();
            toast('Şirket bilgileri güncellendi', 'ok');
        };

        const drop = document.getElementById('logo-drop-zone');
        const input = document.getElementById('logo-in');
        drop.onclick = () => input.click();
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                S.settings.sirket.logo = ev.target.result;
                saveStore();
                renderTab('company');
                toast('Logo güncellendi');
            };
            reader.readAsDataURL(file);
        };
    }
}
