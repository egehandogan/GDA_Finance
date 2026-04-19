import { S, saveStore } from '../core/state.js';
import { TL, uid, KDV } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';

const ALL_MODULES = [
  {id:'dashboard',name:'Dashboard',desc:'Genel mali durum özeti',tag:'core',zorunlu:true},
  {id:'gelirler',name:'Gelirler',desc:'Gelir kayıtları ve KDV',tag:'core'},
  {id:'giderler',name:'Giderler',desc:'Gider yönetimi ve OCR',tag:'core'},
  {id:'faturalar',name:'Faturalar',desc:'Fatura oluşturma ve takip',tag:'core'},
  {id:'odeme-takip',name:'Ödeme Takip',desc:'Ödeme takvimi',tag:'extra'},
  {id:'musteriler',name:'Müşteriler',desc:'Müşteri yönetimi CRM',tag:'core'},
  {id:'hesaplar',name:'Kasa & Banka',desc:'Nakit akış takibi',tag:'core'},
  {id:'kartlar',name:'Kart Yönetimi',desc:'Yol ve yemek kartları',tag:'extra'},
  {id:'urunler',name:'Ürünler',desc:'Ürün ve hizmet kataloğu',tag:'core'},
  {id:'personeller',name:'Personeller',desc:'Bordro ve personel',tag:'core'},
  {id:'is-takip',name:'İş Takip',desc:'Görev takip sistemi',tag:'extra'},
  {id:'takvim',name:'Takvim',desc:'Finansal hatırlatıcılar',tag:'extra'},
  {id:'analiz',name:'Detaylı Analiz',desc:'Kârlılık analizleri',tag:'core'},
  {id:'raporlar',name:'Raporlar',desc:'Dönemsel raporlar',tag:'core'},
  {id:'kdv',name:'KDV Analizi',desc:'Beyanname özeti',tag:'core'},
  {id:'maas-hesap',name:'Maaş Hesaplama',desc:'Brüt→Net hesap aracı',tag:'tool'},
  {id:'toplu-hesap',name:'Toplu Hesaplama',desc:'Çoklu teklif aracı',tag:'tool'},
];

export function renderAyarlar() {
  document.getElementById('ph-actions').innerHTML = '';
  document.getElementById('filter-bar').style.display = 'none';
  document.getElementById('page-body').innerHTML = `
    <div class="stabs">
      <button class="stab active" onclick="window._switchStabS(0,'s')">Şirket Bilgileri</button>
      <button class="stab" onclick="window._switchStabS(1,'s')">Vergi Ayarları</button>
      <button class="stab" onclick="window._switchStabS(2,'s')">Satış Kanalları</button>
      <button class="stab" onclick="window._switchStabS(3,'s')">Depolama / Drive</button>
      <button class="stab" onclick="window._switchStabS(4,'s')">Dashboard Widgets</button>
      <button class="stab" onclick="window._switchStabS(5,'s')">Kişiselleştirme</button>
    </div>
    <div id="stab-s-0">${buildSirketTab()}</div>
    <div id="stab-s-1" style="display:none">${buildVergiTab()}</div>
    <div id="stab-s-2" style="display:none">${buildKanallarTab()}</div>
    <div id="stab-s-3" style="display:none">${buildDepolamaTab()}</div>
    <div id="stab-s-4" style="display:none">${buildDashboardTab()}</div>
    <div id="stab-s-5" style="display:none">${buildModullerTab()}</div>`;

  window._switchStabS = (idx, prefix) => {
    document.querySelectorAll('.stab').forEach((b, i) => b.classList.toggle('active', i === idx));
    for (let i = 0; i < 6; i++) {
      const el = document.getElementById(`stab-${prefix}-${i}`);
      if (el) el.style.display = i === idx ? 'block' : 'none';
    }
  };
}

