import { S, saveStore } from '../core/state.js';
import { GELIR_KAT, GIDER_KAT, KDV } from '../core/constants.js';
import { TL, DT, countUp, uid, TODAY, musName, musColor } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

/**
 * Gelirler (Incomes) Module
 */
export function renderGelirler() {
    const actions = document.getElementById('ph-actions');
    if (actions) {
        actions.innerHTML = `<button class="btn btn-orange" id="add-gelir-btn">GELİR EKLE</button>`;
        document.getElementById('add-gelir-btn')?.addEventListener('click', () => openGelirModal());
    }

    const tG = S.gelirler.reduce((s, g) => s + g.toplamTutar, 0);
    const kdvG = S.gelirler.reduce((s, g) => s + g.kdvTutar, 0);
    const netG = S.gelirler.reduce((s, g) => s + g.tutar, 0);

    const pb = document.getElementById('page-body');
    pb.innerHTML = `
        <div class="sc-row anim">
            <div class="sc"><div class="sc-label">Toplam (KDV Dahil)</div><div class="sc-val" style="color:var(--green)" data-count="${tG}">—</div></div>
            <div class="sc"><div class="sc-label">Tahsil Edilen KDV</div><div class="sc-val" data-count="${kdvG}">—</div></div>
            <div class="sc"><div class="sc-label">KDV Hariç Net</div><div class="sc-val" data-count="${netG}">—</div></div>
            <div class="sc"><div class="sc-label">Toplam Kayıt</div><div class="sc-val">${S.gelirler.length}</div></div>
        </div>
        <div class="card anim d1">
            <div class="tbl-wrap">
                <table>
                    <thead>
                        <tr><th>Tarih</th><th>Belge No</th><th>Müşteri</th><th>Kategori</th><th>Açıklama</th><th class="tr">KDV %</th><th class="tr">KDV</th><th class="tr">Toplam</th><th>Durum</th><th></th></tr>
                    </thead>
                    <tbody id="g-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count));
        renderGelirTable();
    }, 50);
}

function renderGelirTable() {
    const tb = document.getElementById('g-tbody');
    if (!tb) return;

    let rows = [...S.gelirler].sort((a, b) => b.tarih.localeCompare(a.tarih));
    
    if (!rows.length) {
        tb.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--t3)">Kayıt bulunamadı</td></tr>`;
        return;
    }

    tb.innerHTML = rows.map(g => `
        <tr>
            <td style="font-size:11.5px;color:var(--t3);white-space:nowrap">${DT(g.tarih)}</td>
            <td style="font-size:11.5px;color:var(--t2);font-variant-numeric:tabular-nums">${g.belgeNo}</td>
            <td>
                <span style="display:flex;align-items:center;gap:6px">
                    <span style="width:6px;height:6px;border-radius:50%;background:${musColor(g.musteri)};flex-shrink:0"></span>
                    <span style="font-weight:500">${musName(g.musteri)}</span>
                </span>
            </td>
            <td><span class="badge bg-green">${g.kategori}</span></td>
            <td style="color:var(--t2);font-size:12.5px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.aciklama}</td>
            <td class="tr" style="color:var(--t3)">%${g.kdvOrani}</td>
            <td class="tr mono" style="color:var(--t2)">${TL(g.kdvTutar)}</td>
            <td class="tr mono" style="font-weight:700;color:var(--green)">${TL(g.toplamTutar)}</td>
            <td><span class="badge ${g.durum === 'odendi' ? 'bg-green' : 'bg-amber'}">${g.durum === 'odendi' ? 'Ödendi' : 'Bekliyor'}</span></td>
            <td>
                <button class="btn btn-danger-soft btn-xs del-g-btn" data-id="${g.id}">SİL</button>
            </td>
        </tr>
    `).join('');

    tb.querySelectorAll('.del-g-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            confirmDlg('Gelir Silinsin mi?', 'Bu işlem geri alınamaz.', 'danger', () => {
                S.gelirler = S.gelirler.filter(x => x.id !== id);
                saveStore();
                renderGelirler();
                toast('Gelir silindi', 'warn');
            });
        });
    });
}

