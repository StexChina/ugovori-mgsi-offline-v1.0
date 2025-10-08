// Ugovori MGSI — v1.0 (offline)
/* Features:
 - Login (offline)
 - Light/Dark theme toggle
 - SR/EN language toggle
 - Cyrillic/Latin script choice for export (placeholder)
 - CRUD for Ugovori / Sporazumi / Narudžbenice / Fakture
 - Soft delete to Archive (restore / permanent)
 - Activity Log with export/clear
 - Export/Import all data (JSON)
*/

// ------- State & Storage -------
const STORAGE_KEYS = {
  theme: "umgsi_theme",
  lang: "umgsi_lang",
  script: "umgsi_script",
  user: "umgsi_user",
  ugovori: "umgsi_ugovori",
  sporazumi: "umgsi_sporazumi",
  narudzbenice: "umgsi_narudzbenice",
  fakture: "umgsi_fakture",
  archive: "umgsi_archive",
  logs: "umgsi_logs",
  templates: "umgsi_templates"
};

const DEFAULT_USER = { username: "stefan", password: "mgsi123", role: "admin" };

let state = {
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light",
  lang: localStorage.getItem(STORAGE_KEYS.lang) || "sr",
  script: localStorage.getItem(STORAGE_KEYS.script) || "cyr",
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || "null"),
  ugovori: JSON.parse(localStorage.getItem(STORAGE_KEYS.ugovori) || "[]"),
  sporazumi: JSON.parse(localStorage.getItem(STORAGE_KEYS.sporazumi) || "[]"),
  narudzbenice: JSON.parse(localStorage.getItem(STORAGE_KEYS.narudzbenice) || "[]"),
  fakture: JSON.parse(localStorage.getItem(STORAGE_KEYS.fakture) || "[]"),
  archive: JSON.parse(localStorage.getItem(STORAGE_KEYS.archive) || "[]"),
  logs: JSON.parse(localStorage.getItem(STORAGE_KEYS.logs) || "[]"),
  templates: JSON.parse(localStorage.getItem(STORAGE_KEYS.templates) || "{}")
};

function save(key){ localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(state[key])); }
function setTheme(t){ state.theme = t; localStorage.setItem(STORAGE_KEYS.theme, t); document.documentElement.classList.toggle('dark', t === 'dark'); }
setTheme(state.theme);

// ------- I18N -------
const i18n = {
  sr: {
    loginTitle: "Ugovori MGSI",
    loginSubtitle: "Prijavite se za pristup",
    username: "Korisničko ime",
    password: "Lozinka",
    signIn: "Prijavi se",
    addContract: "Dodaj ugovor",
    edit: "Izmeni",
    delete: "Obriši",
    restore: "Vrati",
    removeForever: "Trajno obriši",
    confirmDeleteTitle: "Potvrda brisanja",
    confirmDeleteMsg: "Da li ste sigurni? Stavka će biti premeštena u arhivu.",
    yesArchive: "Da, u Arhivu",
    cancel: "Odustani",
    saveChanges: "Sačuvaj",
    create: "Kreiraj",
  },
  en: {
    loginTitle: "MGSI Contracts",
    loginSubtitle: "Sign in to continue",
    username: "Username",
    password: "Password",
    signIn: "Sign in",
    addContract: "Add Contract",
    edit: "Edit",
    delete: "Delete",
    restore: "Restore",
    removeForever: "Delete Forever",
    confirmDeleteTitle: "Delete confirmation",
    confirmDeleteMsg: "Are you sure? The item will be moved to archive.",
    yesArchive: "Yes, to Archive",
    cancel: "Cancel",
    saveChanges: "Save",
    create: "Create",
  }
};

function t(k){ return (i18n[state.lang] && i18n[state.lang][k]) || i18n['sr'][k] || k; }

function applyLang(){
  document.querySelector('#login-screen h1').textContent = t('loginTitle');
  document.getElementById('loginSubtitle').textContent = t('loginSubtitle');
  document.getElementById('lblUsername').textContent = t('username');
  document.getElementById('lblPassword').textContent = t('password');
  document.getElementById('btnLogin').textContent = t('signIn');

  // Tabs and buttons can be static Serbian for v1.0; core CTA translated
  document.querySelectorAll('[data-i18n="addContract"]').forEach(n=>n.textContent = t('addContract'));
}
applyLang();

