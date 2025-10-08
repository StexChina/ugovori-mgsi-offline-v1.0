
// v1.1.0 — polyfill for crypto.randomUUID (older browsers)
if(!(window.crypto && window.crypto.randomUUID)){
  window.crypto = window.crypto || {};
  window.crypto.randomUUID = function(){
    // RFC4122 v4 simple poly
    const s = Array.from({length:36}, (_,i)=>{
      if(i===8||i===13||i===18||i===23) return '-';
      const r = Math.random()*16|0;
      if(i===14) return '4';
      if(i===19) return (r & 0x3 | 0x8).toString(16);
      return r.toString(16);
    }).join('');
    return s;
  };
}

// v1.0.4 — declutter controls for Ugovori
const STORAGE_KEYS = {
  theme:"umgsi_theme", lang:"umgsi_lang", script:"umgsi_script", user:"umgsi_user",
  ugovori:"umgsi_ugovori", sporazumi:"umgsi_sporazumi", narudzbenice:"umgsi_narudzbenice",
  fakture:"umgsi_fakture", archive:"umgsi_archive", logs:"umgsi_logs", templates:"umgsi_templates",
  navStyle:"umgsi_navstyle",
  viewSettings:"umgsi_view_settings" // per-table density/pageSize/columns
};

const DEFAULT_USER = { username:"stefan", password:"mgsi123", role:"admin" };

let state = {
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light",
  lang: localStorage.getItem(STORAGE_KEYS.lang) || "sr",
  script: localStorage.getItem(STORAGE_KEYS.script) || "cyr",
  navStyle: localStorage.getItem(STORAGE_KEYS.navStyle) || "top",
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || "null"),
  ugovori: JSON.parse(localStorage.getItem(STORAGE_KEYS.ugovori) || "[]"),
  sporazumi: JSON.parse(localStorage.getItem(STORAGE_KEYS.sporazumi) || "[]"),
  narudzbenice: JSON.parse(localStorage.getItem(STORAGE_KEYS.narudzbenice) || "[]"),
  fakture: JSON.parse(localStorage.getItem(STORAGE_KEYS.fakture) || "[]"),
  archive: JSON.parse(localStorage.getItem(STORAGE_KEYS.archive) || "[]"),
  logs: JSON.parse(localStorage.getItem(STORAGE_KEYS.logs) || "[]"),
  templates: JSON.parse(localStorage.getItem(STORAGE_KEYS.templates) || "{}"),
  komitenti: JSON.parse(localStorage.getItem('umgsi_komitenti') || "[]"),
  customTypes: JSON.parse(localStorage.getItem('umgsi_custom_types') || "[]"),
  viewSettings: JSON.parse(localStorage.getItem(STORAGE_KEYS.viewSettings) || "{}"),
  pagination: { ugovori: {page:1, totalPages:1} }
};

function save(key){ localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(state[key])); }
function saveKomitenti(){ localStorage.setItem('umgsi_komitenti', JSON.stringify(state.komitenti)); }
function saveCustomTypes(){ localStorage.setItem('umgsi_custom_types', JSON.stringify(state.customTypes)); }
function setTheme(t){ state.theme=t; localStorage.setItem(STORAGE_KEYS.theme,t); document.documentElement.classList.toggle('dark', t==='dark'); }
setTheme(state.theme);

// I18N minimal
const i18n = {
  sr: { loginTitle:"Ugovori MGSI", loginSubtitle:"Prijavite se za pristup", username:"Korisničko ime", password:"Lozinka", signIn:"Prijavi se",
        addContract:"Dodaj ugovor", edit:"Izmeni", delete:"Obriši", restore:"Vrati", removeForever:"Trajno obriši",
        confirmDeleteTitle:"Potvrda brisanja", confirmDeleteMsg:"Da li ste sigurni? Stavka će biti premeštena u arhivu.",
        yesArchive:"Da, u Arhivu", cancel:"Odustani", saveChanges:"Sačuvaj", create:"Kreiraj",
        details:"Detalji", hide:"Sakrij" },
  en: { loginTitle:"MGSI Contracts", loginSubtitle:"Sign in to continue", username:"Username", password:"Password", signIn:"Sign in",
        addContract:"Add Contract", edit:"Edit", delete:"Delete", restore:"Restore", removeForever:"Delete Forever",
        confirmDeleteTitle:"Delete confirmation", confirmDeleteMsg:"Are you sure? The item will be moved to archive.",
        yesArchive:"Yes, to Archive", cancel:"Cancel", saveChanges:"Save", create:"Create",
        details:"Details", hide:"Hide" }
};
function t(k){ return (i18n[state.lang] && i18n[state.lang][k]) || i18n['sr'][k] || k; }
function applyLang(){
  document.querySelector('#login-screen h1').textContent = t('loginTitle');
  document.getElementById('loginSubtitle').textContent = t('loginSubtitle');
  document.getElementById('lblUsername').textContent = t('username');
  document.getElementById('lblPassword').textContent = t('password');
  document.getElementById('btnLogin').textContent = t('signIn');
  document.querySelectorAll('[data-i18n="addContract"]').forEach(n=>n.textContent = t('addContract'));
}
applyLang();

// Layout & nav style
function isMobile(){ return window.innerWidth <= 900; }
function applyNavStyle(){
  const body=document.body;
  if(isMobile() && state.navStyle==='bottom'){ body.classList.add('use-bottom-nav'); }
  else { body.classList.remove('use-bottom-nav'); }
  updateLayout();
}
function updateLayout(){
  const header=document.querySelector('.app-header');
  const tabs=document.querySelector('.tabs');
  const bottom=document.querySelector('.bottom-nav');
  const usingBottom=document.body.classList.contains('use-bottom-nav');
  const hH=header?Math.max(header.offsetHeight,48):64;
  const tH=(!usingBottom && tabs)?Math.max(tabs.offsetHeight,44):0;
  const bH=(usingBottom && bottom)?Math.max(bottom.offsetHeight,56):0;
  document.documentElement.style.setProperty('--headerH', hH+'px');
  document.documentElement.style.setProperty('--tabsH', tH+'px');
  document.documentElement.style.setProperty('--bottomNavH', bH+'px');
}
window.addEventListener('resize', applyNavStyle);
window.addEventListener('orientationchange', applyNavStyle);