export function openGelirModal(id = null) {
    const g = id ? S.gelirler.find(x => x.id === id) : null;
    const content = `
        <div class="modal-hdr">
            <div class="modal-title">Gelir ${id ? 'Düzenle' : 'Ekle'}</div>
            <button class="modal-close" id="modal-close-btn">×</button>
        </div>
        <div class="modal-body">
            <div class="form-grid c2">
                <div class="fg"><label>Tarih *</label><input type="date" id="f-t" value="${g?.tarih || TODAY()}"></div>
                <div class="fg"><label>Müşteri</label>
                    <select id="f-m">
                        <option value="">— Seç —</option>
                        ${S.musteriler.map(m => `<option value="${m.id}" ${g?.musteri === m.id ? 'selected' : ''}>${m.sirketAd || m.ad}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-grid c2">
                <div class="fg"><label>Kategori *</label>
                    <select id="f-k">${GELIR_KAT.map(k => `<option ${g?.kategori === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
                </div>
                <div class="fg"><label>KDV Oranı</label>
                    <select id="f-v">${KDV.map(r => `<option value="${r}" ${g?.kdvOrani === r ? 'selected' : ''}>${r === 0 ? "KDV'siz" : '%' + r}</option>`).join('')}</select>
                </div>
            </div>
            <div class="form-grid c2">
                <div class="fg"><label>Net Tutar (₺) *</label><input type="number" id="f-tu" value="${g?.tutar || ''}" min="0" step="0.01" placeholder="0.00"></div>
                <div class="fg"><label>Durum</label>
                    <select id="f-d">
                        <option value="odendi" ${!g || g.durum === 'odendi' ? 'selected' : ''}>Ödendi</option>
                        <option value="bekliyor" ${g?.durum === 'bekliyor' ? 'selected' : ''}>Bekliyor</option>
                    </select>
                </div>
            </div>
            <div class="fg" style="margin-bottom:12px"><label>Açıklama</label><input type="text" id="f-a" value="${g?.aciklama || ''}" placeholder="İşlem açıklaması…"></div>
            <div class="calc-row">
                <div class="calc-item"><div class="calc-label">Net</div><div class="calc-value" id="cn">—</div></div>
                <div class="calc-item"><div class="calc-label">KDV</div><div class="calc-value" id="ck">—</div></div>
                <div class="calc-item"><div class="calc-label">Toplam</div><div class="calc-value grand" id="ct">—</div></div>
            </div>
        </div>
        <div class="modal-ftr">
            <button class="btn btn-ghost" id="modal-cancel-btn">İptal</button>
            <button class="btn btn-orange" id="modal-save-btn">Kaydet</button>
        </div>
    `;

    showModal(content);
    
    // Binding events
    document.getElementById('modal-close-btn').onclick = closeModal;
    document.getElementById('modal-cancel-btn').onclick = closeModal;
    
    const inputTutar = document.getElementById('f-tu');
    const inputKdv = document.getElementById('f-v');
    
    const calculate = () => {
        const net = parseFloat(inputTutar.value) || 0;
        const r = parseFloat(inputKdv.value) || 0;
        const kdv = Math.round(net * r) / 100;
        const top = net + kdv;
        document.getElementById('cn').textContent = TL(net);
        document.getElementById('ck').textContent = TL(kdv);
        document.getElementById('ct').textContent = TL(top);
    };

    inputTutar.oninput = calculate;
    inputKdv.onchange = calculate;
    calculate();

    document.getElementById('modal-save-btn').onclick = () => {
        const tutar = parseFloat(inputTutar.value) || 0;
        if (!tutar) { toast('Tutar giriniz', 'warn'); return; }
        
        const kdvOrani = parseFloat(inputKdv.value) || 0;
        const kdvTutar = Math.round(tutar * kdvOrani) / 100;
        const toplamTutar = tutar + kdvTutar;
        
        const rec = {
            id: id || uid(),
            tarih: document.getElementById('f-t').value,
            kategori: document.getElementById('f-k').value,
            aciklama: document.getElementById('f-a').value || document.getElementById('f-k').value,
            musteri: document.getElementById('f-m').value,
            tutar,
            kdvOrani,
            kdvTutar,
            toplamTutar,
            durum: document.getElementById('f-d').value,
            belgeNo: g ? g.belgeNo : `GEL-${Date.now()}`
        };

        if (id) {
            const i = S.gelirler.findIndex(x => x.id === id);
            S.gelirler[i] = rec;
        } else {
            S.gelirler.push(rec);
        }

        saveStore();
        closeModal();
        renderGelirler();
        toast('Gelir kaydedildi');
    };
}

/**
 * Giderler (Expenses) Module
 */
export function renderGiderler() {
    const actions = document.getElementById('ph-actions');
    if (actions) {
        actions.innerHTML = `<button class="btn btn-orange" id="add-gider-btn">GİDER EKLE</button>`;
        document.getElementById('add-gider-btn')?.addEventListener('click', () => openGiderModal());
    }

    const tD = S.giderler.reduce((s, g) => s + g.toplamTutar, 0);
    const kdvD = S.giderler.reduce((s, g) => s + g.kdvTutar, 0);

    const pb = document.getElementById('page-body');
    pb.innerHTML = `
        <div class="sc-row anim">
            <div class="sc"><div class="sc-label">Toplam (KDV Dahil)</div><div class="sc-val" style="color:var(--red)" data-count="${tD}">—</div></div>
            <div class="sc"><div class="sc-label">İndirilebilir KDV</div><div class="sc-val" data-count="${kdvD}">—</div></div>
            <div class="sc"><div class="sc-label">Kayıt Sayısı</div><div class="sc-val">${S.giderler.length}</div></div>
        </div>
        <div class="card anim d1">
            <div class="tbl-wrap">
                <table>
                    <thead>
                        <tr><th>Tarih</th><th>Belge No</th><th>Tedarikçi</th><th>Kategori</th><th>Açıklama</th><th class="tr">KDV %</th><th class="tr">KDV</th><th class="tr">Toplam</th><th>Durum</th><th></th></tr>
                    </thead>
                    <tbody id="d-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count));
        renderGiderTable();
    }, 50);
}

function renderGiderTable() {
    const tb = document.getElementById('d-tbody');
    if (!tb) return;

    let rows = [...S.giderler].sort((a, b) => b.tarih.localeCompare(a.tarih));
    
    if (!rows.length) {
        tb.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--t3)">Kayıt bulunamadı</td></tr>`;
        return;
    }

    tb.innerHTML = rows.map(g => `
        <tr>
            <td style="font-size:11.5px;color:var(--t3);white-space:nowrap">${DT(g.tarih)}</td>
            <td style="font-size:11.5px;color:var(--t2)">${g.belgeNo}</td>
            <td style="font-weight:500">${g.tedarikci || '—'}</td>
            <td><span class="badge bg-amber">${g.kategori}</span></td>
            <td style="color:var(--t2);font-size:12.5px">${g.aciklama}</td>
            <td class="tr" style="color:var(--t3)">%${g.kdvOrani}</td>
            <td class="tr mono" style="color:var(--t2)">${TL(g.kdvTutar)}</td>
            <td class="tr mono" style="font-weight:700;color:var(--red)">${TL(g.toplamTutar)}</td>
            <td><span class="badge ${g.durum === 'odendi' ? 'bg-green' : 'bg-amber'}">${g.durum === 'odendi' ? 'Ödendi' : 'Bekliyor'}</span></td>
            <td>
                <button class="btn btn-danger-soft btn-xs del-d-btn" data-id="${g.id}">SİL</button>
            </td>
        </tr>
    `).join('');

    tb.querySelectorAll('.del-d-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            confirmDlg('Gider Silinsin mi?', 'Bu işlem geri alınamaz.', 'danger', () => {
                S.giderler = S.giderler.filter(x => x.id !== id);
                saveStore();
                renderGiderler();
                toast('Gider silindi', 'warn');
            });
        });
    });
}

