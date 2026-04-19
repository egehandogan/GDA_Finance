import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY, hashColor } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Personeller (Staff) Module
 */

// Constants for Salary Calculation (2025 TR Estimates)
const ASG_UCRET = 22104; 

export function renderPersoneller() {
    const actions = document.getElementById('ph-actions');
    if (actions) {
        actions.innerHTML = `<button class="btn btn-orange" id="add-staff-btn">PERSONEL EKLE</button>`;
        document.getElementById('add-staff-btn')?.addEventListener('click', () => openPersonelModal());
    }

    const pb = document.getElementById('page-body');
    pb.innerHTML = `
        <div class="stabs anim">
            <button class="stab active" data-tab="list">Personel Listesi</button>
            <button class="stab" data-tab="salary">Maaş Ödemeleri</button>
            <button class="stab" data-tab="payroll">Bordro Arşivi</button>
        </div>
        <div id="staff-tab-content"></div>
    `;

    const tabs = pb.querySelectorAll('.stab');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTab(tab.dataset.tab);
        };
    });

    renderTab('list');
}

function renderTab(tab) {
    const container = document.getElementById('staff-tab-content');
    if (tab === 'list') container.innerHTML = buildPersonelListesi();
    else if (tab === 'salary') container.innerHTML = buildMaasOdemeleri();
    else if (tab === 'payroll') container.innerHTML = buildBordroArsivi();
}