// Login
document.getElementById('toggleThemeLogin').addEventListener('click', ()=>{ setTheme(state.theme==='light'?'dark':'light'); applyNavStyle(); });
document.getElementById('toggleLangLogin').addEventListener('click', ()=>{ state.lang=(state.lang==='sr'?'en':'sr'); localStorage.setItem(STORAGE_KEYS.lang, state.lang); applyLang(); applyNavStyle(); });
document.getElementById('btnLogin').addEventListener('click', doLogin);
document.getElementById('password').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
function doLogin(){
  const u=document.getElementById('username').value.trim();
  const p=document.getElementById('password').value.trim();
  if(u===DEFAULT_USER.username && p===DEFAULT_USER.password){
    state.user={ username:u, role:DEFAULT_USER.role, loginAt:new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user));
    addLog("Prijava", `Korisnik: ${u}`);
    document.getElementById('currentUser').textContent=u;
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('screen','active');
    applyNavStyle(); buildPinnedCatTabs(); renderAll();
  } else alert("Pogrešni podaci. Pokušajte: stefan / mgsi123");
}
document.getElementById('btnLogout').addEventListener('click', (e)=>{
  e.preventDefault();
  addLog("Odjava", `Korisnik: ${state.user?.username||'?'}`);
  localStorage.removeItem(STORAGE_KEYS.user);
  state.user=null;
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
});

// Theme/Lang in app
document.getElementById('toggleTheme').addEventListener('click', ()=>{ setTheme(state.theme==='light'?'dark':'light'); applyNavStyle(); });
document.getElementById('toggleLang').addEventListener('click', ()=>{ state.lang=(state.lang==='sr'?'en':'sr'); localStorage.setItem(STORAGE_KEYS.lang, state.lang); applyLang(); applyNavStyle(); });

// Tabs & bottom nav
document.querySelectorAll('.tab').forEach(b=> b.addEventListener('click', ()=> switchTab(b.dataset.tab)));
document.querySelectorAll('.bottom-nav button').forEach(b=> b.addEventListener('click', ()=> switchTab(b.dataset.tab)));
function switchTab(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.querySelectorAll('.tab').forEach(b=> b.classList.toggle('active', b.dataset.tab===id));
  document.querySelectorAll('.bottom-nav button').forEach(b=> b.classList.toggle('active', b.dataset.tab===id));
  renderAll();
}

// Helpers

function buildKomitentiOptions(selectedId){
  const opts = ['<option value="">—</option>'].concat(
    state.komitenti.map(function(k){ return '<option value="'+k.id+'" '+(selectedId===k.id?'selected':'')+'>'+k.name+'</option>'; })
  );
  return opts.join("");
}


// v1.0.7 quick filter by type
function getAllTypes(){ return ["Sve","Servisiranje vozila","Osiguranje vozila","Tehnički pregled vozila","Gume","Šlepanje vozila","Gorivo","Pranje vozila","Elektronska naplata putarine","Lizing - TDV Fleet","Lizing - AKS Fleet"].concat(state.customTypes.map(function(x){return x.name;})); }
if(!state.filterType) state.filterType = "Sve";

function buildTypeChips(){
  const toolbar = document.querySelector('#view-ugovori .toolbar');
  if(toolbar && !document.getElementById('typeChips')){
    const wrap = document.createElement('div');
    wrap.id = 'typeChips';
    wrap.style.display='flex'; wrap.style.flexWrap='wrap'; wrap.style.gap='6px';
    wrap.style.marginLeft='6px';
    getAllTypes().forEach(function(tp){
      const b = document.createElement('button');
      b.className='btn'; b.textContent=tp; b.style.padding='6px 10px'; b.dataset.type=tp;
      if(tp===state.filterType){ b.style.background='var(--brand)'; b.style.color='#fff'; b.style.borderColor='transparent'; }
      b.addEventListener('click', ()=>{ state.filterType=tp; document.querySelectorAll('#typeChips .btn').forEach(x=>{ x.style.background=''; x.style.color=''; x.style.borderColor='var(--border)'; }); b.style.background='var(--brand)'; b.style.color='#fff'; b.style.borderColor='transparent'; renderUgovori(); });
      wrap.appendChild(b);
    });
    toolbar.insertBefore(wrap, toolbar.querySelector('.spacer'));
  } else if(toolbar){ // refresh active state
    document.querySelectorAll('#typeChips .btn').forEach(function(b){ var tp=b.dataset.type; b.style.background = (tp===state.filterType)?'var(--brand)':''; b.style.color=(tp===state.filterType)?'#fff':''; b.style.borderColor=(tp===state.filterType)?'transparent':'var(--border)'; });
  }
}

