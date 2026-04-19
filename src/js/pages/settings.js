import { S, saveStore } from '../core/state.js';
import { toast } from '../components/ui.js';

/**
 * Settings (Ayarlar) Module
 * Handles Company info, Module toggles, and Drive integration settings.
 */

export function renderSettings() {
  const pb = document.getElementById('page-body');
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-orange" onclick="window.saveSettings()">AYARLARI KAYDET</button>
  `;

  const s = S.settings;

  pb.innerHTML = `
    <div class="stabs anim">
      <button class="stab active" id="stab-genel" onclick="window.switchSettTab('genel')">Genel</button>
      <button class="stab" id="stab-modul" onclick="window.switchSettTab('modul')">Modüller</button>
      <button class="stab" id="stab-drive" onclick="window.switchSettTab('drive')">Google Drive</button>
    </div>

    <div id="settings-content" class="anim d1">
       <!-- Dynamic Content -->
    </div>
  `;

  window.switchSettTab('genel');
}

window.switchSettTab = (tab) => {
  const container = document.getElementById('settings-content');
  if(!container) return;

  document.querySelectorAll('.stab').forEach(el => el.classList.toggle('active', el.id === `stab-${tab}`));

  if(tab === 'genel') {
    const s = S.settings.sirket;
    container.innerHTML = `
      <div class="settings-card">
        <div class="settings-section">ŞİRKET BİLGİLERİ</div>
        <div class="fg"><label>Şirket Resmi Ünvanı</label><input type="text" id="s-ad" value="${s.ad || ''}"></div>
        <div class="form-grid c3" style="margin-top:12px">
           <div class="fg"><label>VKN / TCKN</label><input type="text" id="s-vkn" value="${s.vkn || ''}"></div>
           <div class="fg"><label>Vergi Dairesi</label><input type="text" id="s-vd" value="${s.vergiDairesi || ''}"></div>
           <div class="fg"><label>E-posta</label><input type="text" id="s-email" value="${s.email || ''}"></div>
        </div>
        <div class="fg" style="margin-top:12px"><label>İş Adresi</label><textarea id="s-adres">${s.adres || ''}</textarea></div>
        <div class="fg" style="margin-top:12px"><label>IBAN Adresi</label><input type="text" id="s-iban" value="${s.iban || ''}"></div>
      </div>
    `;
  } else if(tab === 'modul') {
    const m = S.settings.moduller;
    container.innerHTML = `
      <div class="settings-card">
        <div class="settings-section">AKTİF MODÜLLER</div>
        <p style="font-size:12px;color:var(--t3);margin-bottom:15px">Kullanmadığınız modülleri kapatarak arayüzü sadeleştirebilirsiniz.</p>
        
        ${Object.keys(m).map(key => `
          <div class="toggle-row">
            <div>
              <div class="toggle-label">${key.toUpperCase()}</div>
              <div class="toggle-sub">Bu modülü yan menüde göster</div>
            </div>
            <div class="toggle"><input type="checkbox" id="m-${key}" ${m[key] ? 'checked' : ''}><span class="toggle-slider"></span></div>
          </div>
        `).join('')}
      </div>
    `;
  } else if(tab === 'drive') {
    const d = S.settings.depolama;
    container.innerHTML = `
      <div class="settings-card">
        <div class="settings-section">GOOGLE DRIVE ENTEGRASYONU</div>
        <div class="drive-chip ${d.aktif ? 'on' : 'off'}">
          ${d.aktif ? '✓ Drive Bağlı' : '○ Drive Bağlı Değil'}
        </div>
        <div class="fg" style="margin-top:15px"><label>Folder URL</label><input type="text" id="d-url" value="${d.driveFolderUrl || ''}" placeholder="https://drive.google.com/..."></div>
        <div class="fg" style="margin-top:12px"><label>API Key</label><input type="password" id="d-key" value="${d.driveApiKey || ''}"></div>
      </div>
    `;
  }
};

window.saveSettings = () => {
  // Update S.settings based on inputs (Genel Tab)
  if(document.getElementById('s-ad')) {
    S.settings.sirket.ad = document.getElementById('s-ad').value;
    S.settings.sirket.vkn = document.getElementById('s-vkn').value;
    S.settings.sirket.vergiDairesi = document.getElementById('s-vd').value;
    S.settings.sirket.email = document.getElementById('s-email').value;
    S.settings.sirket.adres = document.getElementById('s-adres').value;
    S.settings.sirket.iban = document.getElementById('s-iban').value;
  }
  
  // Update Modules (if visible)
  if(document.getElementById('m-dashboard')) {
    Object.keys(S.settings.moduller).forEach(key => {
      const el = document.getElementById(`m-${key}`);
      if(el) S.settings.moduller[key] = el.checked;
    });
  }

  saveStore();
  toast('Ayarlar kaydedildi ✓');
  // Refresh sidebar to reflect module changes if integrated
  if(window.updateSidebarModules) window.updateSidebarModules();
};
