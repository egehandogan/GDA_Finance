import { S, saveStore } from '../core/state.js';
import { TL, DT, uid, TODAY, hashColor, MS, ASG_UCRET } from '../utils/formatters.js';
import { toast, showModal, closeModal, confirmDlg } from '../components/ui.js';
import { navigate } from '../core/router.js';

// ── Maaş Matematiği ──────────────────────────────────────────────────────────
function calcGV(matrahi) {
  if (matrahi <= 0) return 0;
  const y = matrahi * 12;
  let v = 0;
  if (y <= 158000)       v = y * 0.15;
  else if (y <= 330000)  v = 23700 + (y - 158000) * 0.20;
  else if (y <= 800000)  v = 57900 + (y - 330000) * 0.27;
  else if (y <= 4300000) v = 184890 + (y - 800000) * 0.35;
  else                   v = 1409890 + (y - 4300000) * 0.40;
  return v / 12;
}

function calcAGI(medeni, cocuk, es) {
  let k = 0.5;
  if (medeni === 'evli') {
    k = es ? 0.5 : 0.75;
    if (cocuk === 1)    k += 0.075;
    else if (cocuk === 2) k += 0.10;
    else if (cocuk >= 3)  k += 0.125;
  }
  return ASG_UCRET * 12 * k * 0.15 / 12;
}

export function hesaplaMaas(brut, medeni, cocuk, es) {
  const sgkI  = Math.round(brut * 0.14 * 100) / 100;
  const issI  = Math.round(brut * 0.01 * 100) / 100;
  const topSgk = sgkI + issI;
  const gvMat = Math.round((brut - topSgk) * 100) / 100;
  const gv    = Math.round(calcGV(gvMat) * 100) / 100;
  const agi   = Math.round(calcAGI(medeni, cocuk, es) * 100) / 100;
  const netGV = Math.max(0, Math.round((gv - agi) * 100) / 100);
  const damga = Math.round(brut * 0.00759 * 100) / 100;
  const net   = Math.round((brut - topSgk - netGV - damga) * 100) / 100;
  const sgkIv = Math.round(brut * 0.155 * 100) / 100;
  const issIv = Math.round(brut * 0.02 * 100) / 100;
  const isverenM = Math.round((brut + sgkIv + issIv) * 100) / 100;
  return { brut, sgkI, issI, topSgk, gvMat, gv, agi, netGV, damga, net, sgkIv, issIv, isverenM };
}

// ── Personeller ───────────────────────────────────────────────────────────────
export function renderPersoneller() {
  document.getElementById('ph-actions').innerHTML =
    `<button class="btn btn-orange" onclick="window._openPersonelModal()">PERSONEL EKLE</button>`;
  document.getElementById('filter-bar').style.display = 'none';
  document.getElementById('page-body').innerHTML = `
    <div class="stabs anim">
      <button class="stab active" onclick="window._switchStabP(0)">Personel Listesi</button>
      <button class="stab" onclick="window._switchStabP(1)">Maaş Ödemeleri</button>
      <button class="stab" onclick="window._switchStabP(2)">Bordro Arşivi</button>
    </div>
    <div id="stab-p-0">${buildPersonelListesi()}</div>
    <div id="stab-p-1" style="display:none">${buildMaasOdemeleri()}</div>
    <div id="stab-p-2" style="display:none">${buildBordroArsivi()}</div>`;

  window._switchStabP = (idx) => {
    document.querySelectorAll('.stab').forEach((b, i) => b.classList.toggle('active', i === idx));
    [0, 1, 2].forEach(i => {
      const el = document.getElementById(`stab-p-${i}`);
      if (el) el.style.display = i === idx ? 'block' : 'none';
    });
  };
}

