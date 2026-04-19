import { S, saveStore } from '../core/state.js';
import { TL, uid, musName, musColor } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Müşteriler (Customers) Module
 */
export function renderMusteriler() {
    const actions = document.getElementById('ph-actions');
    if (actions) {
        actions.innerHTML = `<button class="btn btn-orange" id="add-mus-btn">MÜŞTERİ EKLE</button>`;
        document.getElementById('add-mus-btn')?.addEventListener('click', () => openMusteriModal());
    }

    const fbar = document.getElementById('filter-bar');
    if (fbar) {
        fbar.style.display = 'flex';
        fbar.innerHTML = `
            <div style="display:flex;align-items:center;background:var(--border2);border-radius:6px;padding:0 10px">
                <span style="font-size:10px;font-weight:700;color:var(--t3);margin-right:8px">MÜŞTERİ</span>
                <input type="text" id="ms-search" placeholder="İsim, e-posta veya VKN…" style="padding:7px 0;font-size:12px;width:180px;border:none;background:transparent">
            </div>
            <select id="ms-tip" style="padding:7px 10px;font-size:12px;border-radius:6px">
                <option value="">Tüm Tipler</option>
                <option value="kurumsal">Kurumsal</option>
                <option value="bireysel">Bireysel</option>
            </select>
            <div class="fb-grow"></div>
            <span id="ms-count" style="font-size:11.5px;color:var(--t3);align-self:center;font-weight:600"></span>
        `;

        const search = document.getElementById('ms-search');
        const tip = document.getElementById('ms-tip');
        
        const update = () => renderCustomerGrid(search.value, tip.value);
        search.addEventListener('input', update);
        tip.addEventListener('change', update);
    }

    const pb = document.getElementById('page-body');
    pb.innerHTML = `<div class="mg anim" id="m-grid"></div>`;

    renderCustomerGrid();
}

