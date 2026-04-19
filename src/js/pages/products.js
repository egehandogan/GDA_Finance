import { S, saveStore } from '../core/state.js';
import { TL, uid } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';
import { KDV } from '../core/constants.js';

/**
 * Ürünler (Products/Services) Module
 */
export function renderUrunler() {
    const actions = document.getElementById('ph-actions');
    if (actions) {
        actions.innerHTML = `<button class="btn btn-orange" id="add-prod-btn">ÜRÜN/HİZMET EKLE</button>`;
        document.getElementById('add-prod-btn')?.addEventListener('click', () => openUrunModal());
    }

    const fbar = document.getElementById('filter-bar');
    if (fbar) {
        fbar.style.display = 'flex';
        fbar.innerHTML = `
            <div style="display:flex;align-items:center;background:var(--border2);border-radius:6px;padding:0 10px">
                <span style="font-size:10px;font-weight:700;color:var(--t3);margin-right:8px">ARAMA</span>
                <input type="text" id="prod-search" placeholder="Kod veya isim…" style="padding:7px 0;font-size:12px;width:180px;border:none;background:transparent">
            </div>
            <div class="fb-grow"></div>
            <span id="prod-count" style="font-size:11.5px;color:var(--t3);align-self:center;font-weight:600"></span>
        `;
        document.getElementById('prod-search').oninput = (e) => renderProductTable(e.target.value);
    }

    const pb = document.getElementById('page-body');
    pb.innerHTML = `
        <div class="card anim">
            <div class="tbl-wrap">
                <table>
                    <thead>
                        <tr><th>Kod</th><th>Ürün / Hizmet</th><th>Birim</th><th class="tr">Net Fiyat</th><th class="tr">KDV %</th><th class="tr">Toplam</th><th></th></tr>
                    </thead>
                    <tbody id="prod-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    renderProductTable();
}

function renderProductTable(q = '') {
    const tb = document.getElementById('prod-tbody');
    if (!tb) return;

    let rows = S.urunler;
    if (q) {
        const query = q.toLowerCase();
        rows = rows.filter(u => u.ad.toLowerCase().includes(query) || u.kod.toLowerCase().includes(query));
    }

    document.getElementById('prod-count').textContent = `${rows.length} kayıt`;

    if (!rows.length) {
        tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--t3)">Ürün bulunamadı</td></tr>`;
        return;
    }

    tb.innerHTML = rows.map(u => {
        const kdv = u.birimFiyat * u.kdvOrani / 100;
        return `
            <tr>
                <td style="font-weight:700;color:var(--t2)">${u.kod}</td>
                <td>
                    <div style="font-weight:600">${u.ad}</div>
                    <div style="font-size:11px;color:var(--t3)">${u.aciklama || ''}</div>
                </td>
                <td><span class="badge bg-light">${u.birim}</span></td>
                <td class="tr mono">${TL(u.birimFiyat)}</td>
                <td class="tr">%${u.kdvOrani}</td>
                <td class="tr mono" style="font-weight:700;color:var(--blue)">${TL(u.birimFiyat + kdv)}</td>
                <td class="tr">
                    <button class="btn btn-light btn-xs edit-u-btn" data-id="${u.id}">Edit</button>
                    <button class="btn btn-danger-soft btn-xs del-u-btn" data-id="${u.id}">Sil</button>
                </td>
            </tr>
        `;
    }).join('');

    tb.querySelectorAll('.del-u-btn').forEach(btn => {
        btn.onclick = () => {
            confirmDlg('Ürünü Sil?', 'Bu öğe ürün listesinden kaldırılacaktır.', 'danger', () => {
                const id = btn.dataset.id;
                S.urunler = S.urunler.filter(u => u.id !== id);
                saveStore();
                renderProductTable();
                toast('Ürün silindi', 'warn');
            });
        };
    });
}

function openUrunModal(id) {
    const u = id ? S.urunler.find(x => x.id === id) : null;
    
    showModal(`
        <div class="modal-hdr"><div class="modal-title">Ürün/Hizmet Tanımla</div><button class="modal-close" id="u-close">×</button></div>
        <div class="modal-body">
            <div class="form-grid c2">
                <div class="fg"><label>Ürün Kodu *</label><input type="text" id="u-kod" value="${u?.kod || ''}" placeholder="SRV-001"></div>
                <div class="fg"><label>Birim</label><select id="u-birim"><option>adet</option><option>saat</option><option>paket</option></select></div>
            </div>
            <div class="fg" style="margin-top:12px"><label>İsim *</label><input type="text" id="u-ad" value="${u?.ad || ''}"></div>
            <div class="form-grid c2" style="margin-top:12px">
                <div class="fg"><label>Net Fiyat *</label><input type="number" id="u-price" value="${u?.birimFiyat || ''}"></div>
                <div class="fg"><label>KDV %</label><select id="u-kdv">${KDV.map(r => `<option value="${r}" ${u?.kdvOrani === r ? 'selected' : ''}>%${r}</option>`).join('')}</select></div>
            </div>
            <div class="fg" style="margin-top:12px"><label>Açıklama</label><textarea id="u-desc" rows="2">${u?.aciklama || ''}</textarea></div>
        </div>
        <div class="modal-ftr">
            <button class="btn btn-ghost" id="u-cancel">İptal</button>
            <button class="btn btn-orange" id="u-save">Kaydet</button>
        </div>
    `);

    document.getElementById('u-close').onclick = closeModal;
    document.getElementById('u-cancel').onclick = closeModal;
    
    document.getElementById('u-save').onclick = () => {
        const ad = document.getElementById('u-ad').value.trim();
        const kod = document.getElementById('u-kod').value.trim();
        const price = parseFloat(document.getElementById('u-price').value) || 0;

        if (!ad || !kod || !price) { toast('Lütfen zorunlu alanları doldurun', 'warn'); return; }

        const data = {
            id: u?.id || uid(),
            kod, ad, 
            birimFiyat: price, 
            kdvOrani: parseFloat(document.getElementById('u-kdv').value),
            birim: document.getElementById('u-birim').value,
            aciklama: document.getElementById('u-desc').value,
            kategori: 'Genel'
        };

        if (u) {
            const idx = S.urunler.findIndex(x => x.id === id);
            S.urunler[idx] = data;
        } else {
            S.urunler.push(data);
        }

        saveStore();
        closeModal();
        renderUrunler();
        toast('Ürün kaydedildi');
    };
}
