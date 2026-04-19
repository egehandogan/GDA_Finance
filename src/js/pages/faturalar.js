import { S, saveStore } from '../core/state.js';
import { TL, DT, countUp, uid, TODAY, musName, musColor } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';
import { navigate } from '../core/router.js';
import { KDV } from '../core/constants.js';

/**
 * Faturalar (Invoices) Module
 */
export function renderFaturalar() {
    const actions = document.getElementById('ph-actions');
    if (actions) {
        actions.innerHTML = `
            <button class="btn btn-ghost" id="open-editor-btn">Fatura Tasarım Editörü</button>
            <button class="btn btn-orange" id="add-fatura-btn">+ Yeni Fatura</button>
        `;
        document.getElementById('open-editor-btn')?.addEventListener('click', () => navigate('fatura-editor'));
        document.getElementById('add-fatura-btn')?.addEventListener('click', () => openFaturaModal());
    }

    const tF = S.faturalar.reduce((s, f) => s + f.toplam, 0);
    const bek = S.faturalar.filter(f => f.durum === 'bekliyor' || f.durum === 'gecikti');
    const tBek = bek.reduce((s, f) => s + f.toplam, 0);

    const pb = document.getElementById('page-body');
    pb.innerHTML = `
        <div class="sc-row anim">
            <div class="sc"><div class="sc-label">Toplam Fatura Tutarı</div><div class="sc-val" data-count="${tF}">—</div></div>
            <div class="sc"><div class="sc-label">Bekleyen Tahsilat</div><div class="sc-val" style="color:var(--amber)" data-count="${tBek}">—</div></div>
            <div class="sc"><div class="sc-label">Fatura Sayısı</div><div class="sc-val">${S.faturalar.length}</div></div>
            <div class="sc"><div class="sc-label">Gecikmiş Fatura</div><div class="sc-val" style="color:var(--red)">${S.faturalar.filter(f => f.durum === 'gecikti').length}</div></div>
        </div>
        <div class="card anim d1">
            <div class="tbl-wrap">
                <table>
                    <thead>
                        <tr><th>Tarih</th><th>Fatura No</th><th>Müşteri</th><th class="tr">Ara Toplam</th><th class="tr">KDV</th><th class="tr">Toplam</th><th>Durum</th><th></th></tr>
                    </thead>
                    <tbody id="f-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count));
        renderFaturaTable();
    }, 50);
}

function renderFaturaTable() {
    const tb = document.getElementById('f-tbody');
    if (!tb) return;

    let rows = [...S.faturalar].sort((a, b) => b.tarih.localeCompare(a.tarih));

    if (!rows.length) {
        tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--t3)">Fatura bulunamadı</td></tr>`;
        return;
    }

    tb.innerHTML = rows.map(f => `
        <tr>
            <td style="font-size:11.5px;color:var(--t3)">${DT(f.tarih)}</td>
            <td style="font-weight:700;color:var(--t1)">${f.no}</td>
            <td>
                <span style="display:flex;align-items:center;gap:6px">
                    <span style="width:6px;height:6px;border-radius:50%;background:${musColor(f.musteri)}"></span>
                    <span style="font-weight:500">${musName(f.musteri)}</span>
                </span>
            </td>
            <td class="tr mono">${TL(f.ara)}</td>
            <td class="tr mono">${TL(f.kdv)}</td>
            <td class="tr mono" style="font-weight:700;color:var(--t1)">${TL(f.toplam)}</td>
            <td><span class="badge ${getStatusBadge(f.durum)}">${f.durum.toUpperCase()}</span></td>
            <td>
                <button class="btn btn-light btn-xs view-f-btn" data-id="${f.id}">Gör</button>
                <button class="btn btn-danger-soft btn-xs del-f-btn" data-id="${f.id}">Sil</button>
            </td>
        </tr>
    `).join('');

    tb.querySelectorAll('.del-f-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            confirmDlg('Faturayı Sil?', 'Bu işlem faturayı kalıcı olarak kaldıracaktır.', 'danger', () => {
                S.faturalar = S.faturalar.filter(x => x.id !== id);
                saveStore();
                renderFaturalar();
                toast('Fatura silindi', 'warn');
            });
        };
    });

    tb.querySelectorAll('.view-f-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            // navigate('fatura-goruntule', {id}); // Future routing with params
            toast('Görüntüleme modülü yakında...', 'info');
        };
    });
}