function currency(n){ return Number(n||0).toLocaleString('sr-RS'); }
function fmtDate(d){ if(!d) return ""; const dt=new Date(d); return dt.toLocaleDateString('sr-RS'); }
function daysLeft(end){ if(!end) return null; const ms=(new Date(end).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)); return Math.ceil(ms/86400000); }
function statusBadge(row){ const dl=daysLeft(row.endDate); let cls="ok", txt="Aktivno"; if(dl!==null && dl<=30 && dl>=0){cls="warn"; txt=`Ističe (${dl} d)`;} if(dl!==null && dl<0){cls="danger"; txt="Isteklo";} if(row.exhausted){cls="danger"; txt="Iscrpljeno";} return `<span class="badge ${cls}">${txt}</span>`; }
function addLog(action, details){ const entry={ time:new Date().toLocaleString('sr-RS'), user:state.user?.username||"anon", action, details }; state.logs.push(entry); save('logs'); }
function downloadJSON(obj, filename){ const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

// ---- Ugovori: columns + density + pagination + details ----
const UG_COLS_META = [
  {key:'seq', label:'#'},
  {key:'number', label:'Broj'},
  {key:'vendor', label:'Dobavljač'},
  {key:'type', label:'Tip'},
  {key:'method', label:'Metod'},
  {key:'value', label:'Vrednost'},
  {key:'spent', label:'Potrošeno'},
  {key:'remain', label:'Preostalo'},
  {key:'period', label:'Od–Do'},
  {key:'status', label:'Status'},
  {key:'actions', label:''}
];
function getViewSettings(){
  if(!state.viewSettings.ugovori){
    state.viewSettings.ugovori = {
      density:'comfortable',
      pageSize:25,
      columns: { seq:true, number:true, vendor:true, type:true, method:true, value:true, spent:true, remain:true, period:true, status:true, actions:true }
    };
    save('viewSettings');
  }
  return state.viewSettings.ugovori;
}
document.getElementById('selDensityUgovori').addEventListener('change', e=>{
  const s=getViewSettings();
  s.density=e.target.value; save('viewSettings'); renderUgovori();
});
document.getElementById('selPageUgovori').addEventListener('change', e=>{
  const s=getViewSettings(); s.pageSize=parseInt(e.target.value,10)||25; state.pagination.ugovori.page=1; save('viewSettings'); renderUgovori();
});
document.getElementById('btnColsUgovori').addEventListener('click', openColsPickerUgovori);

function openColsPickerUgovori(){
  const s=getViewSettings();
  const grid=document.getElementById('colsGridUgovori');
  grid.innerHTML = UG_COLS_META.map(c=>{
    const disabled = (c.key==='seq' || c.key==='actions'); // obavezne
    const chk = `<label><input type="checkbox" data-col="${c.key}" ${s.columns[c.key]?'checked':''} ${disabled?'disabled':''}/> ${c.label||'(akcije)'} </label>`;
    return `<div>${chk}</div>`;
  }).join('');
  document.getElementById('colsModal').classList.remove('hidden');
}
document.getElementById('colsClose').addEventListener('click', ()=> document.getElementById('colsModal').classList.add('hidden'));
document.getElementById('colsCancel').addEventListener('click', ()=> document.getElementById('colsModal').classList.add('hidden'));
document.getElementById('colsSave').addEventListener('click', ()=>{
  const s=getViewSettings();
  document.querySelectorAll('#colsGridUgovori [data-col]').forEach(chk=>{
    const col=chk.getAttribute('data-col');
    if(col==='seq'||col==='actions') return;
    s.columns[col]=chk.checked;
  });
  save('viewSettings');
  document.getElementById('colsModal').classList.add('hidden');
  renderUgovori();
});

// CRUD Ugovori (existing handlers, trimmed to render with meta)
document.getElementById('btnAddUgovor').addEventListener('click', ()=> openUgovorForm());
function openUgovorForm(item=null){
  const isEdit=!!item;
  const data=item||{ id:crypto.randomUUID(), number:"", vendor:"", type:"Servisiranje vozila", method:"Po izvršenju usluge", value:0, spent:0, startDate:"", endDate:"", linkedFrameworkId:"", notes:"" };
  openModal(isEdit?"Izmena ugovora":"Novi ugovor", `
    <div class="grid">
      <div><label>Broj</label><input id="f_number" value="${data.number||""}"/></div>
      <div><label>Dobavljač</label><input id="f_vendor" value="${data.vendor||""}"/></div>
      <div><label>Tip</label>
        <select id="f_type">
          ${["Servisiranje vozila","Osiguranje vozila","Tehnički pregled vozila","Gume","Šlepanje vozila","Gorivo","Pranje vozila","Elektronska naplata putarine","Lizing - TDV Fleet","Lizing - AKS Fleet"].map(function(v){return "<option "+(data.type===v?"selected":"")+">"+v+"</option>";}).join("")}
        </select>
      </div>
      <div><label>Metod plaćanja</label>
        <select id="f_method">
          ${["Mesečno","Po izvršenju usluge"].map(function(v){return "<option "+(data.method===v?"selected":"")+">"+v+"</option>";}).join("")}
        </select>
      </div>
      <div><label>Ukupna vrednost (RSD)</label><input type="number" id="f_value" value="${data.value||0}"/></div>
      <div><label>Potrošeno (RSD)</label><input type="number" id="f_spent" value="${data.spent||0}"/></div>
      <div><label>Datum početka</label><input type="date" id="f_start" value="${data.startDate?data.startDate.substring(0,10):""}"/></div>
      <div><label>Datum isteka</label><input type="date" id="f_end" value="${data.endDate?data.endDate.substring(0,10):""}"/></div>
      <div style="flex-basis:100%"><label>Napomena</label><textarea id="f_notes">${data.notes||""}</textarea></div>
    </div>
  `, `<button class="btn" id="btnCancel">${t('cancel')}</button><button class="btn primary" id="btnSave">${isEdit?t('saveChanges'):t('create')}</button>`);
  document.getElementById('btnCancel').onclick=closeModal;
  document.getElementById('btnSave').onclick=()=>{
    const o={ ...data,
      number:document.getElementById('f_number').value.trim(),
      vendor:document.getElementById('f_vendor').value.trim(),
      type:document.getElementById('f_type').value,
      method:document.getElementById('f_method').value,
      value:Number(document.getElementById('f_value').value||0),
      spent:Number(document.getElementById('f_spent').value||0),
      startDate:document.getElementById('f_start').value||"",
      endDate:document.getElementById('f_end').value||"",
      notes:document.getElementById('f_notes').value.trim()
    };
    const ex=state.ugovori.find(x=>x.id===o.id);
    if(ex){ Object.assign(ex,o); addLog("Izmena ugovora", `#${o.number} — ${o.vendor}`); }
    else { state.ugovori.push(o); addLog("Novi ugovor", `#${o.number} — ${o.vendor}`); }
    save('ugovori'); closeModal(); renderUgovori();
  };
}

document.getElementById('searchUgovori').addEventListener('input', ()=>{ state.pagination.ugovori.page=1; renderUgovori(); });

function renderUgovori(){
  const view = getViewSettings();
  const table = document.getElementById('tblUgovori');
  table.classList.toggle('compact', view.density==='compact');

  // Filters
  const q=(document.getElementById('searchUgovori').value||"").toLowerCase();
  const filtered = state.ugovori.filter(r => {
  const matchQ = !q || JSON.stringify(r).toLowerCase().includes(q);
  const matchT = (state.filterType==='Sve' || r.type===state.filterType);
  return matchQ && matchT;
});

  // Pagination
  const pageSize = view.pageSize||25;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  let page = state.pagination.ugovori.page || 1;
  if(page>totalPages) page=totalPages;
  if(page<1) page=1;
  state.pagination.ugovori={page, totalPages};
  const start=(page-1)*pageSize;
  const items=filtered.slice(start, start+pageSize);

  // Header (based on columns)
  const headRow=document.getElementById('headUgovori');
  headRow.innerHTML = UG_COLS_META.filter(c=>view.columns[c.key]).map(c=>`<th>${c.label||""}</th>`).join("");

  // Body
  const body=document.getElementById('bodyUgovori');
  body.innerHTML="";
  items.forEach((r,i)=>{
    const remain=(r.value||0)-(r.spent||0);
    const cols=[];
    if(view.columns.seq) cols.push(`<td>${start+i+1}</td>`);
    if(view.columns.number) cols.push(`<td>${r.number||""}</td>`);
    if(view.columns.vendor) cols.push(`<td>${r.vendor||""}</td>`);
    if(view.columns.type) cols.push(`<td>${r.type||""}</td>`);
    if(view.columns.method) cols.push(`<td>${r.method||""}</td>`);
    if(view.columns.value) cols.push(`<td>${currency(r.value)}</td>`);
    if(view.columns.spent) cols.push(`<td>${currency(r.spent)}</td>`);
    if(view.columns.remain) cols.push(`<td>${currency(remain)}</td>`);
    if(view.columns.period) cols.push(`<td>${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}</td>`);
    if(view.columns.status) cols.push(`<td>${statusBadge(r)}</td>`);
    if(view.columns.actions) cols.push(`<td><button class="btn" data-act="edit">✏️</button> <button class="btn" data-act="det">${t('details')}</button> <button class="btn danger" data-act="del">🗑️</button></td>`);
    const tr=document.createElement('tr'); tr.innerHTML=cols.join('');
    body.appendChild(tr);

    // Details row (hidden initially)
    const trDet=document.createElement('tr'); trDet.className='details-row'; trDet.style.display='none';
    const colSpan = UG_COLS_META.filter(c=>view.columns[c.key]).length;
    trDet.innerHTML = `<td colspan="${colSpan}">
      <div><strong>Napomena:</strong> ${r.notes||"—"}</div>
      <div class="muted">ID: ${r.id}</div>
    </td>`;
    body.appendChild(trDet);

    // Actions
    const btns = tr.querySelectorAll('button');
    btns.forEach(b=>{
      const act=b.getAttribute('data-act');
      if(act==='edit') b.addEventListener('click', ()=> openUgovorForm(r));
      if(act==='det') b.addEventListener('click', ()=>{
        const shown = trDet.style.display!== 'none';
        trDet.style.display = shown ? 'none' : '';
        b.textContent = shown ? t('details') : t('hide');
      });
      if(act==='del') b.addEventListener('click', ()=> confirmDelete('ugovor', r));
    });
  });

  // Pagination controls
  const pg=document.getElementById('pgUgovori');
  pg.innerHTML = `
    <button class="btn" id="prevPg" ${page<=1?'disabled':''}>◀</button>
    <span>Strana ${page} / ${totalPages} • ${total} stavki</span>
    <button class="btn" id="nextPg" ${page>=totalPages?'disabled':''}>▶</button>
  `;
  document.getElementById('prevPg').addEventListener('click', ()=>{ if(state.pagination.ugovori.page>1){ state.pagination.ugovori.page--; renderUgovori(); } });
  document.getElementById('nextPg').addEventListener('click', ()=>{ if(state.pagination.ugovori.page<totalPages){ state.pagination.ugovori.page++; renderUgovori(); } });
}

// Other tables (existing basic renderers)
function renderSporazumi(){
  const q=(document.getElementById('searchSporazumi').value||"").toLowerCase();
  const tbody=document.querySelector('#tblSporazumi tbody'); tbody.innerHTML="";
  state.sporazumi.filter(r=>!q || JSON.stringify(r).toLowerCase().includes(q)).forEach((r,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td><td>${r.number||""}</td><td>${r.vendor||""}</td><td>${currency(r.value)}</td><td>${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}</td><td>${statusBadge(r)}</td><td><button class="btn" data-act="edit">✏️</button> <button class="btn danger" data-act="del">🗑️</button></td>`;
    tr.querySelector('[data-act="edit"]').addEventListener('click', ()=> openSporazumForm(r));
    tr.querySelector('[data-act="del"]').addEventListener('click', ()=> confirmDelete('sporazum', r));
    tbody.appendChild(tr);
  });
}
function renderNarudzbenice(){
  const q=(document.getElementById('searchNarudzbenice').value||"").toLowerCase();
  const tbody=document.querySelector('#tblNarudzbenice tbody'); tbody.innerHTML="";
  state.narudzbenice.filter(r=>!q||JSON.stringify(r).toLowerCase().includes(q)).forEach((r,i)=>{
    const ug=state.ugovori.find(u=>u.id===r.contractId);
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td><td>${r.number||""}</td><td>${ug?(ug.number+" — "+ug.vendor):""}</td><td>${currency(r.amountVat)}</td><td>${currency(r.amountNoVat)}</td><td>${fmtDate(r.date)}</td><td>${r.status}</td><td><button class="btn" data-act="edit">✏️</button> <button class="btn danger" data-act="del">🗑️</button></td>`;
    tr.querySelector('[data-act="edit"]').addEventListener('click', ()=> openNarudzbenicaForm(r));
    tr.querySelector('[data-act="del"]').addEventListener('click', ()=> confirmDelete('narudzbenica', r));
    tbody.appendChild(tr);
  });
}
function renderFakture(){
  const q=(document.getElementById('searchFakture').value||"").toLowerCase();
  const tbody=document.querySelector('#tblFakture tbody'); tbody.innerHTML="";
  state.fakture.filter(r=>!q||JSON.stringify(r).toLowerCase().includes(q)).forEach((r,i)=>{
    const ug=state.ugovori.find(u=>u.id===r.contractId);
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td><td>${r.number||""}</td><td>${ug?(ug.number+" — "+ug.vendor):""}</td><td>${currency(r.amount)}</td><td>${fmtDate(r.date)}</td><td>${r.status}</td><td><button class="btn" data-act="edit">✏️</button> <button class="btn danger" data-act="del">🗑️</button></td>`;
    tr.querySelector('[data-act="edit"]').addEventListener('click', ()=> openFakturaForm(r));
    tr.querySelector('[data-act="del"]').addEventListener('click', ()=> confirmDelete('faktura', r));
    tbody.appendChild(tr);
  });
}

// CRUD forms for other entities (same as v1.0.3)
document.getElementById('btnAddSporazum').addEventListener('click', ()=> openSporazumForm());
function openSporazumForm(item=null){
  const isEdit=!!item; const data=item||{ id:crypto.randomUUID(), number:"", vendor:"", value:0, startDate:"", endDate:"", notes:"" };
  openModal(isEdit?"Izmena okvirnog sporazuma":"Novi okvirni sporazum", `
    <div class="grid">
      <div><label>Broj</label><input id="s_number" value="${data.number||""}"/></div>
      <div><label>Dobavljač</label><input id="s_vendor" value="${data.vendor||""}"/></div>
      <div><label>Ukupna vrednost</label><input type="number" id="s_value" value="${data.value||0}"/></div>
      <div><label>Datum početka</label><input type="date" id="s_start" value="${data.startDate?data.startDate.substring(0,10):""}"/></div>
      <div><label>Datum isteka</label><input type="date" id="s_end" value="${data.endDate?data.endDate.substring(0,10):""}"/></div>
      <div style="flex-basis:100%"><label>Napomena</label><textarea id="s_notes">${data.notes||""}</textarea></div>
    </div>
  `, `<button class="btn" id="btnCancel">${t('cancel')}</button><button class="btn primary" id="btnSave">${isEdit?t('saveChanges'):t('create')}</button>`);
  document.getElementById('btnCancel').onclick=closeModal;
  document.getElementById('btnSave').onclick=()=>{
    const o={ ...data,
      number:document.getElementById('s_number').value.trim(),
      vendor:document.getElementById('s_vendor').value.trim(),
      value:Number(document.getElementById('s_value').value||0),
      startDate:document.getElementById('s_start').value||"",
      endDate:document.getElementById('s_end').value||"",
      notes:document.getElementById('s_notes').value.trim()
    };
    const ex=state.sporazumi.find(x=>x.id===o.id);
    if(ex){ Object.assign(ex,o); addLog("Izmena okvirnog sporazuma", `#${o.number} — ${o.vendor}`); }
    else { state.sporazumi.push(o); addLog("Novi okvirni sporazum", `#${o.number} — ${o.vendor}`); }
    save('sporazumi'); closeModal(); renderSporazumi();
  };
}

document.getElementById('btnAddNarudzbenica').addEventListener('click', ()=> openNarudzbenicaForm());
function openNarudzbenicaForm(item=null){
  const isEdit=!!item; const data=item||{ id:crypto.randomUUID(), number:"", contractId:"", amountVat:0, amountNoVat:0, date:new Date().toISOString().substring(0,10), notes:"", status:"Aktivna" };
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
        <select id="n_status">${["Aktivna","Iskorišćena","Istekla"].map(function(v){return "<option "+(data.status===v?"selected":"")+">"+v+"</option>";}).join("")}</select>
      </div>
      <div style="flex-basis:100%"><label>Napomena</label><textarea id="n_notes">${data.notes||""}</textarea></div>
      <div class="notice">Limit: 1.200.000 RSD sa PDV (1.000.000 bez PDV). Sistem će upozoriti ako prekoračiš.</div>
    </div>
  `, `<button class="btn" id="btnCancel">${t('cancel')}</button><button class="btn primary" id="btnSave">${isEdit?t('saveChanges'):t('create')}</button>`);
  document.getElementById('btnCancel').onclick=closeModal;
  document.getElementById('btnSave').onclick=()=>{
    const o={ ...data,
      number:document.getElementById('n_number').value.trim(),
      contractId:document.getElementById('n_contract').value||"",
      amountVat:Number(document.getElementById('n_vat').value||0),
      amountNoVat:Number(document.getElementById('n_novat').value||0),
      date:document.getElementById('n_date').value||"",
      status:document.getElementById('n_status').value,
      notes:document.getElementById('n_notes').value.trim()
    };
    if(o.amountVat>1200000 || o.amountNoVat>1000000){ alert("Prekoračenje limita narudžbenice!"); return; }
    const ex=state.narudzbenice.find(x=>x.id===o.id);
    if(ex){ Object.assign(ex,o); addLog("Izmena narudžbenice", `#${o.number}`); }
    else {
      const same=state.narudzbenice.filter(n=>n.contractId===o.contractId).sort((a,b)=> new Date(b.date)-new Date(a.date));
      if(same.length){
        const last=new Date(same[0].date); const now=new Date(o.date);
        const months=(now-last)/(1000*60*60*24*30);
        if(months<12 && !confirm("Već postoji narudžbenica u poslednjih 12 meseci za ovaj ugovor. Nastaviti?")) return;
      }
      state.narudzbenice.push(o); addLog("Nova narudžbenica", `#${o.number}`);
    }
    save('narudzbenice'); closeModal(); renderNarudzbenice();
  };
}

document.getElementById('btnAddFaktura').addEventListener('click', ()=> openFakturaForm());
function openFakturaForm(item=null){
  const isEdit=!!item; const data=item||{ id:crypto.randomUUID(), number:"", contractId:"", amount:0, date:new Date().toISOString().substring(0,10), status:"U pripremi", notes:"" };
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
        <select id="fa_status">${["U pripremi","Na odobrenju","Plaćeno"].map(function(v){return "<option "+(data.status===v?"selected":"")+">"+v+"</option>";}).join("")}</select>
      </div>
      <div style="flex-basis:100%"><label>Napomena</label><textarea id="fa_notes">${data.notes||""}</textarea></div>
    </div>
  `, `<button class="btn" id="btnCancel">${t('cancel')}</button><button class="btn primary" id="btnSave">${isEdit?t('saveChanges'):t('create')}</button>`);
  document.getElementById('btnCancel').onclick=closeModal;
  document.getElementById('btnSave').onclick=()=>{
    const o={ ...data,
      number:document.getElementById('fa_number').value.trim(),
      contractId:document.getElementById('fa_contract').value||"",
      amount:Number(document.getElementById('fa_amount').value||0),
      date:document.getElementById('fa_date').value||"",
      status:document.getElementById('fa_status').value,
      notes:document.getElementById('fa_notes').value.trim()
    };
    const ex=state.fakture.find(x=>x.id===o.id);
    if(ex){ Object.assign(ex,o); addLog("Izmena fakture", `#${o.number}`); }
    else { state.fakture.push(o); addLog("Nova faktura", `#${o.number}`); }
    recalcSpentFromFakture(); save('fakture'); save('ugovori'); closeModal(); renderFakture(); renderUgovori();
  };
}
function recalcSpentFromFakture(){
  const sums={};
  state.fakture.forEach(f=>{ if(f.status!=="U pripremi"){ sums[f.contractId]=(sums[f.contractId]||0)+Number(f.amount||0); } });
  state.ugovori.forEach(u=>{ u.spent=sums[u.id]||0; u.exhausted=(u.value>0 && u.spent>=u.value); });
}