// ------- Login -------
document.getElementById('toggleThemeLogin').addEventListener('click', ()=> setTheme(state.theme === 'light' ? 'dark' : 'light'));
document.getElementById('toggleLangLogin').addEventListener('click', ()=> {
  state.lang = (state.lang === 'sr' ? 'en' : 'sr');
  localStorage.setItem(STORAGE_KEYS.lang, state.lang);
  applyLang();
});
document.getElementById('btnLogin').addEventListener('click', doLogin);
document.getElementById('password').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });

function doLogin(){
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  const ok = (u === DEFAULT_USER.username && p === DEFAULT_USER.password);
  if(ok){
    state.user = { username: u, role: DEFAULT_USER.role, loginAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user));
    addLog("Prijava", `Korisnik: ${u}`);
    document.getElementById('currentUser').textContent = u;
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('screen','active');
    renderAll();
  }else{
    alert("Pogrešni podaci. Pokušajte: stefan / mgsi123");
  }
}

document.getElementById('btnLogout').addEventListener('click', (e)=>{
  e.preventDefault();
  addLog("Odjava", `Korisnik: ${state.user?.username||'?'}`);
  localStorage.removeItem(STORAGE_KEYS.user);
  state.user = null;
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
});

// ------- Theme & Lang toggles in app -------
document.getElementById('toggleTheme').addEventListener('click', ()=> setTheme(state.theme === 'light' ? 'dark' : 'light'));
document.getElementById('toggleLang').addEventListener('click', ()=> {
  state.lang = (state.lang === 'sr' ? 'en' : 'sr');
  localStorage.setItem(STORAGE_KEYS.lang, state.lang);
  applyLang();
});

// ------- Tabs -------
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+id).classList.add('active');
    renderAll();
  });
});

// ------- Helpers -------
function currency(n){ return Number(n||0).toLocaleString('sr-RS'); }
function fmtDate(d){ if(!d) return ""; const dt = new Date(d); return dt.toLocaleDateString('sr-RS'); }
function daysLeft(end){
  if(!end) return null;
  const ms = (new Date(end).setHours(0,0,0,0) - new Date().setHours(0,0,0,0));
  return Math.ceil(ms/86400000);
}
function statusBadge(row){
  const dl = daysLeft(row.endDate);
  let cls = "ok", txt = "Aktivno";
  if(dl !== null && dl <= 30 && dl >= 0){ cls="warn"; txt=`Ističe (${dl} d)`; }
  if(dl !== null && dl < 0){ cls="danger"; txt="Isteklo"; }
  if(row.exhausted){ cls="danger"; txt="Iscrpljeno"; }
  return `<span class="badge ${cls}">${txt}</span>`;
}

function addLog(action, details){
  const entry = {
    time: new Date().toLocaleString('sr-RS'),
    user: state.user?.username || "anon",
    action, details
  };
  state.logs.push(entry); save('logs');
}

// ------- Modal -------
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalFooter = document.getElementById('modalFooter');
document.getElementById('modalClose').addEventListener('click', closeModal);
function openModal(title, bodyHTML, footerHTML){
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalFooter.innerHTML = footerHTML || "";
  modal.classList.remove('hidden');
}
function closeModal(){ modal.classList.add('hidden'); }

