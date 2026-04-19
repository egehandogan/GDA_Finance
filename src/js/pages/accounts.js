import { S, saveStore } from '../core/state.js';
import { TL, uid } from '../utils/formatters.js';
import { toast, showModal, closeModal } from '../components/ui.js';

/**
 * Accounts (Hesaplar) and Cards module.
 */

export function renderAccounts() {
  const pb = document.getElementById('page-body');
  const actionHdr = document.getElementById('ph-actions');
  
  if (actionHdr) {
    actionHdr.innerHTML = `
      <button class="btn btn-ghost" onclick="window.navigate('kartlar')">KARTLARIM</button>
      <button class="btn btn-orange" onclick="window.openHesapModal()">YENİ HESAP EKLE</button>
    `;
  }

  const hesaplar = S.hesaplar || [];
  const totalBakiye = hesaplar.reduce((s, h) => s + h.bakiye, 0);

  pb.innerHTML = `
    <div class="sc-row anim">
      <div class="sc"><div class="sc-label">Toplam Nakit Bakiye</div><div class="sc-val" style="color:var(--blue)">${TL(totalBakiye)}</div></div>
    </div>

    <div class="hg anim d1">
      ${hesaplar.map(h => `
        <div class="hc anim-scale" style="background:${h.tip === 'banka' ? 'var(--blue-50)' : 'var(--orange-50)'}; color:${h.tip === 'banka' ? 'var(--blue)' : 'var(--orange)'}">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">${h.tip === 'banka' ? 'BANKA HESABI' : 'KASA / NAKİT'}</div>
          <div style="font-weight:800;font-size:18px;margin:10px 0;color:var(--t1)">${h.ad}</div>
          <div style="font-size:20px;font-weight:800;font-variant-numeric:tabular-nums">${TL(h.bakiye)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderCards() {
  const pb = document.getElementById('page-body');
  document.getElementById('ph-actions').innerHTML = `
    <button class="btn btn-ghost" onclick="window.navigate('hesaplar')">Hesaplara Dön</button>
    <button class="btn btn-orange" onclick="window.openKartModal()">YENİ KART EKLE</button>
  `;

  const kartlar = S.kartlar || [];

  pb.innerHTML = `
    <div class="kart-grid anim">
      ${kartlar.length === 0 ? `<div style="grid-column:1/-1;text-align:center;padding:100px;color:var(--t3)">Henüz kayıtlı bir kart yok.</div>` : 
        kartlar.map(k => `
          <div class="kart-3d ${k.renk || 'kart-siyah'} anim-scale">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div class="kart-chip"></div>
              <div class="kart-tip-badge">${k.tip || 'VISA'}</div>
            </div>
            <div class="kart-no">**** **** **** ${k.sonDort || '4242'}</div>
            <div>
              <div class="kart-bank">${k.banka || 'GDA BANK'}</div>
              <div class="kart-bakiye">${TL(k.limit || 0)}</div>
              <div class="kart-name">${k.ad || 'ŞİRKET KARTI'}</div>
            </div>
          </div>
        `).join('')
      }
    </div>
  `;
}

window.openHesapModal = () => {
  showModal(`
    <div class="modal-hdr"><div class="modal-title">Yeni Hesap</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>Hesap Adı</label><input type="text" id="h-ad" placeholder="Örn: Garanti Vadesiz"></div>
      <div class="fg"><label>Hesap Tipi</label><select id="h-tip"><option value="banka">Banka Hesabı</option><option value="kasa">Kasa / Nakit</option></select></div>
      <div class="fg"><label>Açılış Bakiyesi (₺)</label><input type="number" id="h-bak" value="0"></div>
    </div>
    <div class="modal-ftr">
      <button class="btn btn-ghost" onclick="closeModal()">İptal</button>
      <button class="btn btn-orange" onclick="window.saveHesap()">Kaydet</button>
    </div>
  `);
};

window.saveHesap = () => {
  const ad = document.getElementById('h-ad').value;
  if(!ad) return;
  S.hesaplar.push({
    id: uid(),
    ad: ad,
    tip: document.getElementById('h-tip').value,
    bakiye: parseFloat(document.getElementById('h-bak').value) || 0
  });
  saveStore();
  closeModal();
  renderAccounts();
  toast('Hesap başarıyla eklendi ✓');
};

window.openKartModal = () => {
   // Simplified modal for cards
   S.kartlar.push({
     id: uid(),
     ad: 'Business Card',
     banka: 'Akbank',
     sonDort: Math.floor(1000 + Math.random() * 9000).toString(),
     limit: 50000,
     renk: ['kart-siyah','kart-mavi','kart-yesil','kart-mor'][Math.floor(Math.random()*4)]
   });
   saveStore();
   renderCards();
   toast('Yeni kart tanımlandı ✓');
};