export function openGiderModal(id = null) {
    const g = id ? S.giderler.find(x => x.id === id) : null;
    const content = `
        <div class="modal-hdr">
            <div class="modal-title">Gider ${id ? 'Düzenle' : 'Ekle'}</div>
            <button class="modal-close" id="modal-close-btn">×</button>
        </div>
        <div class="modal-body">
            <div class="form-grid c2">
                <div class="fg"><label>Tarih *</label><input type="date" id="d-t" value="${g?.tarih || TODAY()}"></div>
                <div class="fg"><label>Tedarikçi</label><input type="text" id="d-ted" value="${g?.tedarikci || ''}" placeholder="Firma adı…"></div>
            </div>
            <div class="form-grid c2">
                <div class="fg"><label>Kategori *</label>
                    <select id="d-k">${GIDER_KAT.map(k => `<option ${g?.kategori === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
                </div>
                <div class="fg"><label>KDV Oranı</label>
                    <select id="d-v">${KDV.map(r => `<option value="${r}" ${g?.kdvOrani === r ? 'selected' : ''}>%${r}</option>`).join('')}</select>
                </div>
            </div>
            <div class="form-grid c2">
                <div class="fg"><label>Net Tutar (₺) *</label><input type="number" id="d-tu" value="${g?.tutar || ''}" min="0" step="0.01" placeholder="0.00"></div>
                <div class="fg"><label>Durum</label>
                    <select id="d-d">
                        <option value="odendi" ${!g || g.durum === 'odendi' ? 'selected' : ''}>Ödendi</option>
                        <option value="bekliyor" ${g?.durum === 'bekliyor' ? 'selected' : ''}>Bekliyor</option>
                    </select>
                </div>
            </div>
            <div class="fg" style="margin-bottom:12px"><label>Açıklama</label><input type="text" id="d-a" value="${g?.aciklama || ''}" placeholder="Harcama detayı…"></div>
            <div class="calc-row">
                <div class="calc-item"><div class="calc-label">Net</div><div class="calc-value" id="d-cn">—</div></div>
                <div class="calc-item"><div class="calc-label">KDV</div><div class="calc-value" id="d-ck">—</div></div>
                <div class="calc-item"><div class="calc-label">Toplam</div><div class="calc-value grand" id="d-ct">—</div></div>
            </div>
        </div>
        <div class="modal-ftr">
            <button class="btn btn-ghost" id="modal-cancel-btn">İptal</button>
            <button class="btn btn-orange" id="modal-save-btn">Kaydet</button>
        </div>
    `;

    showModal(content);
    
    document.getElementById('modal-close-btn').onclick = closeModal;
    document.getElementById('modal-cancel-btn').onclick = closeModal;
    
    const inputTutar = document.getElementById('d-tu');
    const inputKdv = document.getElementById('d-v');
    
    const calculate = () => {
        const net = parseFloat(inputTutar.value) || 0;
        const r = parseFloat(inputKdv.value) || 0;
        const kdv = Math.round(net * r) / 100;
        const top = net + kdv;
        document.getElementById('d-cn').textContent = TL(net);
        document.getElementById('d-ck').textContent = TL(kdv);
        document.getElementById('d-ct').textContent = TL(top);
    };

    inputTutar.oninput = calculate;
    inputKdv.onchange = calculate;
    calculate();

    document.getElementById('modal-save-btn').onclick = () => {
        const tutar = parseFloat(inputTutar.value) || 0;
        if (!tutar) { toast('Tutar giriniz', 'warn'); return; }
        
        const kdvOrani = parseFloat(inputKdv.value) || 0;
        const kdvTutar = Math.round(tutar * kdvOrani) / 100;
        const toplamTutar = tutar + kdvTutar;
        
        const rec = {
            id: id || uid(),
            tarih: document.getElementById('d-t').value,
            kategori: document.getElementById('d-k').value,
            aciklama: document.getElementById('d-a').value || document.getElementById('d-k').value,
            tedarikci: document.getElementById('d-ted').value,
            tutar,
            kdvOrani,
            kdvTutar,
            toplamTutar,
            durum: document.getElementById('d-d').value,
            belgeNo: g ? g.belgeNo : `GID-${Date.now()}`
        };

        if (id) {
            const i = S.giderler.findIndex(x => x.id === id);
            S.giderler[i] = rec;
        } else {
            S.giderler.push(rec);
        }

        saveStore();
        closeModal();
        renderGiderler();
        toast('Gider kaydedildi');
    };
}