function renderCustomerGrid(search = '', filterTip = '') {
    const grid = document.getElementById('m-grid');
    if (!grid) return;

    let rows = S.musteriler;
    if (search) {
        const q = search.toLowerCase();
        rows = rows.filter(m => 
            musName(m.id).toLowerCase().includes(q) || 
            (m.email || '').toLowerCase().includes(q) || 
            (m.vkn || '').includes(q)
        );
    }
    if (filterTip) rows = rows.filter(m => m.tip === filterTip);

    document.getElementById('ms-count').textContent = `${rows.length} müşteri`;

    if (!rows.length) {
        grid.innerHTML = `<div style="padding:80px;text-align:center;color:var(--t3);grid-column:1/-1">Müşteri bulunamadı</div>`;
        return;
    }

    grid.innerHTML = rows.map(m => {
        const gelir = S.gelirler.filter(g => g.musteri === m.id).reduce((s, g) => s + g.toplamTutar, 0);
        const fatC = S.faturalar.filter(f => f.musteri === m.id).length;
        const isKurumsal = m.tip === 'kurumsal';
        const init = musName(m.id).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        
        return `
            <div class="mc-card">
                <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
                    <div class="mc-av" style="background:${m.renk || '#2563EB'}">${init}</div>
                    <div style="flex:1;min-width:0">
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                            <div style="font-weight:700;font-size:13.5px">${musName(m.id)}</div>
                            <span class="badge ${isKurumsal ? 'bg-blue' : 'bg-purple'}" style="font-size:10px">${isKurumsal ? 'Kurumsal' : 'Bireysel'}</span>
                        </div>
                        <div style="font-size:11px;color:var(--t3);margin-top:2px">${isKurumsal ? 'VKN: ' + (m.vkn || '—') : 'TC: ' + (m.tc || '—')}</div>
                    </div>
                    <button class="btn btn-danger-soft btn-xs del-mus-btn" data-id="${m.id}">Sil</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--t2);margin-bottom:12px; min-height:60px">
                    ${m.email ? `<span>E-POSTA: ${m.email}</span>` : ''}
                    ${m.tel ? `<span>TEL: ${m.tel}</span>` : ''}
                    <span style="color:var(--t3); text-overflow:ellipsis; overflow:hidden; white-space:nowrap">${m.adres || 'Adres bilgisi yok'}</span>
                </div>
                <div style="padding-top:10px;border-top:1px solid var(--border2);display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-size:10px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Toplam Gelir</div>
                        <div style="font-size:15px;font-weight:700;color:var(--green)">${TL(gelir)}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:10px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Fatura</div>
                        <div style="font-size:16px;font-weight:700">${fatC}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.del-mus-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            confirmDlg('Müşteriyi Sil?', 'İlgili faturalar korunur ancak müşteri listeden kaldırılır.', 'danger', () => {
                S.musteriler = S.musteriler.filter(m => m.id !== id);
                saveStore();
                renderCustomerGrid();
                toast('Müşteri silindi', 'warn');
            });
        };
    });
}

function openMusteriModal(id) {
    const m = id ? S.musteriler.find(x => x.id === id) : null;
    const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
    
    showModal(`
        <div class="modal-hdr"><div class="modal-title">Müşteri Ekle</div><button class="modal-close" id="mus-close">×</button></div>
        <div class="modal-body">
            <div class="tip-sel" style="display:flex; gap:10px; margin-bottom:20px">
                <button class="btn btn-light active" id="tip-kur-btn" style="flex:1">KURUMSAL</button>
                <button class="btn btn-light" id="tip-bir-btn" style="flex:1">BİREYSEL</button>
            </div>
            <div id="m-form">
                <div class="fg" style="margin-bottom:12px">
                    <label id="m-name-label">Şirket Ünvanı *</label>
                    <input type="text" id="m-name-in" placeholder="A.Ş. / Ltd. Şti.">
                </div>
                <div class="form-grid c2">
                    <div class="fg"><label id="m-id-label">VKN / Vergi No</label><input type="text" id="m-id-in" placeholder="1234567890"></div>
                    <div class="fg"><label>Telefon</label><input type="text" id="m-tel-in" placeholder="0212…"></div>
                </div>
                <div class="fg" style="margin-top:12px">
                    <label>E-posta</label>
                    <input type="email" id="m-email-in" placeholder="info@company.com">
                </div>
                <div class="fg" style="margin-top:12px">
                    <label>Adres</label>
                    <textarea id="m-adr-in" rows="2" placeholder="Açık adres…"></textarea>
                </div>
            </div>
        </div>
        <div class="modal-ftr">
            <button class="btn btn-ghost" id="mus-cancel">İptal</button>
            <button class="btn btn-orange" id="mus-save">Kaydet</button>
        </div>
    `);

    document.getElementById('mus-close').onclick = closeModal;
    document.getElementById('mus-cancel').onclick = closeModal;

    let currentTip = 'kurumsal';
    const kurBtn = document.getElementById('tip-kur-btn');
    const birBtn = document.getElementById('tip-bir-btn');
    const nameLabel = document.getElementById('m-name-label');
    const idLabel = document.getElementById('m-id-label');

    const switchTip = (tip) => {
        currentTip = tip;
        kurBtn.classList.toggle('active', tip === 'kurumsal');
        birBtn.classList.toggle('active', tip === 'bireysel');
        nameLabel.textContent = tip === 'kurumsal' ? 'Şirket Ünvanı *' : 'Ad Soyad *';
        idLabel.textContent = tip === 'kurumsal' ? 'VKN / Vergi No' : 'T.C. Kimlik No';
    };

    kurBtn.onclick = () => switchTip('kurumsal');
    birBtn.onclick = () => switchTip('bireysel');

    document.getElementById('mus-save').onclick = () => {
        const name = document.getElementById('m-name-in').value.trim();
        if (!name) { toast('İsim alanı zorunludur', 'warn'); return; }

        S.musteriler.push({
            id: uid(),
            tip: currentTip,
            ad: currentTip === 'bireysel' ? name : '',
            sirketAd: currentTip === 'kurumsal' ? name : '',
            vkn: currentTip === 'kurumsal' ? document.getElementById('m-id-in').value : '',
            tc: currentTip === 'bireysel' ? document.getElementById('m-id-in').value : '',
            tel: document.getElementById('m-tel-in').value,
            email: document.getElementById('m-email-in').value,
            adres: document.getElementById('m-adr-in').value,
            renk: colors[Math.floor(Math.random() * colors.length)]
        });

        saveStore();
        closeModal();
        renderMusteriler();
        toast('Müşteri başarıyla eklendi');
    };
}