function buildPersonelListesi() {
    if (!S.personeller.length) return `<div style="text-align:center;padding:60px;color:var(--t3)">Henüz personel eklenmemiş.</div>`;

    return `
        <div class="card anim">
            <div class="tbl-wrap">
                <table>
                    <thead>
                        <tr><th>Personel</th><th>Pozisyon</th><th>Departman</th><th class="tr">Brüt Maaş</th><th class="tr">Net (Tahmini)</th><th>Durum</th><th></th></tr>
                    </thead>
                    <tbody>
                        ${S.personeller.map(p => {
                            const h = hesaplaMaas(p.brutMaas, p.medeni, p.cocuk, p.es);
                            const init = (p.ad[0] || '') + (p.soyad[0] || '');
                            return `
                                <tr>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:10px">
                                            <div class="pers-av" style="background:${hashColor(p.id)}">${init}</div>
                                            <div>
                                                <div style="font-weight:600">${p.ad} ${p.soyad}</div>
                                                <div style="font-size:11px;color:var(--t3)">TC: ${p.tc || '—'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${p.pozisyon}</td>
                                    <td><span class="badge bg-blue">${p.departman}</span></td>
                                    <td class="tr mono">${TL(p.brutMaas)}</td>
                                    <td class="tr mono" style="color:var(--green);font-weight:700">${TL(h.net)}</td>
                                    <td><span class="badge ${p.durumu === 'aktif' ? 'bg-green' : 'bg-amber'}">${p.durumu.toUpperCase()}</span></td>
                                    <td class="tr">
                                        <button class="btn btn-light btn-xs edit-p-btn" data-id="${p.id}">Düzenle</button>
                                        <button class="btn btn-danger-soft btn-xs del-p-btn" data-id="${p.id}">Sil</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function buildMaasOdemeleri() {
    // Basic implementation of salary tracking
    return `<div style="padding:40px;text-align:center;color:var(--t3)">Maaş ödeme takip modülü yapılandırılıyor...</div>`;
}

function buildBordroArsivi() {
    return `<div style="padding:40px;text-align:center;color:var(--t3)">Bordro arşivi modülü yapılandırılıyor...</div>`;
}

// --- CALCULATION LOGIC ---

function calcGV(matrahi) {
    if (matrahi <= 0) return 0;
    const y = matrahi * 12; // Yearly projection
    let v = 0;
    if (y <= 158000) v = y * 0.15;
    else if (y <= 330000) v = 23700 + (y - 158000) * 0.20;
    else if (y <= 800000) v = 57900 + (y - 330000) * 0.27;
    else v = 184890 + (y - 800000) * 0.35;
    return v / 12;
}

function calcAGI(medeni, cocuk, es) {
    let k = 0.5;
    if (medeni === 'evli') {
        k = es ? 0.5 : 0.75;
        if (cocuk === 1) k += 0.075;
        else if (cocuk === 2) k += 0.10;
        else if (cocuk >= 3) k += 0.125;
    }
    return ASG_UCRET * 12 * k * 0.15 / 12;
}

export function hesaplaMaas(brut, medeni, cocuk, es) {
    const sgkI = Math.round(brut * 0.14 * 100) / 100;
    const issI = Math.round(brut * 0.01 * 100) / 100;
    const topSgk = sgkI + issI;
    const gvMat = Math.round((brut - topSgk) * 100) / 100;
    const gv = Math.round(calcGV(gvMat) * 100) / 100;
    const agi = Math.round(calcAGI(medeni, cocuk, es) * 100) / 100;
    const netGV = Math.max(0, Math.round((gv - agi) * 100) / 100);
    const damga = Math.round(brut * 0.00759 * 100) / 100;
    const net = Math.round((brut - topSgk - netGV - damga) * 100) / 100;
    return { brut, sgkI, issI, topSgk, gvMat, gv, agi, netGV, damga, net };
}

// --- MODALS ---

function openPersonelModal(id) {
    const p = id ? S.personeller.find(x => x.id === id) : null;
    
    const content = `
        <div class="modal-hdr"><div class="modal-title">Personel ${p ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" id="p-close">×</button></div>
        <div class="modal-body">
            <div class="form-grid c2">
                <div class="fg"><label>Ad *</label><input type="text" id="p-ad" value="${p?.ad || ''}"></div>
                <div class="fg"><label>Soyad *</label><input type="text" id="p-soyad" value="${p?.soyad || ''}"></div>
            </div>
            <div class="form-grid c2">
                <div class="fg"><label>TC Kimlik No</label><input type="text" id="p-tc" value="${p?.tc || ''}" maxlength="11"></div>
                <div class="fg"><label>Pozisyon</label><input type="text" id="p-poz" value="${p?.pozisyon || ''}"></div>
            </div>
            <div class="form-grid c2">
                <div class="fg"><label>Brüt Maaş (₺) *</label><input type="number" id="p-brut" value="${p?.brutMaas || ''}"></div>
                <div class="fg"><label>Departman</label><input type="text" id="p-dep" value="${p?.departman || ''}"></div>
            </div>
            <div class="fg"><label>Durum</label><select id="p-dur"><option value="aktif">Aktif</option><option value="izinli">İzinli</option><option value="pasif">Pasif</option></select></div>
        </div>
        <div class="modal-ftr">
            <button class="btn btn-ghost" id="p-cancel">İptal</button>
            <button class="btn btn-orange" id="p-save">Kaydet</button>
        </div>
    `;

    showModal(content);
    document.getElementById('p-close').onclick = closeModal;
    document.getElementById('p-cancel').onclick = closeModal;

    if (p) document.getElementById('p-dur').value = p.durumu;

    document.getElementById('p-save').onclick = () => {
        const ad = document.getElementById('p-ad').value.trim();
        const soyad = document.getElementById('p-soyad').value.trim();
        const brut = parseFloat(document.getElementById('p-brut').value) || 0;

        if (!ad || !soyad || !brut) { toast('Lütfen yıldızlı alanları doldurun', 'warn'); return; }

        const data = {
            id: p?.id || uid(),
            ad, soyad,
            tc: document.getElementById('p-tc').value,
            pozisyon: document.getElementById('p-poz').value,
            departman: document.getElementById('p-dep').value,
            brutMaas: brut,
            durumu: document.getElementById('p-dur').value,
            iseGiris: p?.iseGiris || TODAY(),
            maaslar: p?.maaslar || [],
            medeni: p?.medeni || 'bekar',
            cocuk: p?.cocuk || 0,
            es: p?.es || false
        };

        if (p) {
            const idx = S.personeller.findIndex(x => x.id === p.id);
            S.personeller[idx] = data;
        } else {
            S.personeller.push(data);
        }

        saveStore();
        closeModal();
        renderPersoneller();
        toast('Personel kaydı tamamlandı');
    };
}