// Archive + Log
function confirmDelete(kind, item){
  openModal(t('confirmDeleteTitle'), `<p>${t('confirmDeleteMsg')}</p>`, `<button class="btn" id="btnCancel">${t('cancel')}</button><button class="btn danger" id="btnYes">${t('yesArchive')}</button>`);
  document.getElementById('btnCancel').onclick=closeModal;
  document.getElementById('btnYes').onclick=()=>{
    const time=new Date().toISOString();
    state.archive.push({kind, item, deletedAt:time});
    const arr = kind==='ugovor'?state.ugovori : kind==='sporazum'?state.sporazumi : kind==='narudzbenica'?state.narudzbenice : state.fakture;
    const idx=arr.findIndex(x=>x.id===item.id); if(idx>-1) arr.splice(idx,1);
    save('archive'); save(kind==='ugovor'?'ugovori':kind==='sporazum'?'sporazumi':kind==='narudzbenica'?'narudzbenice':'fakture');
    addLog("Obrisano (u arhivu)", `${kind} #${item.number||item.id}`);
    closeModal(); renderArchive(); renderAll();
  };
}
function renderArchive(){
  const tbody=document.querySelector('#tblArchive tbody'); tbody.innerHTML="";
  state.archive.forEach((r,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td><td>${r.kind}</td><td>${r.item.number||r.item.id}</td><td>${(r.item.vendor||r.item.notes||'')}</td><td>${new Date(r.deletedAt).toLocaleString('sr-RS')}</td><td><button class="btn" data-act="restore">${t('restore')}</button> <button class="btn danger" data-act="kill">${t('removeForever')}</button></td>`;
    tr.querySelector('[data-act="restore"]').addEventListener('click', ()=>{
      const arr=r.kind==='ugovor'?state.ugovori : r.kind==='sporazum'?state.sporazumi : r.kind==='narudzbenica'?state.narudzbenice : state.fakture;
      arr.push(r.item); state.archive.splice(i,1); save('archive'); save(r.kind==='ugovor'?'ugovori':r.kind==='sporazum'?'sporazumi':r.kind==='narudzbenica'?'narudzbenice':'fakture'); addLog("Vraćeno iz arhive", `${r.kind} #${r.item.number||r.item.id}`); renderArchive(); renderAll();
    });
    tr.querySelector('[data-act="kill"]').addEventListener('click', ()=>{ if(confirm("Trajno obrisati stavku?")){ state.archive.splice(i,1); save('archive'); addLog("Trajno obrisano", `${r.kind} #${r.item.number||r.item.id}`); renderArchive(); } });
    tbody.appendChild(tr);
  });
}
function renderLog(){
  const tbody=document.querySelector('#tblLog tbody'); tbody.innerHTML="";
  state.logs.forEach((r,i)=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${i+1}</td><td>${r.time}</td><td>${r.user}</td><td>${r.action}</td><td>${r.details||""}</td>`; tbody.appendChild(tr); });
}
document.getElementById('btnExportLog').addEventListener('click', ()=> downloadJSON(state.logs,'ugovori-mgsi-log.json'));
document.getElementById('btnClearLog').addEventListener('click', ()=>{ if(confirm("Očistiti log aktivnosti?")){ state.logs=[]; save('logs'); renderLog(); }});

// Settings
document.getElementById('btnExportData').addEventListener('click', ()=>{
  const payload={ ugovori:state.ugovori, sporazumi:state.sporazumi, narudzbenice:state.narudzbenice, fakture:state.fakture, archive:state.archive, templates:state.templates };
  downloadJSON(payload,'ugovori-mgsi-backup.json');
});
document.getElementById('btnImportData').addEventListener('change', async (e)=>{
  const file=e.target.files[0]; if(!file) return;
  const txt=await file.text(); const incoming=JSON.parse(txt);
  state.ugovori=incoming.ugovori||[]; state.sporazumi=incoming.sporazumi||[]; state.narudzbenice=incoming.narudzbenice||[]; state.fakture=incoming.fakture||[]; state.archive=incoming.archive||[]; state.templates=incoming.templates||{};
  save('ugovori'); save('sporazumi'); save('narudzbenice'); save('fakture'); save('archive'); localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(state.templates));
  addLog("Import podataka", `Stavke: ug=${state.ugovori.length}, sp=${state.sporazumi.length}`);
  renderAll();
});
document.getElementById('btnSaveScript').addEventListener('click', ()=>{
  const val=document.querySelector('input[name="scriptChoice"]:checked').value;
  state.script=val; localStorage.setItem(STORAGE_KEYS.script, val);
  addLog("Pismo za izvoz", val==="cyr"?"Ćirilica":"Latinica"); alert("Sačuvano.");
});
document.getElementById('btnSaveNavStyle').addEventListener('click', ()=>{
  const val=document.querySelector('input[name="navStyle"]:checked').value;
  state.navStyle=val; localStorage.setItem(STORAGE_KEYS.navStyle, val);
  addLog("Navigacija (mobilni)", val==="bottom"?"Dole (bottom-nav)":"Gore (tabovi)"); applyNavStyle(); alert("Sačuvano.");
});

// Generic modal helpers
const modal=document.getElementById('modal');
const modalTitle=document.getElementById('modalTitle');
const modalBody=document.getElementById('modalBody');
const modalFooter=document.getElementById('modalFooter');
document.getElementById('modalClose').addEventListener('click', closeModal);
function openModal(title, bodyHTML, footerHTML){ modalTitle.textContent=title; modalBody.innerHTML=bodyHTML; modalFooter.innerHTML=footerHTML||""; modal.classList.remove('hidden'); }
function closeModal(){ modal.classList.add('hidden'); }

// Init
function renderAll(){ buildTypeChips(); renderUgovori(); renderSporazumi(); renderNarudzbenice(); renderFakture(); renderArchive(); renderKomitenti(); renderCats(); renderLog(); }
console.log('Ugovori MGSI script loaded v1.2.1');
(function init(){
  if(state.user){ document.getElementById('currentUser').textContent=state.user.username; document.getElementById('app-screen').classList.add('screen','active'); document.getElementById('login-screen').classList.remove('active'); }
  else { document.getElementById('login-screen').classList.add('active'); }
  // init selects from saved
  const s=getViewSettings();
  document.getElementById('selDensityUgovori').value=s.density||'comfortable';
  document.getElementById('selPageUgovori').value=String(s.pageSize||25);
  applyNavStyle(); buildPinnedCatTabs(); renderAll();
applyCustomLogo(); bindAddButtons(); })();

// v1.0.8 — event delegation fallback for Add buttons (in case listeners miss)
document.addEventListener('click', function(e){
  if(e.target.closest('#btnAddUgovor')){ e.preventDefault(); try{ openUgovorForm(); }catch(err){ console.error(err); alert('Greška pri otvaranju forme ugovora.'); } }
  if(e.target.closest('#btnAddSporazum')){ e.preventDefault(); try{ openSporazumForm(); }catch(err){ console.error(err); alert('Greška pri otvaranju forme sporazuma.'); } }
  if(e.target.closest('#btnAddNarudzbenica')){ e.preventDefault(); try{ openNarudzbenicaForm(); }catch(err){ console.error(err); alert('Greška pri otvaranju forme narudžbenice.'); } }
  if(e.target.closest('#btnAddFaktura')){ e.preventDefault(); try{ openFakturaForm(); }catch(err){ console.error(err); alert('Greška pri otvaranju forme fakture.'); } }
}, true);


// v1.0.9 — custom logo handling
function applyCustomLogo(){
  try{
    const t = state.templates || {};
    const url = t.logoDataUrl;
    const img = document.querySelector('.app-header .logo.small');
    if(img){
      img.src = url && typeof url === 'string' && url.length > 10 ? url : 'assets/mgsi_logo.svg';
    }
  }catch(e){ console.warn('logo apply failed', e); }
}
document.addEventListener('change', async (e)=>{
  if(e.target && e.target.id === 'uploadLogo'){
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const ok = ['image/png','image/svg+xml','image/jpeg'];
    if(ok.indexOf(f.type)===-1){ alert('Podržani formati: PNG, SVG, JPG.'); return; }
    const reader = new FileReader();
    reader.onload = function(){
      state.templates = state.templates || {};
      state.templates.logoDataUrl = reader.result;
      localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(state.templates));
      addLog('Logo', 'Postavljen prilagođeni logo');
      applyCustomLogo();
    };
    reader.readAsDataURL(f);
  }
});
document.addEventListener('click', (e)=>{
  if(e.target && e.target.id === 'btnResetLogo'){
    if(confirm('Ukloniti prilagođeni logo i vratiti podrazumevani?')){
      state.templates = state.templates || {};
      delete state.templates.logoDataUrl;
      localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(state.templates));
      addLog('Logo', 'Vraćen podrazumevani');
      applyCustomLogo();
    }
  }
});


// v1.0.9 — ensure Add buttons always work
function bindAddButtons(){
  var b1=document.getElementById('btnAddUgovor'); if(b1) b1.onclick = ()=> openUgovorForm();
  var b2=document.getElementById('btnAddSporazum'); if(b2) b2.onclick = ()=> openSporazumForm();
  var b3=document.getElementById('btnAddNarudzbenica'); if(b3) b3.onclick = ()=> openNarudzbenicaForm();
  var b4=document.getElementById('btnAddFaktura'); if(b4) b4.onclick = ()=> openFakturaForm();
}
window.addEventListener('load', bindAddButtons);

// Export key functions globally (for delegation)
window.openUgovorForm = openUgovorForm;
window.openSporazumForm = openSporazumForm;
window.openNarudzbenicaForm = openNarudzbenicaForm;
window.openFakturaForm = openFakturaForm;



// v1.1.0 — inline onclick global handler (ultimate fallback)
window.__onAdd = function(kind){
  try{
    if(kind==='ugovor') return openUgovorForm();
    if(kind==='sporazum') return openSporazumForm();
    if(kind==='narudzbenica') return openNarudzbenicaForm();
    if(kind==='faktura') return openFakturaForm();
  }catch(e){
    console.error('Add handler error', e);
    alert('Greška pri otvaranju forme ('+kind+').');
  }
};
// Bind also on DOMContentLoaded (earlier than load)
document.addEventListener('DOMContentLoaded', function(){
  try{
    var b1=document.getElementById('btnAddUgovor'); if(b1) b1.onclick = ()=> openUgovorForm();
    var b2=document.getElementById('btnAddSporazum'); if(b2) b2.onclick = ()=> openSporazumForm();
    var b3=document.getElementById('btnAddNarudzbenica'); if(b3) b3.onclick = ()=> openNarudzbenicaForm();
    var b4=document.getElementById('btnAddFaktura'); if(b4) b4.onclick = ()=> openFakturaForm();
  }catch(e){ console.warn('DOMContentLoaded bind failed', e); }
});


// ---- Komitenti (vendors) ----
document.addEventListener('click', function(e){
  if(e.target && e.target.id==='btnAddKomitent'){ e.preventDefault(); openKomitentForm(); }
});

function openKomitentForm(item){
  const isEdit=!!item;
  const data=item||{ id:crypto.randomUUID(), name:'', pib:'', contact:'', notes:'' };
  const body = [
    '<div class="grid">',
    '<div><label>Naziv</label><input id="k_name" value="'+(data.name||'')+'"/></div>',
    '<div><label>PIB</label><input id="k_pib" value="'+(data.pib||'')+'"/></div>',
    '<div><label>Kontakt</label><input id="k_contact" value="'+(data.contact||'')+'"/></div>',
    '<div style="flex-basis:100%"><label>Napomena</label><textarea id="k_notes">'+(data.notes||'')+'</textarea></div>',
    '</div>'
  ].join('');
  openModal(isEdit?'Izmena komitenta':'Novi komitent', body, '<button class="btn" id="btnCancel">'+t('cancel')+'</button><button class="btn primary" id="btnSave">'+(isEdit?t('saveChanges'):t('create'))+'</button>');
  document.getElementById('btnCancel').onclick=closeModal;
  document.getElementById('btnSave').onclick=function(){
    var o={ id:data.id, name:document.getElementById('k_name').value.trim(), pib:document.getElementById('k_pib').value.trim(), contact:document.getElementById('k_contact').value.trim(), notes:document.getElementById('k_notes').value.trim() };
    if(!o.name){ alert('Unesite naziv komitenta.'); return; }
    var ex = state.komitenti.find(function(x){ return x.id===o.id; });
    if(ex){ Object.assign(ex,o); addLog('Izmena komitenta', o.name); }
    else { state.komitenti.push(o); addLog('Novi komitent', o.name); }
    saveKomitenti(); closeModal(); renderKomitenti();
  };
}

function renderKomitenti(){
  var q=(document.getElementById('searchKomitenti')?.value||'').toLowerCase();
  var tbody = document.querySelector('#tblKomitenti tbody'); if(!tbody) return;
  tbody.innerHTML='';
  state.komitenti.filter(function(r){ return !q || JSON.stringify(r).toLowerCase().includes(q); }).forEach(function(r,i){
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+(i+1)+'</td><td>'+ (r.name||'') +'</td><td>'+ (r.pib||'') +'</td><td>'+ (r.contact||'') +'</td><td>'+ (r.notes||'') +'</td><td><button class="btn" data-act="edit">✏️</button> <button class="btn danger" data-act="del">🗑️</button></td>';
    tr.querySelector('[data-act="edit"]').addEventListener('click', function(){ openKomitentForm(r); });
    tr.querySelector('[data-act="del"]').addEventListener('click', function(){
      if(confirm('Obrisati komitenta?')){ var idx=state.komitenti.findIndex(function(x){ return x.id===r.id; }); if(idx>-1){ state.komitenti.splice(idx,1); saveKomitenti(); addLog('Obrisan komitent', r.name); renderKomitenti(); } }
    });
    tbody.appendChild(tr);
  });
}
document.getElementById('searchKomitenti')?.addEventListener('input', renderKomitenti);



// ---- Custom categories ----
function renderCats(){
  var tbody=document.querySelector('#tblCats tbody'); if(!tbody) return;
  tbody.innerHTML='';
  state.customTypes.forEach(function(c,i){
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+(i+1)+'</td><td>'+c.name+'</td><td><input type="checkbox" '+(c.pinned?'checked':'')+' data-idx="'+i+'" class="pinCat"/></td><td><button class="btn danger" data-act="del" data-idx="'+i+'">🗑️</button></td>';
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.pinCat').forEach(function(ch){ ch.addEventListener('change', function(){ var i=parseInt(ch.getAttribute('data-idx')); state.customTypes[i].pinned = ch.checked; saveCustomTypes(); buildPinnedCatTabs(); }); });
  tbody.querySelectorAll('[data-act="del"]').forEach(function(b){ b.addEventListener('click', function(){ var i=parseInt(b.getAttribute('data-idx')); state.customTypes.splice(i,1); saveCustomTypes(); renderCats(); buildPinnedCatTabs(); }); });
}
document.getElementById('btnAddCat')?.addEventListener('click', function(){
  var v = (document.getElementById('inpNewCat').value||'').trim();
  if(!v) return; if(state.customTypes.some(function(x){return x.name.toLowerCase()===v.toLowerCase();})) { alert('Kategorija već postoji.'); return; }
  state.customTypes.push({name:v, pinned:false}); saveCustomTypes(); addLog('Nova kategorija', v); document.getElementById('inpNewCat').value=''; renderCats(); buildTypeChips(true);
});
document.getElementById('btnPinCats')?.addEventListener('click', function(){ buildPinnedCatTabs(); alert('Tabovi osveženi.'); });

function buildPinnedCatTabs(){
  // Create tab buttons for pinned categories (as shortcuts to Ugovori with filter)
  var nav = document.querySelector('.tabs'); if(!nav) return;
  // remove existing pinned
  nav.querySelectorAll('.tab[data-cat]').forEach(function(b){ b.remove(); });
  state.customTypes.filter(function(c){return !!c.pinned;}).forEach(function(c){
    var b=document.createElement('button');
    b.className='tab'; b.setAttribute('data-cat', c.name); b.textContent=c.name;
    b.addEventListener('click', function(){
      state.filterType=c.name; switchTab('ugovori'); buildTypeChips(true); renderUgovori();
    });
    // insert after Ugovori tab (first)
    var first = document.getElementById('tabUgovori');
    if(first && first.nextSibling){ nav.insertBefore(b, first.nextSibling); } else { nav.appendChild(b); }
  });
}



// v1.2.0 — debug banner when Add clicked
(function(){
  var bar = document.getElementById('js-error');
  if(bar){
    var prev = bar.textContent||'';
    window.__debugAdd = function(msg){
      bar.style.display='block';
      bar.textContent = 'Klik: '+msg;
      setTimeout(function(){ bar.style.display='none'; }, 1500);
    };
  } else {
    window.__debugAdd = function(){};
  }
})();
var _orig_onAdd = window.__onAdd;
window.__onAdd = function(kind){ window.__debugAdd(kind); return _orig_onAdd ? _orig_onAdd(kind) : undefined; };



// v1.2.1 — ensure functions are global for inline calls
window.openUgovorForm = openUgovorForm;
window.openSporazumForm = openSporazumForm;
window.openNarudzbenicaForm = openNarudzbenicaForm;
window.openFakturaForm = openFakturaForm;
window.openKomitentForm = openKomitentForm;
try { var _b=document.getElementById('js-error'); if(_b){ _b.style.display='block'; _b.textContent='Skripta učitana (v1.2.1)'; setTimeout(function(){ _b.style.display='none'; }, 1200); } } catch(e){}