function getStatusBadge(status) {
    if (status === 'odendi') return 'bg-green';
    if (status === 'gecikti') return 'bg-red';
    return 'bg-amber';
}

export function openFaturaModal() {
    const prodOpts = S.urunler.length ? `<option value="">— Manuel Giriş —</option>${S.urunler.map(p => `<option value="${p.id}">[${p.kod}] ${p.ad} — ${TL(p.birimFiyat)}</option>`).join('')}` : '<option value="">— Ürün yok —</option>';
    
    const content = `
        <div class="modal-hdr"><div class="modal-title">Fatura Oluştur</div><button class="modal-close" id="f-modal-close">×</button></div>
        <div class="modal-body">
            <div class="form-grid c2">
                <div class="fg"><label>Müşteri *</label><select id="f-m-sel"><option value="">— Seç —</option>${S.musteriler.map(m => `<option value="${m.id}">${musName(m.id)}</option>`).join('')}</select></div>
                <div class="fg"><label>Fatura Tasarımı</label><select id="f-t-sel">${S.faturaTasarımları.map(t => `<option value="${t.id}" ${t.id === S.activeTemplateId ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
            </div>
            <div class="form-grid c2">
                <div class="fg"><label>Fatura No</label><input type="text" id="f-no-in" value="FAT-${Date.now().toString().slice(-6)}"></div>
                <div class="fg"><label>Tarih *</label><input type="date" id="f-tar-in" value="${TODAY()}"></div>
            </div>
            <hr class="hdivider">
            <div style="font-size:12.5px;font-weight:700;margin-bottom:10px">Fatura Kalemleri</div>
            <div style="overflow-x:auto"><table style="width:100%">
                <thead><tr style="background:var(--bg)">
                    <th style="padding:7px;text-align:left;font-size:10.5px">AÇIKLAMA</th>
                    <th style="width:60px;font-size:10.5px">MKT</th>
                    <th style="width:110px;font-size:10.5px">BİRİM FİYAT</th>
                    <th style="width:80px;font-size:10.5px">KDV %</th>
                    <th style="width:110px;text-align:right;font-size:10.5px">TOPLAM</th>
                    <th style="width:30px"></th>
                </tr></thead>
                <tbody id="k-tb-body"></tbody>
            </table></div>
            <button class="btn btn-ghost btn-xs" id="add-k-row-btn" style="margin-top:8px">+ Satır Ekle</button>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;margin-top:14px;border-top:1px solid var(--border);padding-top:10px">
                <div style="font-size:12px;color:var(--t3)">Ara Toplam: <span id="f-ara-sum">—</span></div>
                <div style="font-size:12px;color:var(--t3)">KDV: <span id="f-kdv-sum">—</span></div>
                <div style="font-size:15px;font-weight:700">Genel Toplam: <span id="f-top-sum" style="color:var(--blue)">—</span></div>
            </div>
        </div>
        <div class="modal-ftr">
            <button class="btn btn-ghost" id="f-modal-cancel">İptal</button>
            <button class="btn btn-orange" id="f-modal-save">Fatura Kaydet</button>
        </div>
    `;

    showModal(content);
    document.getElementById('f-modal-close').onclick = closeModal;
    document.getElementById('f-modal-cancel').onclick = closeModal;

    const kBody = document.getElementById('k-tb-body');
    const addRowBtn = document.getElementById('add-k-row-btn');

    addRowBtn.onclick = () => addKalemRow(kBody, prodOpts);
    
    // Initial row
    addKalemRow(kBody, prodOpts);

    document.getElementById('f-modal-save').onclick = () => {
        const musId = document.getElementById('f-m-sel').value;
        if (!musId) { toast('Lütfen müşteri seçin', 'warn'); return; }

        const items = [];
        let ara = 0, kdvTot = 0;
        
        kBody.querySelectorAll('tr').forEach(tr => {
            const desc = tr.querySelector('.ka').value.trim();
            const mkt = parseFloat(tr.querySelector('.km').value) || 0;
            const price = parseFloat(tr.querySelector('.kf').value) || 0;
            const kdvRate = parseFloat(tr.querySelector('.kk').value) || 0;
            
            if (desc && price) {
                const lineNet = mkt * price;
                const lineKdv = lineNet * kdvRate / 100;
                ara += lineNet;
                kdvTot += lineKdv;
                items.push({ aciklama: desc, miktar: mkt, fiyat: price, kdv: kdvRate, toplam: lineNet + lineKdv });
            }
        });

        if (!items.length) { toast('Lütfen en az bir kalem girin', 'warn'); return; }

        S.faturalar.push({
            id: uid(),
            no: document.getElementById('f-no-in').value || `FAT-${Date.now()}`,
            tarih: document.getElementById('f-tar-in').value,
            vade: TODAY(), 
            musteri: musId,
            kalemler: items,
            ara,
            kdv: kdvTot,
            toplam: ara + kdvTot,
            durum: 'bekliyor',
            templateId: document.getElementById('f-t-sel').value
        });

        saveStore();
        closeModal();
        renderFaturalar();
        toast('Fatura başarıyla oluşturuldu');
    };
}

function addKalemRow(container, prodOpts) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="padding:4px"><input type="text" class="ka" style="width:100%" placeholder="Ürün/Hizmet…"></td>
        <td style="padding:4px"><input type="number" class="km" value="1" min="1" style="width:100%;text-align:right"></td>
        <td style="padding:4px"><input type="number" class="kf" value="0" step="0.01" style="width:100%;text-align:right"></td>
        <td style="padding:4px"><select class="kk" style="width:100%">${KDV.map(r => `<option value="${r}">${r}%</option>`).join('')}</select></td>
        <td style="padding:4px;text-align:right;font-weight:600" class="line-sum">—</td>
        <td style="padding:4px;text-align:center"><button class="rem-k" style="background:none;border:none;color:var(--red);cursor:pointer">×</button></td>
    `;
    container.appendChild(tr);

    const inputs = tr.querySelectorAll('input, select');
    const updateLine = () => {
        const m = parseFloat(tr.querySelector('.km').value) || 0;
        const f = parseFloat(tr.querySelector('.kf').value) || 0;
        const k = parseFloat(tr.querySelector('.kk').value) || 0;
        const tot = m * f * (1 + k / 100);
        tr.querySelector('.line-sum').textContent = TL(tot);
        updateOverallSum(container.closest('.modal-body'));
    };

    inputs.forEach(i => i.oninput = updateLine);
    tr.querySelector('.rem-k').onclick = () => { tr.remove(); updateOverallSum(container.closest('.modal-body')); };
}

function updateOverallSum(modalBody) {
    let ara = 0, kdv = 0;
    modalBody.querySelectorAll('#k-tb-body tr').forEach(tr => {
        const m = parseFloat(tr.querySelector('.km').value) || 0;
        const f = parseFloat(tr.querySelector('.kf').value) || 0;
        const k = parseFloat(tr.querySelector('.kk').value) || 0;
        const net = m * f;
        ara += net;
        kdv += net * k / 100;
    });
    document.getElementById('f-ara-sum').textContent = TL(ara);
    document.getElementById('f-kdv-sum').textContent = TL(kdv);
    document.getElementById('f-top-sum').textContent = TL(ara + kdv);
}