// ------- CRUD: Ugovori -------
document.getElementById('btnAddUgovor').addEventListener('click', ()=> openUgovorForm());
function openUgovorForm(item=null){
  const isEdit = !!item;
  const data = item || { id: crypto.randomUUID(), number:"", vendor:"", type:"Servisiranje vozila", method:"Po izvršenju usluge", value:0, spent:0, startDate:"", endDate:"", linkedFrameworkId:"", notes:"" };
  openModal(isEdit?"Izmena ugovora":"Novi ugovor", `
    <div class="grid">
      <div><label>Broj</label><input id="f_number" value="${data.number||""}"/></div>
      <div><label>Dobavljač</label><input id="f_vendor" value="${data.vendor||""}"/></div>
      <div><label>Tip</label>
        <select id="f_type">
          ${["Servisiranje vozila","Osiguranje vozila","Tehnički pregled vozila","Gume","Šlepanje vozila","Gorivo","Pranje vozila","Elektronska naplata putarine","Lizing - TDV Fleet","Lizing - AKS Fleet"].map(v=>`<option ${data.type===v?"selected":""}>${v}</option>`).join("")}
        </select>
      </div>
      <div><label>Metod plaćanja</label>
        <select id="f_method">
          ${["Mesečno","Po izvršenju usluge"].map(v=>`<option ${data.method===v?"selected":""}>${v}</option>`).join("")}
        </select>
      </div>
      <div><label>Ukupna vrednost (RSD)</label><input type="number" id="f_value" value="${data.value||0}"/></div>
      <div><label>Potrošeno (RSD)</label><input type="number" id="f_spent" value="${data.spent||0}"/></div>
      <div><label>Datum početka</label><input type="date" id="f_start" value="${data.startDate?data.startDate.substring(0,10):""}"/></div>
      <div><label>Datum isteka</label><input type="date" id="f_end" value="${data.endDate?data.endDate.substring(0,10):""}"/></div>
      <div><label>Povezan okvirni sporazum</label>
        <select id="f_framework">
          <option value="">—</option>
          ${state.sporazumi.map(s=>`<option value="${s.id}" ${data.linkedFrameworkId===s.id?"selected":""}>${s.number} — ${s.vendor}</option>`).join("")}
        </select>
      </div>
      <div style="flex-basis:100%"><label>Napomena</label><textarea id="f_notes">${data.notes||""}</textarea></div>
    </div>
  `, `
    <button class="btn" id="btnCancel">${t('cancel')}</button>
    <button class="btn primary" id="btnSave">${isEdit?t('saveChanges'):t('create')}</button>
  `);
  document.getElementById('btnCancel').onclick = closeModal;
  document.getElementById('btnSave').onclick = ()=>{
    const o = {
      ...data,
      number: document.getElementById('f_number').value.trim(),
      vendor: document.getElementById('f_vendor').value.trim(),
      type: document.getElementById('f_type').value,
      method: document.getElementById('f_method').value,
      value: Number(document.getElementById('f_value').value||0),
      spent: Number(document.getElementById('f_spent').value||0),
      startDate: document.getElementById('f_start').value || "",
      endDate: document.getElementById('f_end').value || "",
      linkedFrameworkId: document.getElementById('f_framework').value || "",
      notes: document.getElementById('f_notes').value.trim()
    };
    const exists = state.ugovori.find(x=>x.id===o.id);
    if(exists){
      Object.assign(exists, o);
      addLog("Izmena ugovora", `#${o.number} — ${o.vendor}`);
    }else{
      state.ugovori.push(o);
      addLog("Novi ugovor", `#${o.number} — ${o.vendor}`);
    }
    save('ugovori'); closeModal(); renderUgovori();
  };
}

