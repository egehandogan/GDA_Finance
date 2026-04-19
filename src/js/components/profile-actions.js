import { showModal, closeModal, toast, confirmDlg } from './ui.js';
import { logout } from '../core/auth.js';
import { navigate } from '../core/router.js';

/**
 * Profile Related Actions (Support, Admin, Logout)
 */

export function openSupportModal() {
    const content = `
        <div class="modal-hdr">
            <div class="modal-title">Teknik Destek</div>
            <button class="modal-close" id="sup-close">×</button>
        </div>
        <div class="modal-body">
            <div class="fg" style="margin-bottom:12px">
                <label>İlgili Bölüm *</label>
                <select id="sup-kat">
                    <option value="">— Seçiniz —</option>
                    <option>Dashboard</option>
                    <option>Gelir & Gider</option>
                    <option>Faturalandırma</option>
                    <option>Müşteri Kayıtları</option>
                    <option>Sistem Ayarları</option>
                    <option>Diğer</option>
                </select>
            </div>
            <div class="fg" style="margin-bottom:12px">
                <label>Konu *</label>
                <input type="text" id="sup-konu" placeholder="Destek başlığı">
            </div>
            <div class="fg">
                <label>Açıklama *</label>
                <textarea id="sup-desc" placeholder="Sorununuzu detaylıca açıklayın…" style="min-height:120px"></textarea>
            </div>
        </div>
        <div class="modal-ftr">
            <button class="btn btn-ghost" id="sup-cancel">İptal</button>
            <button class="btn btn-blue" id="sup-send" disabled>Destek Talebi Gönder</button>
        </div>
    `;

    showModal(content);
    
    document.getElementById('sup-close').onclick = closeModal;
    document.getElementById('sup-cancel').onclick = closeModal;
    
    const kat = document.getElementById('sup-kat');
    const konu = document.getElementById('sup-konu');
    const desc = document.getElementById('sup-desc');
    const btn = document.getElementById('sup-send');

    const validate = () => {
        btn.disabled = !(kat.value && konu.value.trim() && desc.value.trim());
    };

    [kat, konu, desc].forEach(el => el.oninput = validate);

    btn.onclick = () => {
        btn.textContent = 'Gönderiliyor…';
        btn.disabled = true;
        setTimeout(() => {
            showSuccessModal();
        }, 1000);
    };
}

function showSuccessModal() {
    showModal(`
        <div style="padding:40px;text-align:center">
            <div style="width:64px;height:64px;background:var(--green-50);color:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 20px">✓</div>
            <h3 style="margin-bottom:12px">Talebiniz Alındı</h3>
            <p style="color:var(--t3);font-size:14px;line-height:1.5;margin-bottom:24px">Destek talebiniz başarıyla oluşturuldu. <br>Ekibimiz en kısa sürede size dönüş yapacaktır.</p>
            <button class="btn btn-blue" id="sup-ok" style="width:100%">Tamam</button>
        </div>
    `);
    document.getElementById('sup-ok').onclick = () => {
        closeModal();
        navigate('dashboard');
    };
}

export function openSetAdminModal() {
    const content = `
        <div class="modal-hdr">
            <div class="modal-title">Yönetici Atama</div>
            <button class="modal-close" id="adm-close">×</button>
        </div>
        <div class="modal-body">
            <div class="fg" style="margin-bottom:12px">
                <label>Kurumsal E-posta *</label>
                <input type="email" id="adm-email" placeholder="örnek@gda.com.tr">
            </div>
            <div class="fg" style="margin-bottom:12px">
                <label>Belirlenen Şifre *</label>
                <input type="password" id="adm-pass" placeholder="••••••••">
            </div>
            <div id="adm-info" style="font-size:12px;color:var(--t3);padding:12px;background:var(--bg);border-radius:8px">
                ⚠️ Belirlediğiniz kullanıcı sisteme tam erişim yetkisi ile tanımlanacaktır. Sadece şirket uzantılı mailler kabul edilmektedir.
            </div>
        </div>
        <div class="modal-ftr">
            <button class="btn btn-ghost" id="adm-cancel">İptal</button>
            <button class="btn btn-blue" id="adm-submit" disabled>Yönetici Tanımla</button>
        </div>
    `;

    showModal(content);
    
    document.getElementById('adm-close').onclick = closeModal;
    document.getElementById('adm-cancel').onclick = closeModal;

    const email = document.getElementById('adm-email');
    const pass = document.getElementById('adm-pass');
    const btn = document.getElementById('adm-submit');

    const validate = () => {
        const eVal = email.value.trim();
        const isCorp = eVal.includes('@') && (eVal.endsWith('.com.tr') || eVal.endsWith('.com')); // Simplified corp check
        btn.disabled = !(isCorp && pass.value.length >= 6);
    };

    [email, pass].forEach(el => el.oninput = validate);

    btn.onclick = () => {
        toast('Yeni yönetici başarıyla atandı', 'ok');
        closeModal();
    };
}

export function handleLogout() {
    confirmDlg('Çıkış Yap', 'Sistemden çıkmak istediğinizden emin misiniz?', 'danger', () => {
        logout();
    });
}