function buildPersonelListesi() {
  if (!S.personeller.length)
    return `<div style="text-align:center;padding:80px;color:var(--t3)"><div style="font-size:14px;font-weight:700;margin-bottom:10px;color:var(--t1)">BOŞ</div>Henüz personel eklenmemiş<br><button class="btn btn-orange btn-sm" onclick="window._openPersonelModal()" style="margin-top:14px">İLK PERSONELİ EKLE</button></div>`;
  return `<div class="card"><div class="tbl-wrap"><table>
    <thead><tr><th>Personel</th><th>Pozisyon</th><th>Departman</th><th>İşe Giriş</th><th class="tr">Brüt Maaş</th><th class="tr">Net Maaş</th><th>Durum</th><th></th></tr></thead>
    <tbody>${S.personeller.map(p => {
      const h = hesaplaMaas(p.brutMaas, p.medeni, p.cocuk, p.es);
      const durumCls = { aktif: 'pb-aktif', pasif: 'pb-pasif', izinli: 'pb-izinli' };
      const durumLbl = { aktif: 'Aktif', pasif: 'Pasif', izinli: 'İzinli' };
      const init = (p.ad[0] || '') + (p.soyad[0] || '');
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:10px">
          <div class="pers-av" style="background:${hashColor(p.id)}">${init}</div>
          <div><div style="font-weight:600">${p.ad} ${p.soyad}</div><div style="font-size:11.5px;color:var(--t3)">${p.tc ? p.tc.slice(0,3)+'****'+p.tc.slice(-4) : ''}</div></div>
        </div></td>
        <td style="font-size:13px">${p.pozisyon}</td>
        <td><span class="badge bg-blue">${p.departman}</span></td>
        <td style="font-size:12px;color:var(--t3)">${DT(p.iseGiris)}</td>
        <td class="tr mono" style="font-weight:600">${TL(p.brutMaas)}</td>
        <td class="tr mono" style="font-weight:700;color:var(--green)">${TL(h.net)}</td>
        <td><span class="badge ${durumCls[p.durumu] || 'pb-aktif'}">${durumLbl[p.durumu] || 'Aktif'}</span></td>
        <td style="white-space:nowrap">
          <button class="btn btn-light btn-xs" onclick="window._openPersonelModal('${p.id}')" style="margin-right:4px">Düzenle</button>
          <button class="btn btn-orange btn-xs" onclick="window._ekleAylikBordro('${p.id}')" style="margin-right:4px">Bordro Ekle</button>
          <button class="btn btn-danger-soft btn-xs" onclick="window._delPersonel('${p.id}')">Sil</button>
        </td>
      </tr>`;
    }).join('')}</tbody></table></div></div>`;
}

function buildMaasOdemeleri() {
  const now = new Date();
  const aylar = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    aylar.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  if (!S.personeller.length)
    return `<div style="text-align:center;padding:40px;color:var(--t3)">Personel bulunmuyor</div>`;
  return `<div class="card"><div class="tbl-wrap"><table>
    <thead><tr><th>Personel</th><th>Brüt Maaş</th><th>Net Maaş</th>${aylar.map(a =>
      `<th class="tc">${MS[parseInt(a.split('-')[1]) - 1]} ${a.split('-')[0]}</th>`
    ).join('')}<th></th></tr></thead>
    <tbody>${S.personeller.map(p => {
      const h = hesaplaMaas(p.brutMaas, p.medeni, p.cocuk, p.es);
      return `<tr>
        <td style="font-weight:600">${p.ad} ${p.soyad}</td>
        <td class="mono">${TL(p.brutMaas)}</td>
        <td class="mono" style="color:var(--green)">${TL(h.net)}</td>
        ${aylar.map(ay => {
          const m = p.maaslar.find(x => x.ay === ay);
          if (!m) return `<td class="tc"><span style="font-size:11px;color:var(--t3)">—</span></td>`;
          return `<td class="tc"><button class="odm-chip ${m.odendi ? 'odm-ok' : 'odm-bek'}" onclick="window._toggleOdeme('${p.id}','${ay}')">${m.odendi ? 'Ödendi' : 'Bekliyor'}</button></td>`;
        }).join('')}
        <td style="white-space:nowrap"><button class="btn btn-light btn-xs" onclick="window._viewBordro('${p.id}','${aylar[aylar.length - 1]}')">Bordro</button></td>
      </tr>`;
    }).join('')}</tbody></table></div></div>`;
}

function buildBordroArsivi() {
  const tum = S.personeller.flatMap(p => p.maaslar.map(m => ({ ...m, p })));
  if (!tum.length)
    return `<div style="text-align:center;padding:80px;color:var(--t3)"><div style="font-size:14px;font-weight:700;margin-bottom:10px;color:var(--t1)">BOŞ</div>Henüz bordro oluşturulmamış<br><div style="font-size:12px;margin-top:8px">Personel listesinden "Bordro Ekle" ile başlayın</div></div>`;
  tum.sort((a, b) => b.ay.localeCompare(a.ay));
  return `<div class="card"><div class="tbl-wrap"><table>
    <thead><tr><th>Dönem</th><th>Personel</th><th>Pozisyon</th><th class="tr">Brüt</th><th class="tr">Kesintiler</th><th class="tr">Net</th><th>Durum</th><th></th></tr></thead>
    <tbody>${tum.map(x => {
      const p = x.p;
      const kes = x.brutMaas - x.netMaas;
      return `<tr>
        <td style="font-weight:600">${MS[parseInt(x.ay.split('-')[1]) - 1]} ${x.ay.split('-')[0]}</td>
        <td>${p.ad} ${p.soyad}</td>
        <td style="font-size:12.5px;color:var(--t2)">${p.pozisyon}</td>
        <td class="tr mono">${TL(x.brutMaas)}</td>
        <td class="tr mono" style="color:var(--red)">−${TL(kes)}</td>
        <td class="tr mono" style="font-weight:700;color:var(--green)">${TL(x.netMaas)}</td>
        <td><span class="badge ${x.odendi ? 'bg-green' : 'bg-amber'}">${x.odendi ? 'Ödendi' : 'Bekliyor'}</span></td>
        <td><button class="btn btn-light btn-xs" onclick="window._viewBordro('${p.id}','${x.ay}')">Görüntüle</button></td>
      </tr>`;
    }).join('')}</tbody></table></div></div>`;
}

// ── Bordro Görüntüle ──────────────────────────────────────────────────────────
window._viewBordro = function(pid, ay) {
  const p = S.personeller.find(x => x.id === pid); if (!p) return;
  const m = p.maaslar.find(x => x.ay === ay);
  const brut = m ? m.brutMaas : p.brutMaas;
  const hh = m
    ? { brut: m.brutMaas, sgkI: m.sgkI, issI: m.issI, topSgk: m.sgkI + m.issI, gvMat: m.gvMat, gv: m.gv, agi: m.agi, netGV: m.netGV, damga: m.damga, net: m.netMaas, sgkIv: Math.round(brut * 0.155 * 100) / 100, issIv: Math.round(brut * 0.02 * 100) / 100, isverenM: m.isverenM }
    : hesaplaMaas(p.brutMaas, p.medeni, p.cocuk, p.es);
  const sirket = S.settings?.sirket || {};
  const ayLabel = MS[parseInt(ay.split('-')[1]) - 1] + ' ' + ay.split('-')[0];
  document.getElementById('ph-actions').innerHTML = `<button class="btn btn-ghost btn-sm no-print" onclick="window._goBackPersonel()">← Geri</button><button class="btn btn-orange no-print" onclick="window.print()">🖨️ Yazdır</button>`;
  document.getElementById('ph-title').textContent = 'Maaş Bordrosu';
  document.getElementById('ph-sub').textContent = `${p.ad} ${p.soyad} — ${ayLabel}`;
  document.getElementById('filter-bar').style.display = 'none';
  document.getElementById('page-body').innerHTML = `<div style="max-width:760px;margin:0 auto">
  <div class="bordro-page anim">
    <div class="bordro-hdr">
      <div>
        ${sirket.logo ? `<img src="${sirket.logo}" style="max-height:50px;max-width:160px;object-fit:contain;margin-bottom:8px;display:block">` : `<div style="font-size:18px;font-weight:800;color:var(--t1)">${sirket.ad || 'Şirket Adı A.Ş.'}</div>`}
        <div style="font-size:12px;color:var(--t3)">${sirket.adres || ''} ${sirket.il ? '· ' + sirket.il : ''}</div>
        <div style="font-size:12px;color:var(--t3)">VKN: ${sirket.vkn || '—'} · ${sirket.tel || ''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.8px">MAAŞ BORDROUSU</div>
        <div style="font-size:20px;font-weight:800;margin-top:4px;color:var(--t1)">${ayLabel}</div>
        ${m ? `<span class="badge ${m.odendi ? 'bg-green' : 'bg-amber'}" style="margin-top:6px">${m.odendi ? 'Ödendi' : 'Bekliyor'}</span>` : ''}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;padding:16px;background:var(--bg);border-radius:var(--r)">
      <div>
        <div class="bordro-section" style="margin-top:0">Personel Bilgileri</div>
        <div style="font-size:14px;font-weight:700">${p.ad} ${p.soyad}</div>
        <div style="font-size:12px;color:var(--t2);margin-top:4px">${p.pozisyon} · ${p.departman}</div>
        <div style="font-size:12px;color:var(--t3);margin-top:2px">TC: ${p.tc || '—'}</div>
        <div style="font-size:12px;color:var(--t3)">İşe Giriş: ${DT(p.iseGiris)}</div>
      </div>
      <div>
        <div class="bordro-section" style="margin-top:0">Aile Bilgileri</div>
        <div style="font-size:12px;color:var(--t2)">Medeni Durum: <b>${p.medeni === 'evli' ? 'Evli' : 'Bekar'}</b></div>
        <div style="font-size:12px;color:var(--t2)">Çocuk Sayısı: <b>${p.cocuk}</b></div>
        <div style="font-size:12px;color:var(--t2)">Eş Çalışıyor: <b>${p.es ? 'Evet' : 'Hayır'}</b></div>
      </div>
    </div>
    <div class="bordro-section">Kazançlar</div>
    <div class="bordro-row"><span class="bl">Brüt Maaş</span><span class="bv">${TL(hh.brut)}</span></div>
    <div class="bordro-section">Kesintiler</div>
    <div class="bordro-row kesinti"><span class="bl">SGK İşçi Payı (%14)</span><span class="bv">−${TL(hh.sgkI)}</span></div>
    <div class="bordro-row kesinti"><span class="bl">İşsizlik Sigortası İşçi (%1)</span><span class="bv">−${TL(hh.issI)}</span></div>
    <div class="bordro-row" style="background:var(--border2)"><span class="bl" style="font-weight:600">Toplam SGK Kesintisi</span><span class="bv" style="color:var(--red)">−${TL(hh.topSgk)}</span></div>
    <div class="bordro-row"><span class="bl">GV Matrahı</span><span class="bv">${TL(hh.gvMat)}</span></div>
    <div class="bordro-row kesinti"><span class="bl">Hesaplanan Gelir Vergisi</span><span class="bv">−${TL(hh.gv)}</span></div>
    <div class="bordro-row plus"><span class="bl">Asgari Geçim İndirimi (AGİ)</span><span class="bv">+${TL(hh.agi)}</span></div>
    <div class="bordro-row kesinti"><span class="bl">Net Gelir Vergisi</span><span class="bv">−${TL(hh.netGV)}</span></div>
    <div class="bordro-row kesinti"><span class="bl">Damga Vergisi (%0.759)</span><span class="bv">−${TL(hh.damga)}</span></div>
    <div class="bordro-row net-final"><span class="bl">NET ÖDENECEK MAAŞ</span><span class="bv">${TL(hh.net)}</span></div>
    <div class="bordro-section">İşveren Maliyeti (Bilgi)</div>
    <div class="bordro-row"><span class="bl">SGK İşveren Payı (%15.5)</span><span class="bv">${TL(hh.sgkIv)}</span></div>
    <div class="bordro-row"><span class="bl">İşsizlik Sigortası İşveren (%2)</span><span class="bv">${TL(hh.issIv)}</span></div>
    <div class="bordro-row" style="background:var(--blue-50)"><span class="bl" style="font-weight:700;color:var(--blue)">Toplam İşveren Maliyeti</span><span class="bv" style="font-size:15px;color:var(--blue)">${TL(hh.isverenM)}</span></div>
    <div class="sign-row">
      <div class="sign-box">İşveren / Yetkili<br><br><br>${sirket.ad || ''}</div>
      <div class="sign-box">Personel İmzası<br><br><br>${p.ad} ${p.soyad}</div>
    </div>
    <div style="text-align:center;font-size:10.5px;color:var(--t3);margin-top:16px">Bu bordro Findie sistemi tarafından oluşturulmuştur · ${new Date().toLocaleDateString('tr-TR')}</div>
  </div></div>`;
};
window._goBackPersonel = () => renderPersoneller();

// ── Aylık Bordro Ekle ─────────────────────────────────────────────────────────
window._ekleAylikBordro = function(pid) {
  const p = S.personeller.find(x => x.id === pid); if (!p) return;
  const h = hesaplaMaas(p.brutMaas, p.medeni, p.cocuk, p.es);
  const now = new Date();
  const ay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (p.maaslar.find(m => m.ay === ay)) { toast('Bu ay için bordro zaten mevcut', 'warn'); return; }
  showModal(`<div class="modal-hdr"><div class="modal-title">Aylık Bordro Ekle — ${p.ad} ${p.soyad}</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div style="background:var(--bg);border-radius:var(--r);padding:14px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px">Dönem</div><div style="font-weight:700;font-size:15px;margin-top:3px">${MS[now.getMonth()]} ${now.getFullYear()}</div></div>
      <div style="text-align:right"><div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px">Net Maaş</div><div style="font-weight:700;font-size:18px;color:var(--green);margin-top:3px">${TL(h.net)}</div></div>
    </div>
    <div class="mh-section">
      <div class="mh-title">Maaş Özeti</div>
      <div class="mh-row"><span class="mh-label">Brüt Maaş</span><span class="mh-val">${TL(h.brut)}</span></div>
      <div class="mh-row kesinti"><span class="mh-label">SGK İşçi + İşsizlik</span><span class="mh-val">−${TL(h.topSgk)}</span></div>
      <div class="mh-row kesinti"><span class="mh-label">Net Gelir Vergisi</span><span class="mh-val">−${TL(h.netGV)}</span></div>
      <div class="mh-row kesinti"><span class="mh-label">Damga Vergisi</span><span class="mh-val">−${TL(h.damga)}</span></div>
      <div class="mh-row net-row"><span class="mh-label">NET MAAŞ</span><span class="mh-val">${TL(h.net)}</span></div>
    </div>
    <div class="form-grid c2">
      <div class="fg"><label>Ödeme Durumu</label><select id="b-odendi"><option value="false">Bekliyor</option><option value="true">Ödendi</option></select></div>
      <div class="fg"><label>Ödeme Tarihi</label><input type="date" id="b-tarih" value="${TODAY()}"></div>
    </div>
  </div>
  <div class="modal-ftr"><button class="btn btn-ghost" onclick="window.closeModal()">İptal</button><button class="btn btn-orange" onclick="window._saveBordro('${pid}','${ay}')">Bordroyu Kaydet</button></div>`);
};

window._saveBordro = function(pid, ay) {
  const p = S.personeller.find(x => x.id === pid); if (!p) return;
  const odendi = document.getElementById('b-odendi').value === 'true';
  const tarih = document.getElementById('b-tarih').value;
  const hh = hesaplaMaas(p.brutMaas, p.medeni, p.cocuk, p.es);
  p.maaslar.push({ id: uid(), ay, brutMaas: hh.brut, sgkI: hh.sgkI, issI: hh.issI, gvMat: hh.gvMat, gv: hh.gv, agi: hh.agi, netGV: hh.netGV, damga: hh.damga, netMaas: hh.net, isverenM: hh.isverenM, odendi, odemeTarihi: odendi ? tarih : null });
  S.giderler.push({ id: uid(), tarih: tarih || TODAY(), kategori: 'Personel Gideri', aciklama: `${p.ad} ${p.soyad} — ${MS[parseInt(ay.split('-')[1]) - 1]} ${ay.split('-')[0]} Maaşı`, tedarikci: `${p.ad} ${p.soyad}`, tutar: hh.net, kdvOrani: 0, kdvTutar: 0, toplamTutar: hh.net, durum: odendi ? 'odendi' : 'bekliyor', belgeNo: `BRD-${Date.now()}` });
  saveStore(); closeModal(); renderPersoneller(); toast(`Bordro kaydedildi${odendi ? ' ve maaş ödendi' : ''}`);
};

window._toggleOdeme = function(pid, ay) {
  const p = S.personeller.find(x => x.id === pid); if (!p) return;
  const m = p.maaslar.find(x => x.ay === ay); if (!m) return;
  m.odendi = !m.odendi; if (m.odendi) m.odemeTarihi = TODAY();
  saveStore();
  const d = document.getElementById('stab-p-1'); if (d) d.innerHTML = buildMaasOdemeleri();
  toast(m.odendi ? 'Ödeme işaretlendi' : 'Ödeme geri alındı');
};

// ── Personel Modal ────────────────────────────────────────────────────────────
window._openPersonelModal = function(id) {
  const p = id ? S.personeller.find(x => x.id === id) : null;
  const depts = ['Teknoloji', 'Tasarım', 'Pazarlama', 'İnsan Kaynakları', 'Muhasebe', 'Operasyon', 'Satış', 'Hukuk', 'Diğer'];
  showModal(`<div class="modal-hdr"><div class="modal-title">Personel ${p ? 'Düzenle' : 'Ekle'}</div><button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="form-grid c2">
      <div class="fg"><label>Ad *</label><input type="text" id="p-ad" value="${p?.ad || ''}" placeholder="Ad"></div>
      <div class="fg"><label>Soyad *</label><input type="text" id="p-soyad" value="${p?.soyad || ''}" placeholder="Soyad"></div>
      <div class="fg"><label>T.C. Kimlik No</label><input type="text" id="p-tc" value="${p?.tc || ''}" placeholder="12345678901" maxlength="11"></div>
      <div class="fg"><label>İşe Giriş Tarihi</label><input type="date" id="p-giris" value="${p?.iseGiris || TODAY()}"></div>
      <div class="fg"><label>Pozisyon *</label><input type="text" id="p-poz" value="${p?.pozisyon || ''}" placeholder="ör: Yazılım Geliştirici"></div>
      <div class="fg"><label>Departman</label><select id="p-dept">${depts.map(d => `<option ${p?.departman === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
      <div class="fg"><label>Brüt Maaş (₺) *</label><input type="number" id="p-brut" value="${p?.brutMaas || ''}" min="0" step="100" oninput="window._previewNet()" placeholder="22104"></div>
      <div class="fg"><label>Durum</label><select id="p-dur"><option value="aktif" ${!p || p.durumu === 'aktif' ? 'selected' : ''}>Aktif</option><option value="izinli" ${p?.durumu === 'izinli' ? 'selected' : ''}>İzinli</option><option value="pasif" ${p?.durumu === 'pasif' ? 'selected' : ''}>Pasif</option></select></div>
    </div>
    <hr class="hdivider">
    <div style="font-size:12px;font-weight:700;color:var(--t2);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">AGİ Hesabı İçin</div>
    <div class="form-grid c3">
      <div class="fg"><label>Medeni Durum</label><select id="p-med" onchange="window._previewNet()"><option value="bekar" ${!p || p.medeni === 'bekar' ? 'selected' : ''}>Bekar</option><option value="evli" ${p?.medeni === 'evli' ? 'selected' : ''}>Evli</option></select></div>
      <div class="fg"><label>Çocuk Sayısı</label><select id="p-cocuk" onchange="window._previewNet()">${[0,1,2,3,4].map(n => `<option value="${n}" ${(p?.cocuk||0)===n?'selected':''}>${n}</option>`).join('')}</select></div>
      <div class="fg"><label>Eş Çalışıyor</label><select id="p-es" onchange="window._previewNet()"><option value="false" ${!p?.es?'selected':''}>Hayır</option><option value="true" ${p?.es?'selected':''}>Evet</option></select></div>
    </div>
    <div id="p-net-prev" style="background:var(--green-50);border-radius:8px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;margin-top:4px">
      <span style="font-size:12.5px;font-weight:600;color:var(--green)">Tahmini Net Maaş</span>
      <span style="font-size:16px;font-weight:700;color:var(--green)" id="p-net-val">—</span>
    </div>
    <div class="fg" style="margin-top:12px"><label>Not</label><textarea id="p-not" rows="2" placeholder="Ek bilgiler…">${p?.notlar || ''}</textarea></div>
  </div>
  <div class="modal-ftr"><button class="btn btn-ghost" onclick="window.closeModal()">İptal</button><button class="btn btn-orange" onclick="window._savePersonel('${id || ''}')">Kaydet</button></div>`);
  window._previewNet();
};

window._previewNet = function() {
  const brut = parseFloat(document.getElementById('p-brut')?.value) || 0;
  const med = document.getElementById('p-med')?.value || 'bekar';
  const cocuk = parseInt(document.getElementById('p-cocuk')?.value) || 0;
  const es = document.getElementById('p-es')?.value === 'true';
  const el = document.getElementById('p-net-val');
  if (el && brut > 0) { const h = hesaplaMaas(brut, med, cocuk, es); el.textContent = TL(h.net); }
};

window._savePersonel = function(id) {
  const ad = document.getElementById('p-ad').value.trim();
  const soyad = document.getElementById('p-soyad').value.trim();
  const brut = parseFloat(document.getElementById('p-brut').value) || 0;
  if (!ad || !soyad) { toast('Ad ve soyad gerekli', 'warn'); return; }
  if (!brut) { toast('Brüt maaş giriniz', 'warn'); return; }
  const rec = { id: id || uid(), ad, soyad, tc: document.getElementById('p-tc').value.trim(), pozisyon: document.getElementById('p-poz').value.trim() || 'Personel', departman: document.getElementById('p-dept').value, iseGiris: document.getElementById('p-giris').value, brutMaas: brut, medeni: document.getElementById('p-med').value, cocuk: parseInt(document.getElementById('p-cocuk').value) || 0, es: document.getElementById('p-es').value === 'true', durumu: document.getElementById('p-dur').value, maaslar: id ? S.personeller.find(x => x.id === id).maaslar : [], notlar: document.getElementById('p-not').value };
  if (id) { const i = S.personeller.findIndex(x => x.id === id); S.personeller[i] = rec; } else S.personeller.push(rec);
  saveStore(); closeModal(); renderPersoneller(); toast('Personel kaydedildi <svg class="lucide lucide-check inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>');
};

window._delPersonel = function(id) {
  confirmDlg('Personel silinecek', 'Bordro geçmişi de silinecek. Emin misiniz?', 'danger', () => {
    S.personeller = S.personeller.filter(p => p.id !== id); saveStore(); renderPersoneller(); toast('Silindi', 'warn');
  });
};

// ── Maaş Hesaplama Aracı ──────────────────────────────────────────────────────
export function renderMaasHesap() {
  document.getElementById('ph-actions').innerHTML = '';
  document.getElementById('filter-bar').style.display = 'none';
  document.getElementById('page-body').innerHTML = `
  <div style="display:grid;grid-template-columns:340px 1fr;gap:16px;align-items:start">
    <div class="card cp">
      <div class="ct">Hesaplama Parametreleri</div>
      <div class="fg" style="margin-bottom:12px">
        <label>Brüt Maaş (₺) *</label>
        <input type="number" id="mh-brut" value="30000" min="0" step="100" oninput="window._calcMaasHesap()" style="font-size:18px;font-weight:700;padding:12px 14px">
      </div>
      <div class="form-grid c2" style="margin-bottom:10px">
        <div class="fg"><label>Medeni Durum</label><select id="mh-med" onchange="window._calcMaasHesap()"><option value="bekar">Bekar</option><option value="evli">Evli</option></select></div>
        <div class="fg"><label>Çocuk Sayısı</label><select id="mh-cocuk" onchange="window._calcMaasHesap()">${[0,1,2,3,4].map(n=>`<option value="${n}">${n}</option>`).join('')}</select></div>
      </div>
      <div class="fg" style="margin-bottom:16px"><label>Eş Çalışıyor mu?</label><select id="mh-es" onchange="window._calcMaasHesap()"><option value="false">Hayır</option><option value="true">Evet</option></select></div>
      <div style="background:var(--bg);border-radius:8px;padding:12px;font-size:11.5px;color:var(--t3);line-height:1.7">
        <b style="color:var(--t2)">2025 Parametreleri</b><br>
        • SGK İşçi: %14 · İşsizlik: %1<br>
        • SGK İşveren: %15.5 · İşsizlik: %2<br>
        • Damga Vergisi: %0.759<br>
        • Asgari Ücret: ${TL(ASG_UCRET)}<br>
        • GV Dilimleri: %15 / %20 / %27 / %35 / %40
      </div>
      <div style="margin-top:14px">
        <select id="mh-personel" style="width:100%;padding:8px 10px;font-size:12.5px;border-radius:8px;margin-bottom:8px"><option value="">— Personele Bordro Olarak Ekle —</option>${S.personeller.map(p=>`<option value="${p.id}">${p.ad} ${p.soyad}</option>`).join('')}</select>
        <button class="btn btn-orange" style="width:100%" onclick="window._maasToPersonel()">Personele Bordro Ekle</button>
      </div>
    </div>
    <div id="mh-result"></div>
  </div>`;
  window._calcMaasHesap();
}

window._calcMaasHesap = function() {
  const brut = parseFloat(document.getElementById('mh-brut')?.value) || 0;
  const med = document.getElementById('mh-med')?.value || 'bekar';
  const cocuk = parseInt(document.getElementById('mh-cocuk')?.value) || 0;
  const es = document.getElementById('mh-es')?.value === 'true';
  if (!brut) { document.getElementById('mh-result').innerHTML = `<div style="padding:40px;text-align:center;color:var(--t3)">Brüt maaş giriniz</div>`; return; }
  const h = hesaplaMaas(brut, med, cocuk, es);
  const effRate = brut > 0 ? Math.round((brut - h.net) / brut * 1000) / 10 : 0;
  const gvDilim = brut*12<=158000?'%15':brut*12<=330000?'%20':brut*12<=800000?'%27':brut*12<=4300000?'%35':'%40';
  document.getElementById('mh-result').innerHTML = `
  <div style="display:flex;flex-direction:column;gap:12px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="card cp" style="background:var(--green-50);border-color:rgba(5,150,105,.2)">
        <div style="font-size:11px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">Net Maaş</div>
        <div style="font-size:28px;font-weight:800;color:var(--green);letter-spacing:-.8px">${TL(h.net)}</div>
        <div style="font-size:12px;color:var(--green);margin-top:5px">Efektif kesinti: %${effRate}</div>
      </div>
      <div class="card cp" style="background:var(--blue-50);border-color:rgba(37,99,235,.2)">
        <div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">İşveren Toplam Maliyeti</div>
        <div style="font-size:28px;font-weight:800;color:var(--blue);letter-spacing:-.8px">${TL(h.isverenM)}</div>
        <div style="font-size:12px;color:var(--blue);margin-top:5px">SGK+İşsizlik işveren: ${TL(h.sgkIv+h.issIv)}</div>
      </div>
    </div>
    <div class="card cp">
      <div class="ct">Detaylı Hesaplama</div>
      <div class="mh-section" style="margin-bottom:8px">
        <div class="mh-title">Kazançlar</div>
        <div class="mh-row"><span class="mh-label">Brüt Maaş</span><span class="mh-val">${TL(h.brut)}</span></div>
      </div>
      <div class="mh-section" style="margin-bottom:8px">
        <div class="mh-title">SGK Kesintileri (İşçi)</div>
        <div class="mh-row kesinti"><span class="mh-label">SGK İşçi Payı (%14)</span><span class="mh-val">−${TL(h.sgkI)}</span></div>
        <div class="mh-row kesinti"><span class="mh-label">İşsizlik Sigortası İşçi (%1)</span><span class="mh-val">−${TL(h.issI)}</span></div>
        <div class="mh-row" style="background:rgba(220,38,38,.05)"><span class="mh-label" style="font-weight:600">Toplam SGK Kesintisi</span><span class="mh-val" style="color:var(--red)">−${TL(h.topSgk)}</span></div>
      </div>
      <div class="mh-section" style="margin-bottom:8px">
        <div class="mh-title">Gelir Vergisi (Dilim: ${gvDilim})</div>
        <div class="mh-row"><span class="mh-label">Gelir Vergisi Matrahı</span><span class="mh-val">${TL(h.gvMat)}</span></div>
        <div class="mh-row kesinti"><span class="mh-label">Hesaplanan Gelir Vergisi</span><span class="mh-val">−${TL(h.gv)}</span></div>
        <div class="mh-row plus"><span class="mh-label">Asgari Geçim İndirimi (AGİ)</span><span class="mh-val">+${TL(h.agi)}</span></div>
        <div class="mh-row kesinti"><span class="mh-label" style="font-weight:600">Net Gelir Vergisi</span><span class="mh-val">−${TL(h.netGV)}</span></div>
      </div>
      <div class="mh-section" style="margin-bottom:8px">
        <div class="mh-title">Diğer Kesintiler</div>
        <div class="mh-row kesinti"><span class="mh-label">Damga Vergisi (%0.759)</span><span class="mh-val">−${TL(h.damga)}</span></div>
      </div>
      <div class="mh-row net-row"><span class="mh-label">NET MAAŞ</span><span class="mh-val">${TL(h.net)}</span></div>
      <div class="mh-row isveren-row" style="margin-top:8px"><span class="mh-label">TOPLAM İŞVEREN MALİYETİ</span><span class="mh-val">${TL(h.isverenM)}</span></div>
    </div>
  </div>`;
};

window._maasToPersonel = function() {
  const pid = document.getElementById('mh-personel')?.value;
  if (!pid) { toast('Personel seçiniz', 'warn'); return; }
  window._ekleAylikBordro(pid);
};