function renderUgovori(){
  const q = (document.getElementById('searchUgovori').value||"").toLowerCase();
  const tbody = document.querySelector('#tblUgovori tbody');
  tbody.innerHTML = "";
  state.ugovori
    .filter(r => !q || JSON.stringify(r).toLowerCase().includes(q))
    .forEach((r,i)=>{
      const remain = (r.value||0) - (r.spent||0);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${r.number||""}</td>
        <td>${r.vendor||""}</td>
        <td>${r.type||""}</td>
        <td>${r.method||""}</td>
        <td>${currency(r.value)}</td>
        <td>${currency(r.spent)}</td>
        <td>${currency(remain)}</td>
        <td>${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}</td>
        <td>${statusBadge(r)}</td>
        <td>
          <button class="btn" data-act="edit">✏️</button>
          <button class="btn danger" data-act="del">🗑️</button>
        </td>
      `;
      tr.querySelector('[data-act="edit"]').addEventListener('click', ()=> openUgovorForm(r));
      tr.querySelector('[data-act="del"]').addEventListener('click', ()=> confirmDelete('ugovor', r));
      tbody.appendChild(tr);
    });
}

// ------- CRUD: Sporazumi -------
document.getElementById('btnAddSporazum').addEventListener('click', ()=> openSporazumForm());
function openSporazumForm(item=null){
  const isEdit = !!item;
  const data = item || { id: crypto.randomUUID(), number:"", vendor:"", value:0, startDate:"", endDate:"", notes:"" };
  openModal(isEdit?"Izmena okvirnog sporazuma":"Novi okvirni sporazum", `
    <div class="grid">
      <div><label>Broj</label><input id="s_number" value="${data.number||""}"/></div>
      <div><label>Dobavljač</label><input id="s_vendor" value="${data.vendor||""}"/></div>
      <div><label>Ukupna vrednost</label><input type="number" id="s_value" value="${data.value||0}"/></div>
      <div><label>Datum početka</label><input type="date" id="s_start" value="${data.startDate?data.startDate.substring(0,10):""}"/></div>
      <div><label>Datum isteka</label><input type="date" id="s_end" value="${data.endDate?data.endDate.substring(0,10):""}"/></div>
      <div style="flex-basis:100%"><label>Napomena</label><textarea id="s_notes">${data.notes||""}</textarea></div>
    </div>
  `,`
    <button class="btn" id="btnCancel">${t('cancel')}</button>
    <button class="btn primary" id="btnSave">${isEdit?t('saveChanges'):t('create')}</button>
  `);
  document.getElementById('btnCancel').onclick = closeModal;
  document.getElementById('btnSave').onclick = ()=>{
    const o = {
      ...data,
      number: document.getElementById('s_number').value.trim(),
      vendor: document.getElementById('s_vendor').value.trim(),
      value: Number(document.getElementById('s_value').value||0),
      startDate: document.getElementById('s_start').value || "",
      endDate: document.getElementById('s_end').value || "",
      notes: document.getElementById('s_notes').value.trim()
    };
    const exists = state.sporazumi.find(x=>x.id===o.id);
    if(exists){ Object.assign(exists,o); addLog("Izmena okvirnog sporazuma", `#${o.number} — ${o.vendor}`); }
    else { state.sporazumi.push(o); addLog("Novi okvirni sporazum", `#${o.number} — ${o.vendor}`); }
    save('sporazumi'); closeModal(); renderSporazumi();
  };
}
function renderSporazumi(){
  const q = (document.getElementById('searchSporazumi').value||"").toLowerCase();
  const tbody = document.querySelector('#tblSporazumi tbody');
  tbody.innerHTML = "";
  state.sporazumi
    .filter(r => !q || JSON.stringify(r).toLowerCase().includes(q))
    .forEach((r,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td><td>${r.number||""}</td><td>${r.vendor||""}</td>
        <td>${currency(r.value)}</td>
        <td>${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}</td>
        <td>${statusBadge(r)}</td>
        <td>
          <button class="btn" data-act="edit">✏️</button>
          <button class="btn danger" data-act="del">🗑️</button>
        </td>`;
      tr.querySelector('[data-act="edit"]').addEventListener('click', ()=> openSporazumForm(r));
      tr.querySelector('[data-act="del"]').addEventListener('click', ()=> confirmDelete('sporazum', r));
      tbody.appendChild(tr);
    });
}

// ------- CRUD: Narudžbenice -------
document.getElementById('btnAddNarudzbenica').addEventListener('click', ()=> openNarudzbenicaForm());
function openNarudzbenicaForm(item=null){
  const isEdit = !!item;
  const data = item || { id: crypto.randomUUID(), number:"", contractId:"", amountVat:0, amountNoVat:0, date:new Date().toISOString().substring(0,10), notes:"", status:"Aktivna" };
  openModal(isEdit?"Izmena narudžbenice":"Nova narudžbenica", `
    <div class="grid">
      <div><label>Broj</label><input id="n_number" value="${data.number||""}"/></div>
      <div><label>Ugovor</label>
        <select id="n_contract">
          <option value="">—</option>
          ${state.ugovori.map(u=>`<option value="${u.id}" ${data.contractId===u.id?"selected":""}>${u.number} — ${u.vendor}</option>`).join("")}
        </select>
      </div>
      <div><label>Iznos sa PDV</label><input type="number" id="n_vat" value="${data.amountVat||0}"/></div>
      <div><label>Iznos bez PDV</label><input type="number" id="n_novat" value="${data.amountNoVat||0}"/></div>
      <div><label>Datum</label><input type="date" id="n_date" value="${data.date?data.date.substring(0,10):""}"/></div>
      <div><label>Status</label>
        <select id="n_status">${["Aktivna","Iskorišćena","Istekla"].map(v=>`<option ${data.status===v?"selected":""}>${v}</option>`)}</select>
      </div>
      <div style="flex-basis:100%"><label>Napomena</label><textarea id="n_notes">${data.notes||""}</textarea></div>
      <div class="notice">Limit: 1.200.000 RSD sa PDV (1.000.000 bez PDV). Sistem će upozoriti ako prekoračiš.</div>
    </div>
  `,`
    <button class="btn" id="btnCancel">${t('cancel')}</button>
    <button class="btn primary" id="btnSave">${isEdit?t('saveChanges'):t('create')}</button>
  `);
  document.getElementById('btnCancel').onclick = closeModal;
  document.getElementById('btnSave').onclick = ()=>{
    const o = {
      ...data,
      number: document.getElementById('n_number').value.trim(),
      contractId: document.getElementById('n_contract').value || "",
      amountVat: Number(document.getElementById('n_vat').value||0),
      amountNoVat: Number(document.getElementById('n_novat').value||0),
      date: document.getElementById('n_date').value || "",
      status: document.getElementById('n_status').value,
      notes: document.getElementById('n_notes').value.trim()
    };
    if(o.amountVat > 1200000 || o.amountNoVat > 1000000){
      alert("Prekoračenje limita narudžbenice!");
      return;
    }
    const exists = state.narudzbenice.find(x=>x.id===o.id);
    if(exists){ Object.assign(exists,o); addLog("Izmena narudžbenice", `#${o.number}`); }
    else {
      // simple 12-month rule check
      const sameContract = state.narudzbenice.filter(n=> n.contractId===o.contractId).sort((a,b)=> new Date(b.date)-new Date(a.date));
      if(sameContract.length){
        const last = new Date(sameContract[0].date);
        const now = new Date(o.date);
        const ms = now - last;
        const months = ms / (1000*60*60*24*30);
        if(months < 12){
          if(!confirm("Već postoji narudžbenica u poslednjih 12 meseci za ovaj ugovor. Da li ipak želite da nastavite?")) return;
        }
      }
      state.narudzbenice.push(o); addLog("Nova narudžbenica", `#${o.number}`);
    }
    save('narudzbenice'); closeModal(); renderNarudzbenice();
  };
}
function renderNarudzbenice(){
  const q = (document.getElementById('searchNarudzbenice').value||"").toLowerCase();
  const tbody = document.querySelector('#tblNarudzbenice tbody'); tbody.innerHTML = "";
  state.narudzbenice
    .filter(r=> !q || JSON.stringify(r).toLowerCase().includes(q))
    .forEach((r,i)=>{
      const ug = state.ugovori.find(u=>u.id===r.contractId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td><td>${r.number||""}</td><td>${ug? (ug.number+" — "+ug.vendor) : ""}</td>
        <td>${currency(r.amountVat)}</td><td>${currency(r.amountNoVat)}</td><td>${fmtDate(r.date)}</td>
        <td>${r.status}</td>
        <td>
          <button class="btn" data-act="edit">✏️</button>
          <button class="btn danger" data-act="del">🗑️</button>
        </td>`;
      tr.querySelector('[data-act="edit"]').addEventListener('click', ()=> openNarudzbenicaForm(r));
      tr.querySelector('[data-act="del"]').addEventListener('click', ()=> confirmDelete('narudzbenica', r));
      tbody.appendChild(tr);
    });
}

// ------- CRUD: Fakture (osnova) -------
document.getElementById('btnAddFaktura').addEventListener('click', ()=> openFakturaForm());
function openFakturaForm(item=null){
  const isEdit = !!item;
  const data = item || { id: crypto.randomUUID(), number:"", contractId:"", amount:0, date:new Date().toISOString().substring(0,10), status:"U pripremi", notes:"" };
  openModal(isEdit?"Izmena fakture":"Nova faktura", `
    <div class="grid">
      <div><label>Broj fakture</label><input id="fa_number" value="${data.number||""}"/></div>
      <div><label>Ugovor</label>
        <select id="fa_contract">
          <option value="">—</option>
          ${state.ugovori.map(u=>`<option value="${u.id}" ${data.contractId===u.id?"selected":""}>${u.number} — ${u.vendor}</option>`).join("")}
        </select>
      </div>
      <div><label>Iznos (RSD)</label><input type="number" id="fa_amount" value="${data.amount||0}"/></div>
      <div><label>Datum</label><input type="date" id="fa_date" value="${data.date?data.date.substring(0,10):""}"/></div>
      <div><label>Status</label>
        <select id="fa_status">${["U pripremi","Na odobrenju","Plaćeno"].map(v=>`<option ${data.status===v?"selected":""}>${v}</option>`)}</select>
      </div>
      <div style="flex-basis:100%"><label>Napomena</label><textarea id="fa_notes">${data.notes||""}</textarea></div>
    </div>
  `,`
    <button class="btn" id="btnCancel">${t('cancel')}</button>
    <button class="btn primary" id="btnSave">${isEdit?t('saveChanges'):t('create')}</button>
  `);
  document.getElementById('btnCancel').onclick = closeModal;
  document.getElementById('btnSave').onclick = ()=>{
    const o = {
      ...data,
      number: document.getElementById('fa_number').value.trim(),
      contractId: document.getElementById('fa_contract').value || "",
      amount: Number(document.getElementById('fa_amount').value||0),
      date: document.getElementById('fa_date').value || "",
      status: document.getElementById('fa_status').value,
      notes: document.getElementById('fa_notes').value.trim()
    };
    const exists = state.fakture.find(x=>x.id===o.id);
    if(exists){ Object.assign(exists,o); addLog("Izmena fakture", `#${o.number}`); }
    else { state.fakture.push(o); addLog("Nova faktura", `#${o.number}`); }
    // Update contract spent
    recalcSpentFromFakture();
    save('fakture'); save('ugovori'); closeModal(); renderFakture(); renderUgovori();
  };
}

function recalcSpentFromFakture(){
  const sums = {};
  state.fakture.forEach(f=>{
    if(!sums[f.contractId]) sums[f.contractId] = 0;
    if(f.status!=="U pripremi") sums[f.contractId] += Number(f.amount||0);
  });
  state.ugovori.forEach(u=>{
    u.spent = sums[u.id] || 0;
    u.exhausted = (u.value>0 && u.spent>=u.value);
  });
}

function renderFakture(){
  const q = (document.getElementById('searchFakture').value||"").toLowerCase();
  const tbody = document.querySelector('#tblFakture tbody'); tbody.innerHTML = "";
  state.fakture
    .filter(r=> !q || JSON.stringify(r).toLowerCase().includes(q))
    .forEach((r,i)=>{
      const ug = state.ugovori.find(u=>u.id===r.contractId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td><td>${r.number||""}</td>
        <td>${ug? (ug.number+" — "+ug.vendor) : ""}</td>
        <td>${currency(r.amount)}</td><td>${fmtDate(r.date)}</td><td>${r.status}</td>
        <td>
          <button class="btn" data-act="edit">✏️</button>
          <button class="btn danger" data-act="del">🗑️</button>
        </td>`;
      tr.querySelector('[data-act="edit"]').addEventListener('click', ()=> openFakturaForm(r));
      tr.querySelector('[data-act="del"]').addEventListener('click', ()=> confirmDelete('faktura', r));
      tbody.appendChild(tr);
    });
}

// ------- Archive (soft delete) -------
function confirmDelete(kind, item){
  openModal(t('confirmDeleteTitle'), `<p>${t('confirmDeleteMsg')}</p>`, `
    <button class="btn" id="btnCancel">${t('cancel')}</button>
    <button class="btn danger" id="btnYes">${t('yesArchive')}</button>
  `);
  document.getElementById('btnCancel').onclick = closeModal;
  document.getElementById('btnYes').onclick = ()=>{
    const time = new Date().toISOString();
    state.archive.push({ kind, item, deletedAt: time });
    // remove from respective list
    const arr = kind==='ugovor'? state.ugovori : kind==='sporazum'? state.sporazumi : kind==='narudzbenica'? state.narudzbenice : state.fakture;
    const idx = arr.findIndex(x=>x.id===item.id);
    if(idx>-1) arr.splice(idx,1);
    save('archive'); save(kind==='ugovor'?'ugovori':kind==='sporazum'?'sporazumi':kind==='narudzbenica'?'narudzbenice':'fakture');
    addLog("Obrisano (u arhivu)", `${kind} #${item.number||item.id}`);
    closeModal(); renderArchive(); renderAll();
  };
}

function renderArchive(){
  const tbody = document.querySelector('#tblArchive tbody'); tbody.innerHTML="";
  state.archive.forEach((r,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td><td>${r.kind}</td><td>${r.item.number||r.item.id}</td>
      <td>${(r.item.vendor||r.item.notes||'')}</td>
      <td>${new Date(r.deletedAt).toLocaleString('sr-RS')}</td>
      <td>
        <button class="btn" data-act="restore">${t('restore')}</button>
        <button class="btn danger" data-act="kill">${t('removeForever')}</button>
      </td>`;
    tr.querySelector('[data-act="restore"]').addEventListener('click', ()=>{
      // put back
      const arr = r.kind==='ugovor'? state.ugovori : r.kind==='sporazum'? state.sporazumi : r.kind==='narudzbenica'? state.narudzbenice : state.fakture;
      arr.push(r.item);
      state.archive.splice(i,1);
      save('archive'); save(r.kind==='ugovor'?'ugovori':r.kind==='sporazum'?'sporazumi':r.kind==='narudzbenica'?'narudzbenice':'fakture');
      addLog("Vraćeno iz arhive", `${r.kind} #${r.item.number||r.item.id}`);
      renderArchive(); renderAll();
    });
    tr.querySelector('[data-act="kill"]').addEventListener('click', ()=>{
      if(confirm("Trajno obrisati stavku?")) {
        state.archive.splice(i,1); save('archive'); addLog("Trajno obrisano", `${r.kind} #${r.item.number||r.item.id}`); renderArchive();
      }
    });
    tbody.appendChild(tr);
  });
}

// ------- Log view -------
function renderLog(){
  const tbody = document.querySelector('#tblLog tbody'); tbody.innerHTML="";
  state.logs.forEach((r,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${r.time}</td><td>${r.user}</td><td>${r.action}</td><td>${r.details||""}</td>`;
    tbody.appendChild(tr);
  });
}
document.getElementById('btnExportLog').addEventListener('click', ()=> downloadJSON(state.logs, 'ugovori-mgsi-log.json'));
document.getElementById('btnClearLog').addEventListener('click', ()=>{
  if(confirm("Očistiti log aktivnosti?")){ state.logs = []; save('logs'); renderLog(); }
});

// ------- Settings: Export/Import & Script choice -------
document.getElementById('btnExportData').addEventListener('click', ()=>{
  const payload = {
    ugovori: state.ugovori, sporazumi: state.sporazumi, narudzbenice: state.narudzbenice, fakture: state.fakture, archive: state.archive, templates: state.templates
  };
  downloadJSON(payload, 'ugovori-mgsi-backup.json');
});
document.getElementById('btnImportData').addEventListener('change', async (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const txt = await file.text();
  const incoming = JSON.parse(txt);
  state.ugovori = incoming.ugovori||[];
  state.sporazumi = incoming.sporazumi||[];
  state.narudzbenice = incoming.narudzbenice||[];
  state.fakture = incoming.fakture||[];
  state.archive = incoming.archive||[];
  state.templates = incoming.templates||{};
  save('ugovori'); save('sporazumi'); save('narudzbenice'); save('fakture'); save('archive');
  localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(state.templates));
  addLog("Import podataka", `Stavke: ug=${state.ugovori.length}, sp=${state.sporazumi.length}`);
  renderAll();
});
document.getElementById('btnSaveScript').addEventListener('click', ()=>{
  const val = document.querySelector('input[name="scriptChoice"]:checked').value;
  state.script = val; localStorage.setItem(STORAGE_KEYS.script, val);
  addLog("Pismo za izvoz", val==="cyr"?"Ćirilica":"Latinica");
  alert("Sačuvano.");
});

// Templates (store just names as placeholders in v1.0)
document.getElementById('tplNaloga').addEventListener('change', async (e)=>{
  const f = e.target.files[0]; if(!f) return;
  state.templates.nalog = { name: f.name, at: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(state.templates));
  addLog("Uvezen šablon", `Interni nalog: ${f.name}`);
  alert("Šablon učitan (placeholder).");
});
document.getElementById('tplStanje').addEventListener('change', async (e)=>{
  const f = e.target.files[0]; if(!f) return;
  state.templates.stanje = { name: f.name, at: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(state.templates));
  addLog("Uvezen šablon", `Stanje ugovora: ${f.name}`);
  alert("Šablon učitan (placeholder).");
});

// ------- Utilities -------
function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ------- Initial Rendering -------
function renderAll(){
  renderUgovori();
  renderSporazumi();
  renderNarudzbenice();
  renderFakture();
  renderArchive();
  renderLog();
}

// Show login or app on load
(function init(){
  if(state.user){
    document.getElementById('currentUser').textContent = state.user.username;
    document.getElementById('app-screen').classList.add('screen','active');
    document.getElementById('login-screen').classList.remove('active');
    renderAll();
  } else {
    document.getElementById('login-screen').classList.add('active');
  }
})();