function buildSirketTab() {
  const s = S.settings.sirket;
  return `<div class="settings-card">
    <div style="display:grid;grid-template-columns:180px 1fr;gap:24px;align-items:start">
      <div>
        <div class="settings-section">Şirket Logosu</div>
        <div class="logo-drop" id="logo-drop" onclick="document.getElementById('logo-file').click()" title="Logo yükle">
          ${s.logo ? `<img src="${s.logo}" class="logo-preview-img" id="logo-preview"><br><div style="font-size:11px;color:var(--t3);margin-top:6px">Değiştirmek için tıkla</div>`
          : `<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px">LOGO YÜKLE</div><div class="logo-drop-text">Tıkla veya sürükle<br><span style="font-size:11px">PNG, JPG, SVG · Maks 2MB</span></div>`}
        </div>
        <input type="file" id="logo-file" accept="image/*" style="display:none" onchange="window._loadLogo(this)">
        ${s.logo ? `<button class="btn btn-danger-soft btn-xs" style="margin-top:8px;width:100%" onclick="window._removeLogo()">Logoyu Kaldır</button>` : ''}
      </div>
      <div>
        <div class="settings-section">Şirket Bilgileri</div>
        <div class="form-grid c2">
          <div class="fg" style="grid-column:1/-1"><label>Şirket / Ticaret Unvanı *</label><input type="text" id="s-ad" value="${s.ad}" placeholder="A.Ş. / Ltd. Şti."></div>
          <div class="fg"><label>Vergi Kimlik No (VKN)</label><input type="text" id="s-vkn" value="${s.vkn}" placeholder="1234567890"></div>
          <div class="fg"><label>Vergi Dairesi</label><input type="text" id="s-vd" value="${s.vergiDairesi}" placeholder="Kadıköy VD"></div>
          <div class="fg" style="grid-column:1/-1"><label>Açık Adres</label><input type="text" id="s-adres" value="${s.adres}" placeholder="Mah. Cad. No:"></div>
          <div class="fg"><label>İlçe</label><input type="text" id="s-ilce" value="${s.ilce}" placeholder="Kadıköy"></div>
          <div class="fg"><label>İl</label><input type="text" id="s-il" value="${s.il}" placeholder="İstanbul"></div>
        </div>
        <div class="settings-section" style="margin-top:16px">İletişim</div>
        <div class="form-grid c2">
          <div class="fg"><label>Telefon</label><input type="text" id="s-tel" value="${s.tel}" placeholder="0212 555 10 10"></div>
          <div class="fg"><label>E-posta</label><input type="email" id="s-email" value="${s.email}" placeholder="info@firma.com"></div>
          <div class="fg"><label>Web Sitesi</label><input type="text" id="s-web" value="${s.web}" placeholder="www.firma.com"></div>
          <div class="fg"><label>IBAN</label><input type="text" id="s-iban" value="${s.iban}" placeholder="TR00 0000 0000 0000 0000 000000"></div>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
      <button class="btn btn-orange" onclick="window._saveSirket()">Değişiklikleri Kaydet</button>
    </div>
  </div>`;
}

function buildVergiTab() {
  const v = S.settings.vergi;
  return `<div class="settings-card">
    <div class="settings-section">Varsayılan KDV Oranı</div>
    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
      ${[0, 1, 10, 20].map(r => `<label style="display:flex;align-items:center;gap:7px;padding:10px 16px;border:1px solid ${v.varsayilanKdv===r?'var(--blue)':'var(--border)'};border-radius:var(--r);cursor:pointer;background:${v.varsayilanKdv===r?'var(--blue-50)':'var(--white)'}">
        <input type="radio" name="kdv-rad" value="${r}" ${v.varsayilanKdv===r?'checked':''} onchange="S.settings.vergi.varsayilanKdv=parseInt(this.value);window._saveSettings()">
        <span style="font-size:13px;font-weight:600;color:${v.varsayilanKdv===r?'var(--blue)':'var(--t1)'}">${r===0?"%0 (KDV'siz)":'%'+r}</span>
      </label>`).join('')}
    </div>
    <div class="settings-section">Vergi Ayarları</div>
    <div class="toggle-row">
      <div><div class="toggle-label">E-Arşiv Mükellefiyeti</div><div class="toggle-sub">E-Arşiv faturası kesme zorunluluğu var</div></div>
      <label class="toggle"><input type="checkbox" ${v.earsiv?'checked':''} onchange="S.settings.vergi.earsiv=this.checked;window._saveSettings();"><span class="toggle-slider"></span></label>
    </div>
    <div class="toggle-row">
      <div><div class="toggle-label">Stopaj Uygulaması</div><div class="toggle-sub">Stopaj kesintisi uygula</div></div>
      <label class="toggle"><input type="checkbox" ${v.stopaj>0?'checked':''} onchange="S.settings.vergi.stopaj=this.checked?10:0;window._saveSettings();"><span class="toggle-slider"></span></label>
    </div>
  </div>`;
}

function buildKanallarTab() {
  const k = S.settings.kanallar;
  return `<div style="display:flex;flex-direction:column;gap:12px">
    <div class="settings-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div class="settings-section" style="margin-bottom:0;border-bottom:none;padding-bottom:0">Satış Kanalları</div>
        <button class="btn btn-orange btn-sm" onclick="window._openKanalModal()">+ Kanal Ekle</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px" id="kanal-list">
        ${k.map(c => `<div class="channel-item">
          <div class="channel-dot" style="background:${c.renk}"></div>
          <div class="channel-name">${c.ad}</div>
          <span class="channel-badge ${c.aktif?'':'inactive'}">${c.aktif?'Aktif':'Pasif'}</span>
          <button class="btn btn-ghost btn-xs" onclick="window._toggleKanal('${c.id}')">${c.aktif?'Pasife Al':'Aktive Et'}</button>
          <button class="btn btn-danger-soft btn-xs" onclick="window._delKanal('${c.id}')">Sil</button>
        </div>`).join('')}
        ${k.length === 0 ? `<div style="text-align:center;padding:30px;color:var(--t3)">Henüz satış kanalı tanımlanmadı</div>` : ''}
      </div>
    </div>
  </div>`;
}

function buildDepolamaTab() {
  const d = S.settings.depolama || {};
  const isOn = d.aktif && d.driveApiKey && d.driveFolderUrl;
  return `<div style="display:flex;flex-direction:column;gap:14px">
    <div class="settings-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div class="settings-section" style="margin-bottom:0;border:none;padding:0">Google Drive Entegrasyonu</div>
        <span class="drive-chip ${isOn?'on':'off'}">${isOn?'● Bağlı':'○ Bağlı Değil'}</span>
      </div>
      <div class="toggle-row">
        <div><div class="toggle-label">Otomatik Yükleme Aktif</div><div class="toggle-sub">Gider belgelerini Drive'a otomatik yükle</div></div>
        <label class="toggle"><input type="checkbox" id="dep-aktif" ${d.aktif?'checked':''} onchange="S.settings.depolama.aktif=this.checked;window._saveSettings();"><span class="toggle-slider"></span></label>
      </div>
      <div class="toggle-row">
        <div><div class="toggle-label">Kaydet'te Otomatik Yükle</div><div class="toggle-sub">Gider kaydedilince belge Drive'a anında yüklenir</div></div>
        <label class="toggle"><input type="checkbox" id="dep-oto" ${d.otomatikYukle!==false?'checked':''} onchange="S.settings.depolama.otomatikYukle=this.checked;window._saveSettings();"><span class="toggle-slider"></span></label>
      </div>
    </div>
    <div class="settings-card">
      <div class="settings-section">Drive Bağlantı Bilgileri</div>
      <div style="background:var(--blue-50);border-radius:8px;padding:12px 14px;font-size:12px;color:var(--blue);margin-bottom:14px;line-height:1.7">
        <b>Nasıl Bağlanılır?</b><br>
        1. <a href="https://console.cloud.google.com" target="_blank" style="color:var(--blue)">Google Cloud Console</a>'da proje oluşturun<br>
        2. Drive API'yi etkinleştirin<br>
        3. OAuth 2.0 Client ID ve API Key oluşturun<br>
        4. Hedef Drive klasörünüzün paylaşım linkini kopyalayın
      </div>
      <div class="form-grid c2" style="margin-bottom:12px">
        <div class="fg" style="grid-column:1/-1"><label>Drive Klasör URL'si *</label><input type="text" id="dep-url" value="${d.driveFolderUrl||''}" placeholder="https://drive.google.com/drive/folders/FOLDER_ID"></div>
        <div class="fg"><label>API Key</label><input type="password" id="dep-key" value="${d.driveApiKey||''}" placeholder="AIza..."></div>
        <div class="fg"><label>OAuth Client ID</label><input type="text" id="dep-cid" value="${d.driveClientId||''}" placeholder="xxx.apps.googleusercontent.com"></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-orange" onclick="window._saveDriveSettings()">Kaydet</button>
        <button class="btn btn-ghost" onclick="window._testDriveConn()">Bağlantıyı Test Et</button>
      </div>
      <div id="drive-test-result" style="margin-top:10px"></div>
    </div>
  </div>`;
}

function buildModullerTab() {
  const mods = S.settings.moduller || {};
  return `<div>
    <div style="font-size:13px;color:var(--t2);margin-bottom:18px;padding:12px 14px;background:var(--blue-50);border-radius:var(--r);border:1px solid var(--blue-100)">
      Modülleri açıp kapatarak sol paneli ve sistemi kişiselleştirebilirsiniz. Zorunlu modüller devre dışı bırakılamaz.
    </div>
    <div class="mod-gallery">
      ${ALL_MODULES.map(m => {
        const isOn = mods[m.id] !== false;
        const tagCls = m.tag === 'core' ? 'core' : m.tag === 'extra' ? 'extra' : 'tool';
        const tagLbl = m.tag === 'core' ? 'Temel' : m.tag === 'extra' ? 'Ek' : 'Araç';
        return `<div class="mod-card ${isOn ? 'enabled' : ''}" id="modc-${m.id}">
          <div style="font-size:12px;font-weight:800;color:var(--t3);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">${m.id.slice(0,3)}</div>
          <div class="mod-card-name">${m.name}</div>
          <div class="mod-card-desc">${m.desc}</div>
          <div class="mod-card-footer">
            <span class="mod-tag ${tagCls}">${tagLbl}</span>
            <label class="sw" title="${m.zorunlu?'Zorunlu modül':'Kapatmak için tıkla'}">
              <input type="checkbox" ${isOn?'checked':''} ${m.zorunlu?'disabled':''} onchange="window._toggleModule('${m.id}',this.checked)" id="modsw-${m.id}">
              <span class="sw-track"></span>
            </label>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function buildDashboardTab() {
  const WIDGET_DEFS = [
    { id: 'kpi_gelir',     icon: '<svg class="lucide lucide-coins inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>', name: 'Gelir KPI Kartı',          desc: 'Toplam gelir ve trend göstergesi' },
    { id: 'kpi_gider',     icon: '<svg class="lucide lucide-clipboard-list inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>', name: 'Gider KPI Kartı',          desc: 'Toplam gider özeti' },
    { id: 'kpi_net',       icon: '<svg class="lucide lucide-trending-up inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>', name: 'Net Kâr Kartı',            desc: 'Net kâr/zarar ve kârlılık oranı' },
    { id: 'kpi_bekleyen',  icon: '<svg class="lucide lucide-hourglass inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>', name: 'Bekleyen Tahsilat',        desc: 'Tahsil bekleyen fatura tutarı' },
    { id: 'trend_chart',   icon: '<svg class="lucide lucide-bar-chart-2 inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>', name: 'Trend Grafiği',            desc: '6 aylık gelir & gider çizgi grafiği' },
    { id: 'dist_chart',    icon: '<svg class="lucide lucide-pie-chart inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>', name: 'Dağılım Grafiği',          desc: 'Müşteri bazlı gelir dağılımı' },
    { id: 'personel',      icon: '<svg class="lucide lucide-users inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', name: 'Personel Özeti',           desc: 'Personel listesi ve departman dağılımı' },
    { id: 'takvim_hafta',  icon: '<svg class="lucide lucide-calendar inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>', name: 'Haftalık Takvim',          desc: 'Bu haftaki finansal etkinlikler' },
    { id: 'son_islemler',  icon: '<svg class="lucide lucide-clock inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', name: 'Son İşlemler',             desc: 'En son gelir ve gider kayıtları' },
    { id: 'kart_ozetleri', icon: '<svg class="lucide lucide-credit-card inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>', name: 'Kart Özetleri',            desc: 'Şirket kart bakiye ve harcama özeti' },
    { id: 'fatura_durum',  icon: '<svg class="lucide lucide-file-text inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>', name: 'Fatura Durum',             desc: 'Ödendi / bekleyen / gecikmiş sayıları' },
    { id: 'musteri_top',   icon: '<svg class="lucide lucide-trophy inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>', name: 'En İyi Müşteriler',        desc: 'Gelire göre en iyi 5 müşteri' },
  ];
  const current = { kpi_gelir:true, kpi_gider:true, kpi_net:true, kpi_bekleyen:true, trend_chart:true, dist_chart:true, personel:true, takvim_hafta:true, son_islemler:true, kart_ozetleri:true, fatura_durum:true, musteri_top:true, ...(S.settings.dashboardWidgets||{}) };

  return `<div class="settings-card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div class="settings-section" style="margin-bottom:0;border:none;padding:0">Dashboard Widget Yönetimi</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-light btn-sm" onclick="window._dashWidgetAll(true)">Tümünü Aç</button>
        <button class="btn btn-light btn-sm" onclick="window._dashWidgetAll(false)">Tümünü Kapat</button>
      </div>
    </div>
    <p style="font-size:13px;color:var(--t3);margin-bottom:18px">Dashboard'da görüntülenecek widget'ları buradan seçin. Değişiklikler dashboard'a anında yansır.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">
      ${WIDGET_DEFS.map(w => {
        const on = current[w.id] !== false;
        return `<div class="widget-card ${on ? 'widget-on' : ''}" id="wcard-${w.id}">
          <div style="font-size:22px;margin-bottom:8px">${w.icon}</div>
          <div style="font-size:13px;font-weight:700;color:var(--t1);margin-bottom:3px">${w.name}</div>
          <div style="font-size:11.5px;color:var(--t3);margin-bottom:12px;line-height:1.4">${w.desc}</div>
          <label class="toggle" style="margin-top:auto">
            <input type="checkbox" id="wsw-${w.id}" ${on ? 'checked' : ''} onchange="window._toggleDashWidget('${w.id}',this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

window._toggleDashWidget = function(id, on) {
  if (!S.settings.dashboardWidgets) S.settings.dashboardWidgets = {};
  S.settings.dashboardWidgets[id] = on;
  const card = document.getElementById('wcard-' + id);
  if (card) card.classList.toggle('widget-on', on);
  saveStore();
  toast(on ? 'Widget eklendi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : 'Widget kaldırıldı', 'ok');
};

window._dashWidgetAll = function(on) {
  if (!S.settings.dashboardWidgets) S.settings.dashboardWidgets = {};
  ['kpi_gelir','kpi_gider','kpi_net','kpi_bekleyen','trend_chart','dist_chart','personel','takvim_hafta','son_islemler','kart_ozetleri','fatura_durum','musteri_top'].forEach(id => {
    S.settings.dashboardWidgets[id] = on;
    const cb = document.getElementById('wsw-' + id); if (cb) cb.checked = on;
    const card = document.getElementById('wcard-' + id); if (card) card.classList.toggle('widget-on', on);
  });
  saveStore();
  toast(on ? 'Tüm widgetlar açıldı' : 'Tüm widgetlar kapatıldı', 'ok');
};

// ── Global Actions ─────────────────────────────────────────────────────────────
window._saveSettings = function() { saveStore(); toast('Kaydedildi'); };

window._saveSirket = function() {
  const s = S.settings.sirket;
  s.ad = document.getElementById('s-ad').value.trim() || s.ad;
  s.vkn = document.getElementById('s-vkn').value.trim();
  s.vergiDairesi = document.getElementById('s-vd').value.trim();
  s.adres = document.getElementById('s-adres').value.trim();
  s.ilce = document.getElementById('s-ilce').value.trim();
  s.il = document.getElementById('s-il').value.trim();
  s.tel = document.getElementById('s-tel').value.trim();
  s.email = document.getElementById('s-email').value.trim();
  s.web = document.getElementById('s-web').value.trim();
  s.iban = document.getElementById('s-iban').value.trim();
  saveStore();
  const cn = document.querySelector('.sn-cn'); if (cn) cn.textContent = s.ad;
  const cs = document.querySelector('.sn-cs'); if (cs) cs.textContent = `VKN: ${s.vkn || '—'}`;
  toast('Şirket bilgileri kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

window._loadLogo = function(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast("Logo 2MB'dan küçük olmalı", 'warn'); return; }
  const reader = new FileReader();
  reader.onload = e => { S.settings.sirket.logo = e.target.result; saveStore(); renderAyarlar(); toast('Logo yüklendi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'); };
  reader.readAsDataURL(file);
};

window._removeLogo = function() { S.settings.sirket.logo = null; saveStore(); renderAyarlar(); toast('Logo kaldırıldı', 'warn'); };

window._openKanalModal = function() {
  showModal(`<div class="modal-hdr"><div class="modal-title">Satış Kanalı Ekle</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="fg" style="margin-bottom:12px"><label>Kanal Adı *</label><input type="text" id="kn-ad" placeholder="ör: Instagram, Trendyol, Bayi"></div>
    <div class="form-grid c2">
      <div class="fg"><label>Renk</label><input type="color" id="kn-renk" value="#2563EB" style="height:40px;padding:4px;cursor:pointer"></div>
      <div class="fg"><label>Durum</label><select id="kn-aktif"><option value="true">Aktif</option><option value="false">Pasif</option></select></div>
    </div>
  </div>
  <div class="modal-ftr"><button class="btn btn-ghost" onclick="window.closeModal()">İptal</button><button class="btn btn-orange" onclick="window._saveKanal()">Ekle</button></div>`);
};

window._saveKanal = function() {
  const ad = document.getElementById('kn-ad').value.trim(); if (!ad) { toast('Kanal adı gerekli', 'warn'); return; }
  S.settings.kanallar.push({ id: uid(), ad, renk: document.getElementById('kn-renk').value, aktif: document.getElementById('kn-aktif').value === 'true' });
  saveStore(); closeModal(); renderAyarlar(); toast('Kanal eklendi');
};

window._toggleKanal = function(id) { const k = S.settings.kanallar.find(x => x.id === id); if (k) { k.aktif = !k.aktif; saveStore(); renderAyarlar(); toast('Güncellendi'); } };
window._delKanal = function(id) {
  confirmDlg('Kanal silinecek', 'Bu satış kanalı kaldırılacak. Emin misiniz?', 'danger', () => {
    S.settings.kanallar = S.settings.kanallar.filter(k => k.id !== id); saveStore(); renderAyarlar(); toast('Silindi', 'warn');
  });
};

window._saveDriveSettings = function() {
  if (!S.settings.depolama) S.settings.depolama = {};
  S.settings.depolama.driveFolderUrl = document.getElementById('dep-url')?.value.trim() || '';
  S.settings.depolama.driveApiKey = document.getElementById('dep-key')?.value.trim() || '';
  S.settings.depolama.driveClientId = document.getElementById('dep-cid')?.value.trim() || '';
  saveStore(); toast('Drive ayarları kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
  renderAyarlar(); window._switchStabS(3, 's');
};

window._testDriveConn = async function() {
  const r = document.getElementById('drive-test-result'); if (!r) return;
  const key = S.settings.depolama?.driveApiKey || '';
  const url = S.settings.depolama?.driveFolderUrl || '';
  if (!key || !url) { r.innerHTML = `<div class="ocr-status fail">API Key ve Klasör URL'si girilmeli</div>`; return; }
  r.innerHTML = `<div class="ocr-status scanning"><span class="ocr-spin"></span>Test ediliyor…</div>`;
  try {
    const fid = url.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1];
    if (!fid) throw new Error('Geçersiz URL');
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fid}?key=${key}&fields=id,name`);
    if (res.ok) { const d = await res.json(); r.innerHTML = `<div class="ocr-status ok"><svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Bağlantı başarılı · Klasör: "${d.name}"</div>`; }
    else throw new Error((await res.json()).error?.message || 'Erişim reddedildi');
  } catch (e) { r.innerHTML = `<div class="ocr-status fail">✗ ${e.message}</div>`; }
};

window._toggleModule = function(id, aktif) {
  if (!S.settings.moduller) S.settings.moduller = {};
  S.settings.moduller[id] = aktif;
  const card = document.getElementById(`modc-${id}`);
  if (card) card.classList.toggle('enabled', aktif);
  saveStore();
  toast(aktif ? `${ALL_MODULES.find(m=>m.id===id)?.name} modülü açıldı` : 'Modül kapatıldı', 'ok');
};
