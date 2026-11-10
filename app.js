"use strict";
/* Verträglich – Oberfläche */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const LS = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ toast("Speichern nicht möglich – Speicher voll?"); } }
};
let toastT;
function toast(m){ const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600); }
const fmtDate = ts => new Date(ts).toLocaleString("de-DE", {day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit"});
const fmtTime = ts => new Date(ts).toLocaleTimeString("de-DE", {hour:"2-digit", minute:"2-digit"});
const REACT = {good:"Gut", unsure:"Weiß nicht", bad:"Schlecht"};
const REACT_DOT = {good:"var(--ok)", unsure:"var(--unk)", bad:"var(--bad)"};
const SRC = {barcode:"Barcode", foto:"Foto", text:"Text", food:"Lebensmittel", recipe:"Rezept"};
const MEALS = {alle:"Alle", fruehstueck:"Frühstück", mittag:"Mittagessen", abend:"Abendessen", snack:"Snack"};
const SENS_TXT_INT = {1:"Nur klare Problemzutaten zählen", 2:"Standard", 3:"Auch „Vorsicht“-Zutaten und kleine Mengen meiden"};
const SENS_TXT_ALL = {1:"Nur enthaltene Zutaten – Spurenhinweise ignorieren", 2:"Standard – Spurenhinweise als Vorsicht", 3:"Streng – auch Spurenhinweise meiden"};
const SENS_TXT = Object.fromEntries(CAT_DEF.map(d => [d.k, d.grp === "all" ? SENS_TXT_ALL : SENS_TXT_INT]));
SENS_TXT.g = {1:"Gluten-/Weizensensitivität: die Menge macht's – Spuren und glutenfreier Hafer ok", 2:"Standard: glutenhaltige Zutaten meiden, Spurenhinweise als Vorsicht", 3:"Zöliakie: streng, auch Spuren und nicht glutenfreier Hafer – glutenfreie Weizenstärke ist erlaubt"};
const SENS_LBL_CAT = {g:["Sensitivität","Standard","Zöliakie"]};
SENS_TXT.t = {1:"Nur eindeutige Tomaten-Zutaten zählen", 2:"Standard – Gewürzmischungen als Vorsicht", 3:"Auch Gewürz- und Gemüsemischungen meiden (könnten Tomate enthalten)"};
const SENS_LBL = ["leicht","mittel","stark"];
const CAT_DESC = Object.fromEntries(CAT_DEF.map(d => [d.k, d.desc]));
const GROUPS = [
  {g:"int", title:"Unverträglichkeiten", hint:"Stoffe, die dein Körper schlecht verarbeitet."},
  {g:"all", title:"Allergien (14 Hauptallergene)", hint:"Die kennzeichnungspflichtigen Allergene der EU – Spurenhinweise werden mitgeprüft."}
];
/* Open Food Facts Allergen-Tags → Kategorien */
const OFF_ALLERGENS = {"en:gluten":"g", "en:milk":"m", "en:eggs":"e", "en:soybeans":"y", "en:nuts":"nu", "en:peanuts":"p", "en:celery":"c", "en:mustard":"u",
  "en:sesame-seeds":"z", "en:fish":"i", "en:crustaceans":"kr", "en:molluscs":"w", "en:lupin":"v", "en:sulphur-dioxide-and-sulphites":"q"};
const ALLERGEN_WORD = {wa:"Weizen", g:"Gluten", m:"Milch", e:"Ei", y:"Soja", nu:"Schalenfrüchte", p:"Erdnüsse", c:"Sellerie", u:"Senf", z:"Sesam", i:"Fisch", kr:"Krebstiere", w:"Weichtiere", v:"Lupine", q:"Sulfite"};

/* ---------- UI-Bausteine ---------- */
const SYM = ["✓","!","✕"];
const SVG = {
  chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  bowl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 13h16a8 8 0 0 1-16 0z"/><path d="M9 9c0-2 2-2 2-4M13 9c0-2 2-2 2-4"/></svg>',
  scan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M7 8v8M10 8v8M13 8v8M16 8v8"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9z"/></svg>',
  starFill:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9z"/></svg>',
  card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h6M7 14h10"/></svg>',
  sos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9.5"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5M4 19h16"/><path d="M8 15l3-4 3 2 5-6"/></svg>'
};
const st = (lv, cls) => `<span class="st lv${lv}${cls ? " " + cls : ""}" aria-hidden="true">${SYM[lv]}</span>`;
const badge = (c, lv) => `<span class="badge lv${lv}" title="${esc(CATS[c])}: ${LABEL[lv]}"><span aria-hidden="true">${esc(CAT[c].short)}</span><span class="sr-only">${esc(CATS[c])}: ${LABEL[lv]}</span></span>`;
const chip = (lv, txt, srTxt) => `<span class="chip lv${lv}"><span class="sym" aria-hidden="true">${SYM[lv]}</span>${txt}${srTxt ? `<span class="sr-only">${srTxt}</span>` : ""}</span>`;
const loadingHtml = t => `<div class="loading"><span class="spin" aria-hidden="true"></span><span>${t}</span></div>`;
const fbHtml = (title, text, actions, icon) => `<div class="fb-title">${icon || SVG.info}<span>${title}</span></div>${text ? `<p>${text}</p>` : ""}${actions ? `<div class="actions">${actions}</div>` : ""}`;
const actBtn = (go, label, primary) => `<button type="button" class="btn btn-sm ${primary ? "btn-primary" : "btn-secondary"}" data-go="${go}">${label}</button>`;
function setFb(el, html, kind){
  if (!html){ el.hidden = true; el.innerHTML = ""; return; }
  el.className = "feedback" + (kind ? " fb-" + kind : "");
  el.innerHTML = html; el.hidden = false;
}

/* ---------- Zustand ---------- */
let profile = {on:Object.fromEntries(KEYS.map(c => [c, ["h","f","g"].includes(c)])), sens:Object.fromEntries(KEYS.map(c => [c, 2])), mine:{}};
let history = [];
let hasStoredProfile = false;

function load(){
  const p = LS.get("vt_profile");
  hasStoredProfile = !!p;
  if (p){
    if (p.on) profile = {on:Object.assign(profile.on, p.on), sens:Object.assign(profile.sens, p.sens||{}), mine:p.mine||{}};
    else { Object.assign(profile.on, {h:!!p.h, f:!!p.f, g:!!p.g}); profile.sens.g = p.gs ? 3 : 2; } // Version 1
  }
  const h = LS.get("vt_history");
  if (h && Array.isArray(h.items)) history = h.items.map(migrateEntry).filter(Boolean);
}
function migrateEntry(e){
  if (!e) return null;
  if (e.raw) return e;
  if (!Array.isArray(e.items)) return null;
  const tr = e.items.find(i => i.trace);
  return {id:e.id, ts:e.ts, name:e.name, src:e.src, code:e.code||null, reaction:null,
    raw:{mode:"label", items:e.items.filter(i => !i.trace).map(i => /^Allergenkennzeichnung/.test(i.name) ? {n:i.name, fix:true} : {n:i.name}), spuren: tr ? tr.name : null}};
}
function saveProfile(){ LS.set("vt_profile", profile); hasStoredProfile = true; if (typeof syncPerson === "function") syncPerson(); }
/* Speichern: Gegessenes, Bewertetes und Beschwerden bleiben (bis 3000), reine Prüfungen nur die letzten 60 */
function saveHistory(){
  let scans = 0;
  history = history.filter(h => (h.eaten || h.reaction || h.src === "symptom") ? true : (++scans <= 60)).slice(0, 3000);
  LS.set("vt_history", {items: history});
}
const isEaten = h => !!(h.eaten || h.reaction);
const activeCats = () => KEYS.filter(c => profile.on[c]);

function addEntry(name, raw, src, code){
  const e = {id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), ts: Date.now(), name, src, code: code||null, raw, reaction: null, who: (typeof people !== "undefined" ? people.active : "main")};
  history.unshift(e); saveHistory();
  return e;
}
function refreshAll(){
  renderSub(); renderFoods(); renderRecipes(); renderDiary(); renderProfile(); renderRecent(); renderShell(); renderFeatures();
  if (sheetCtx && sheetCtx.type === "entry" && $("#shRes")){ const e = history.find(x => x.id === sheetCtx.id); if (e) showResult(e, $("#shRes")); }
}

/* ---------- Ergebnis-Anzeige ---------- */
const W = e => e && e.drink ? {past:"getrunken", Past:"Getrunken", what:"Getrunkenes"} : {past:"gegessen", Past:"Gegessen", what:"Gegessenes"};
function eatenHtml(e){
  const on = isEaten(e), w = W(e);
  return `<div class="eat-mark"><button type="button" class="btn btn-sm ${on ? "btn-primary" : "btn-outline"}" data-eat="${e.id}" aria-pressed="${on}">${on ? "✓ " + w.Past + (e.eatenAt ? " · " + fmtTime(e.eatenAt) : "") : "Ja, " + w.past}</button><span class="hint">${on ? "Zählt fürs Tagebuch." : "Nur " + w.what + " zählt fürs Tagebuch."}</span></div>`;
}
function reactHtml(e, attr){
  attr = attr || (k => `data-react="${k}" data-id="${e.id}"`);
  return `<div class="seg react" role="group" aria-label="Wie hast du es vertragen?">${Object.keys(REACT).map(k =>
    `<button type="button" class="${k}" aria-pressed="${e && e.reaction === k}" ${attr(k)}><span class="dot" style="background:${REACT_DOT[k]}" aria-hidden="true"></span>${REACT[k]}</button>`).join("")}</div>`;
}
function mkButtons(key, name, cur){
  return `<div class="seg mk" role="group" aria-label="Deine Erfahrung mit ${esc(name)}">${["ok","bad"].map(v =>
    `<button type="button" class="${v}" aria-pressed="${cur === v}" data-mk="${v}" data-key="${esc(key)}" data-name="${esc(name)}">${v === "ok" ? "✓ vertrage ich" : "✕ vertrage ich nicht"}</button>`).join("")}</div>`;
}
function mkHtml(i){
  if (!i.key || i.fix) return "";
  return mkButtons(i.key, i.name, i.mine);
}
function metaTxt(i){
  const m = [];
  if (i.pos) m.push("Position " + i.pos);
  if (i.pct != null) m.push(String(i.pct).replace(".", ",") + " %");
  if (i.small) m.push("geringe Menge – zählt weniger" );
  return m.length ? `<div class="ing-meta">${m.join(" · ")}</div>` : "";
}
const worstOf = (i, cats) => Math.max(0, ...cats.map(c => i.lvl[c]));
function showResult(e, el){
  const ev = evaluate(e.raw, P()), cats = ev.cats;
  const relevant = i => i.mine === "bad" || i.mine === "ok" || cats.some(c => i.lvl[c] > 0 || i.r[c] > 0);
  const flagged = ev.items.filter(relevant).sort((a,b) => worstOf(b, cats) - worstOf(a, cats));
  const sortedCats = cats.slice().sort((a,b) => ev.cat[b] - ev.cat[a]);
  const chips = sortedCats.map(c => chip(ev.cat[c], esc(CATS[c]), ": " + LABEL[ev.cat[c]])).join("") +
    (ev.personal ? chip(2, "Persönlich", ": Meiden") : "");
  const ingHtml = i => {
    let lines = cats.filter(c => i.r[c] > 0).map(c =>
      `<li>${badge(c, i.lvl[c])}<span><b>${esc(CATS[c])}</b> – ${esc(i.why[c] || LABEL[i.r[c]])}</span></li>`).join("");
    if (i.mine === "bad") lines += `<li><span class="badge lv2">Ich</span><span>Von dir als „vertrage ich nicht“ markiert</span></li>`;
    if (i.mine === "ok") lines += `<li><span class="badge lv0">Ich</span><span>Von dir als „vertrage ich“ markiert</span></li>`;
    return `<li class="ing"><div class="ing-name">${esc(i.name)}</div>${metaTxt(i)}${lines ? `<ul class="why">${lines}</ul>` : ""}${mkHtml(i)}</li>`;
  };
  const noProfile = !cats.length && !ev.personal;
  el.innerHTML = `
  <div class="verdict v${ev.total}">
    <div class="vi" aria-hidden="true">${SYM[ev.total]}</div>
    <div><p class="vl">${noProfile ? "Kein Profil aktiv" : LABEL[ev.total]}${resultWho()}</p><p class="vn">${esc(e.name)}</p></div>
  </div>
  <p class="reason">${esc(reasonText(ev))}</p>
  ${noProfile ? `<button type="button" class="btn btn-secondary btn-block" data-go="prof">Profil einrichten</button>` : `<div class="chips" aria-label="Bewertung je Kategorie">${chips}</div>`}
  ${resultExtras(e, ev, "top")}
  ${flagged.length ? `<section class="block"><h3 class="block-title">Auffällige Zutaten <span class="n">(${flagged.length})</span></h3><ul class="list">${flagged.map(ingHtml).join("")}</ul></section>` : ""}
  ${resultExtras(e, ev, "bottom")}
  <section class="block">
    <h3 class="block-title">${W(e).Past}? Wie hast du es vertragen?</h3>
    ${eatenHtml(e)}
    ${reactHtml(e)}
    <p class="hint" style="margin-top:6px">Bewertest du es, landet es automatisch im Tagebuch und hilft der Analyse.</p>
  </section>
  <details class="block disc"><summary>${SVG.chev}Alle ${ev.items.length} Zutaten anzeigen</summary><ul class="list">${ev.items.map(i => {
    const bad = cats.filter(c => i.lvl[c] > 0);
    return `<li class="ing"><div class="ing-line"><span class="ing-name">${esc(i.name)}</span>${bad.length ? `<span class="badges">${bad.map(c => badge(c, i.lvl[c])).join("")}</span>` : ""}</div>${metaTxt(i)}${mkHtml(i)}</li>`;
  }).join("")}</ul></details>
  <p class="fine">${esc(SRC[e.src] || "")} · ${fmtDate(e.ts)}${e.code ? " · " + esc(e.code) : ""}<br>Zutaten ohne Treffer in der Regelliste gelten als unproblematisch. Zutaten stehen nach Menge sortiert – weiter hinten und unter 2 % zählen sie weniger (außer bei Gluten, Tomate und Allergenen).</p>`;
  el.onclick = ev2 => {
    const go = ev2.target.closest("[data-go]");
    if (go){ closeSheet(); goView(go.dataset.go); return; }
    if (extrasClick(ev2, e, el, ev)) return;
    handleActions(ev2, () => showResult(e, el));
  };
}
function handleActions(ev, rerender){
  const b = ev.target.closest("[data-react],[data-mk],[data-eat]"); if (!b) return;
  const sel = b.dataset.eat ? `[data-eat="${b.dataset.eat}"]` : b.dataset.react ? `[data-react="${b.dataset.react}"][data-id="${b.dataset.id}"]` : `[data-mk="${b.dataset.mk}"][data-key="${CSS.escape(b.dataset.key)}"]`;
  const scope = b.closest("#sheetIn, .view");
  if (b.dataset.eat){
    const e = history.find(x => x.id === b.dataset.eat); if (!e) return;
    if (isEaten(e)){ e.eaten = false; e.reaction = null; e.eatenAt = null; toast("Aus dem Tagebuch entfernt"); }
    else { e.eaten = true; e.eatenAt = Date.now(); toast("Im Tagebuch als " + W(e).past + " gespeichert"); }
    saveHistory();
  } else if (b.dataset.react){
    const e = history.find(x => x.id === b.dataset.id); if (!e) return;
    e.reaction = e.reaction === b.dataset.react ? null : b.dataset.react;
    if (e.reaction && !e.eaten){ e.eaten = true; e.eatenAt = e.eatenAt || Date.now(); }
    saveHistory(); toast(e.reaction ? "Im Tagebuch gespeichert: " + REACT[e.reaction] : "Bewertung entfernt");
  } else {
    const k = b.dataset.key, v = b.dataset.mk;
    if (profile.mine[k] === v) delete profile.mine[k]; else profile.mine[k] = v;
    saveProfile();
    toast(profile.mine[k] ? `„${b.dataset.name.slice(0,40)}“: ${v === "ok" ? "vertrage ich" : "vertrage ich nicht"}` : "Markierung entfernt");
  }
  rerender(); renderDiary(); renderRecipes(); renderProfile(); renderRecent();
  restoreFocus(scope, sel);
}
function restoreFocus(scope, sel){
  if (!scope) return;
  const n = scope.querySelector(sel); if (n) n.focus({preventScroll:true});
}

/* ---------- Sheet (Ergebnis, Lebensmittel, Tagebuch-Eintrag) ---------- */
let sheetCtx = null, sheetReturn = null;
function openSheet(title, ctx){
  sheetCtx = ctx;
  $("#sheetTitle").textContent = title;
  const s = $("#sheet");
  if (s.hidden){
    sheetReturn = document.activeElement; s.hidden = false; s.classList.remove("on"); void s.offsetWidth; s.classList.add("on");
    document.body.classList.add("lock"); $("#sheetIn").scrollTop = 0; $("#sheetPanel").focus({preventScroll:true});
  }
}
function closeSheet(){
  const s = $("#sheet"); if (s.hidden) return;
  s.hidden = true; s.classList.remove("on"); document.body.classList.remove("lock");
  sheetCtx = null; $("#sheetIn").onclick = null;
  renderDiary(); renderFoods(); renderRecipes(); renderProfile(); renderRecent(); renderShell();
  if (sheetReturn && document.contains(sheetReturn)) sheetReturn.focus({preventScroll:true});
  sheetReturn = null;
}
$("#shClose").addEventListener("click", closeSheet);
$("#sheet").addEventListener("click", e => { if (e.target.id === "sheet") closeSheet(); });
document.addEventListener("keydown", e => {
  if ($("#sheet").hidden) return;
  if (e.key === "Escape"){ closeSheet(); return; }
  if (e.key === "Tab"){
    const f = [...$("#sheetPanel").querySelectorAll("button, [href], input, textarea, summary, [tabindex]:not([tabindex='-1'])")].filter(n => !n.disabled && n.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === $("#sheetPanel"))){ e.preventDefault(); f[f.length-1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length-1]){ e.preventDefault(); f[0].focus(); }
  }
});

function openEntrySheet(h, opts){
  opts = opts || {};
  const inn = $("#sheetIn");
  const isCheck = ["barcode","text","foto"].includes(h.src);
  inn.innerHTML = `${opts.note ? `<div class="feedback fb-warn" style="margin:0 0 var(--s3)">${fbHtml(esc(opts.note), "", "", SVG.warn)}</div>` : ""}<div id="shRes"></div>
    <div class="sheet-actions">
      ${opts.fromCheck ? `<button type="button" class="btn btn-primary btn-block" id="shNext">${SVG.scan}Nächstes Produkt scannen</button>` : ""}
      <button type="button" class="btn btn-danger btn-block" id="shDel">Eintrag löschen</button>
    </div>`;
  openSheet(isCheck ? "Ergebnis" : "Tagebuch-Eintrag", {type:"entry", id:h.id});
  showResult(h, $("#shRes"));
  inn.onclick = ev => {
    if (ev.target.closest("#shNext")){ closeSheet(); goView("check"); startScan(); return; }
    const del = ev.target.closest("#shDel");
    if (del){
      if (del.dataset.c){ history = history.filter(x => x.id !== h.id); saveHistory(); closeSheet(); toast("Eintrag gelöscht"); }
      else { del.dataset.c = "1"; del.classList.add("armed"); del.textContent = "Wirklich löschen? Nochmal tippen"; }
    }
  };
}

/* ---------- Texterkennung (Tesseract.js) ---------- */
const TESS_SRC = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
let ocrWorker = null;
function loadScript(src){
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("script")); document.head.appendChild(s); });
}
async function getOcrWorker(onProg){
  if (ocrWorker) return ocrWorker;
  if (!window.Tesseract) await loadScript(TESS_SRC);
  const base = {logger: m => onProg && onProg(m)};
  try { ocrWorker = await Tesseract.createWorker("deu", 1, base); }
  catch(e){ ocrWorker = await Tesseract.createWorker("deu", 1, Object.assign({}, base, {cacheMethod:"none"})); }
  return ocrWorker;
}
async function prepForOcr(file){
  const url = URL.createObjectURL(file);
  try{
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(2, 2200 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth*s); c.height = Math.round(img.naturalHeight*s);
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
    let min = 255, max = 0;
    for (let i = 0; i < p.length; i += 4){ const g = 0.299*p[i] + 0.587*p[i+1] + 0.114*p[i+2]; p[i] = g; if (g < min) min = g; if (g > max) max = g; }
    const span = Math.max(1, max - min);
    for (let i = 0; i < p.length; i += 4){ const v = Math.max(0, Math.min(255, (p[i]-min) * 255 / span)); p[i] = p[i+1] = p[i+2] = v; }
    ctx.putImageData(d, 0, 0);
    return await new Promise(res => c.toBlob(b => res(b || file), "image/png"));
  } finally { URL.revokeObjectURL(url); }
}
function cleanOcrText(t){
  let s = String(t||"").replace(/-\s*\n\s*/g, "").replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  const m = s.match(/zutaten\s*:?/i); if (m) s = s.slice(m.index);
  return s;
}
function openManual(scroll){
  $("#manual").hidden = false; $("#manualBtn").setAttribute("aria-expanded", "true");
  if (scroll) $("#manual").scrollIntoView({behavior:"smooth", block:"start"});
}
$("#manualBtn").addEventListener("click", () => {
  const open = $("#manual").hidden;
  if (open){ openManual(true); setTimeout(() => $("#txt").focus({preventScroll:true}), 350); }
  else { $("#manual").hidden = true; $("#manualBtn").setAttribute("aria-expanded", "false"); }
});
$("#ocrBtn").addEventListener("click", () => $("#photoOcr").click());
$("#photoOcr").addEventListener("change", async e => {
  const file = e.target.files && e.target.files[0]; e.target.value = "";
  if (!file) return;
  const btn = $("#ocrBtn"), prog = $("#ocrProg"), err = $("#photoErr"); setFb(err, "");
  openManual(true); setFb($("#manualHits"), "");
  const pv = $("#preview"); pv.src = URL.createObjectURL(file); pv.hidden = false;
  btn.disabled = true; btn.setAttribute("aria-busy", "true");
  setFb(prog, loadingHtml(ocrWorker ? "Erkenne Text…" : "Lade Texterkennung (beim ersten Mal einige MB)…"));
  const progTxt = t => { const s = prog.querySelector(".loading span:last-child"); if (s) s.textContent = t; };
  try{
    const w = await getOcrWorker(m => {
      if (m && m.status === "recognizing text") progTxt("Erkenne Text… " + Math.round((m.progress||0)*100) + " %");
      else if (m && m.status && /load/i.test(m.status)) progTxt("Lade Texterkennung… " + Math.round((m.progress||0)*100) + " %");
    });
    const {data} = await w.recognize(await prepForOcr(file));
    const text = cleanOcrText(data && data.text);
    if (text.length < 8){ setFb(prog, ""); setFb(err, fbHtml("Kaum Text erkannt", "Fotografiere die Zutatenliste möglichst gerade, nah und bei gutem Licht – und versuch es noch einmal.", actBtn("ocr", "Neues Foto"), SVG.warn), "err"); return; }
    $("#txt").value = text;
    setFb(prog, fbHtml("Text erkannt", "Prüf kurz auf Lesefehler (z. B. „Sorbit“, „Weizen“) und tippe dann auf <b>Prüfen</b>.", "", SVG.check), "ok");
    $("#txt").scrollIntoView({behavior:"smooth", block:"center"});
    $("#txt").classList.add("hl"); setTimeout(() => $("#txt").classList.remove("hl"), 2500);
  }catch(x){
    ocrWorker = null; setFb(prog, "");
    setFb(err, fbHtml("Texterkennung konnte nicht starten", "Bist du online? Alternativ: Text auf dem Foto mit Live Text kopieren und unten einfügen.", "", SVG.warn), "err");
  }finally{ btn.disabled = false; btn.removeAttribute("aria-busy"); }
});
$("#manual").addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) goAction(g.dataset.go); });

/* ---------- Barcode + Open Food Facts ---------- */
/* Erkennung: natives BarcodeDetector (falls vorhanden), sonst ZXing-C++ als WebAssembly */
const BD_SRC = "https://fastly.jsdelivr.net/npm/barcode-detector@2/dist/es/pure.min.js";
const FORMATS = ["ean_13","ean_8","upc_a","upc_e"];
let detector = null, stream = null, scanning = false, scanTimer = null;
window.info = info;
/* Rückmeldung im Bereich unter der Suche; kind: "", "err", "warn", "list" */
function info(html, kind){ setFb($("#scanInfo"), html, kind); }
function scanStatus(t){ $("#scanStatus").textContent = t; }
async function getDetector(){
  if (detector) return detector;
  try{
    if ("BarcodeDetector" in window){
      const sup = await window.BarcodeDetector.getSupportedFormats();
      if (FORMATS.every(f => sup.includes(f))) return detector = new window.BarcodeDetector({formats: FORMATS});
    }
  }catch(e){}
  const mod = await import(BD_SRC);
  return detector = new mod.BarcodeDetector({formats: FORMATS});
}
function validEan(c){
  if (!/^\d{8}$|^\d{12,13}$/.test(c)) return false;
  const d = c.padStart(13, "0").split("").map(Number);
  const sum = d.slice(0, 12).reduce((s, x, i) => s + x * (i % 2 ? 3 : 1), 0);
  return (10 - sum % 10) % 10 === d[12] || c.length === 8;
}
const ALT_ACTIONS = actBtn("ocr", "Zutatenliste fotografieren") + actBtn("manual", "Selbst eingeben");
async function startScan(){
  info("");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    info(fbHtml("Kein Kamerazugriff in diesem Browser", "Fotografiere den Barcode oder tippe die Nummer ins Suchfeld.", actBtn("bcphoto", "Barcode fotografieren", true), SVG.warn), "warn"); return;
  }
  $("#scanWrap").hidden = false; $("#scanBtn").hidden = true;
  scanStatus("Kamera wird gestartet…");
  const video = $("#video");
  try{
    stream = await navigator.mediaDevices.getUserMedia({audio:false, video:{facingMode:{ideal:"environment"}, width:{ideal:1280}, height:{ideal:720}}});
    if (typeof camExtras === "function") setTimeout(() => camExtras(stream), 300);
    video.srcObject = stream;
    await video.play();
  }catch(e){
    await stopScan();
    const n = e && e.name;
    info(n === "NotAllowedError"
      ? fbHtml("Kamera nicht erlaubt", "iPhone: Einstellungen → Apps → Safari → Kamera auf „Erlauben“ stellen und die Seite neu laden. Oder fotografiere den Barcode.", actBtn("bcphoto", "Barcode fotografieren", true), SVG.warn)
      : fbHtml("Kamera konnte nicht starten", "(" + esc(n || "Fehler") + ") Fotografiere den Barcode oder tippe die Nummer ein.", actBtn("bcphoto", "Barcode fotografieren", true), SVG.warn), "warn");
    return;
  }
  scanStatus("Scanner wird geladen…");
  let det;
  try{ det = await getDetector(); }
  catch(e){ await stopScan(); info(fbHtml("Barcode-Erkennung nicht verfügbar", "Sie konnte nicht geladen werden – bist du online? Tippe die Nummer unter dem Barcode ins Suchfeld.", "", SVG.warn), "warn"); return; }
  scanStatus("Barcode in den Rahmen halten – ca. 15 cm Abstand");
  scanning = true;
  let last = null, busy = false;
  const tick = async () => {
    if (!scanning) return;
    if (!busy && video.readyState >= 2){
      busy = true;
      try{
        const res = await det.detect(video);
        const hit = res.map(r => String(r.rawValue || "").replace(/\D/g, "")).find(validEan);
        if (hit){
          if (hit === last || hit.length === 13){ scanning = false; await stopScan(); lookup(hit); return; }
          last = hit;
        }
      }catch(e){}
      busy = false;
    }
    scanTimer = setTimeout(tick, 120);
  };
  tick();
}
async function stopScan(){
  if (typeof camExtrasOff === "function") camExtrasOff();
  scanning = false; clearTimeout(scanTimer);
  if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; }
  const v = $("#video"); if (v) v.srcObject = null;
  $("#scanWrap").hidden = true; $("#scanBtn").hidden = false;
}
$("#scanBtn").addEventListener("click", startScan);
$("#scanStop").addEventListener("click", () => { stopScan(); $("#scanBtn").focus(); });

/* Fallback: Barcode fotografieren */
$("#bcPhotoBtn").addEventListener("click", () => $("#bcPhoto").click());
$("#bcPhoto").addEventListener("change", async e => {
  const file = e.target.files && e.target.files[0]; e.target.value = "";
  if (!file) return;
  await stopScan();
  info(loadingHtml("Barcode wird gelesen…"));
  try{
    const det = await getDetector();
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    let res = await det.detect(img);
    if (!res.length){
      const c = document.createElement("canvas"), s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      res = await det.detect(c);
    }
    URL.revokeObjectURL(url);
    const hit = res.map(r => String(r.rawValue || "").replace(/\D/g, "")).find(validEan);
    if (hit) lookup(hit);
    else info(fbHtml("Kein Barcode auf dem Foto erkannt", "Fotografiere ihn gerade, scharf und formatfüllend – oder tippe die Nummer ins Suchfeld.", actBtn("bcphoto", "Neues Foto"), SVG.warn), "warn");
  }catch(x){ info(fbHtml("Barcode-Erkennung nicht verfügbar", "Sie konnte nicht geladen werden – bist du online? Tippe die Nummer ins Suchfeld.", "", SVG.warn), "warn"); }
});
$("#eanForm").addEventListener("submit", e => {
  e.preventDefault();
  const v = $("#eanIn").value.trim();
  if (!v){ $("#eanIn").focus(); info(fbHtml("Was suchst du?", "Gib einen Produktnamen (z. B. „Ferrero Nutella“) oder die Nummer unter dem Barcode ein."), ""); return; }
  $("#eanIn").blur();
  if (/^[\d\s-]+$/.test(v)){
    const c = v.replace(/\D/g,"");
    if (c.length >= 8) lookup(c); else info(fbHtml("Nummer unvollständig", "Bitte die komplette Nummer unter dem Barcode eingeben (8–13 Ziffern).", "", SVG.warn), "warn");
  } else searchProducts(v);
});

/* ---------- Produktsuche nach Name (Open Food Facts) ---------- */
const SEARCH_FIELDS = "code,product_name,product_name_de,brands,quantity,ingredients_text_de,ingredients_text,countries_tags";
async function fetchJson(url, ms){
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || 12000);
  try{
    const r = await fetch(url, {signal: ctl.signal});
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}
const brandOf = x => (Array.isArray(x.brands) ? x.brands[0] : String(x.brands || "").split(",")[0]) || "";
const nameOf = x => x.product_name_de || x.product_name || x.product_name_en || "";
/* 1. Neue Volltextsuche (Search-a-licious), 2. alte Suche als Reserve */
async function offSearch(q){
  const errors = [];
  try{
    const p = new URLSearchParams({q, langs:"de,en", page_size:"25"});
    const j = await fetchJson("https://search.openfoodfacts.org/search?" + p.toString(), 10000);
    const list = (j.hits || []).filter(x => x.code && nameOf(x));
    if (list.length) return list;
  }catch(e){ errors.push("Suche neu: " + (e.name === "AbortError" ? "Zeitüberschreitung" : e.message)); }
  try{
    const p = new URLSearchParams({search_terms:q, search_simple:"1", action:"process", json:"1", page_size:"25", fields:SEARCH_FIELDS, lc:"de"});
    const j = await fetchJson("https://world.openfoodfacts.org/cgi/search.pl?" + p.toString(), 15000);
    return (j.products || []).filter(x => x.code && nameOf(x));
  }catch(e){ errors.push("Suche alt: " + (e.name === "AbortError" ? "Zeitüberschreitung" : e.message)); }
  const err = new Error(errors.join(" · ")); err.all = true; throw err;
}
/* Ausgabe dort, wo gesucht wurde: oben unter der Suche oder unten unter „Selbst eingeben“ */
const outEl = where => where === "bottom" ? $("#manualHits") : $("#scanInfo");
async function searchProducts(q, where){
  const el = outEl(where), show = (h, k) => setFb(el, h, k);
  if (where === "bottom") info(""); else setFb($("#manualHits"), "");
  show(loadingHtml("Suche „" + esc(q) + "“ bei Open Food Facts…"));
  let list;
  try{ list = await offSearch(q); }
  catch(e){ show(fbHtml("Suche hat nicht geklappt", "Open Food Facts ist gerade nicht erreichbar oder überlastet. Versuch es gleich noch einmal oder scanne den Barcode.<br><span class=\"meta\">Details: " + esc(e.message) + "</span>", actBtn("retry:" + where + ":" + encodeURIComponent(q), "Nochmal versuchen", true), SVG.warn), "err"); return; }
  const de = x => (x.countries_tags || []).includes("en:germany") ? 0 : 1;
  list.sort((a, b) => de(a) - de(b));
  if (!list.length){ show(fbHtml("Nichts gefunden zu „" + esc(q) + "“", "Versuch es mit Marke und Produkt (z. B. „Ferrero Nutella“), scanne den Barcode oder fotografiere die Zutatenliste.", where === "bottom" ? actBtn("ocr", "Zutatenliste fotografieren") : ALT_ACTIONS), ""); return; }
  show(`<p class="hits-hd">${list.length} Treffer – tippe auf dein Produkt</p><ul class="list hits">` + list.slice(0, 15).map(x => {
    const name = nameOf(x), brand = brandOf(x).trim();
    const ing = x.ingredients_text_de ?? x.ingredients_text;
    const hasIng = ing === undefined ? true : !!String(ing || "").trim();
    const sub = [brand, x.quantity].filter(Boolean).join(" · ") + (hasIng ? "" : " · keine Zutaten hinterlegt");
    return `<li><button type="button" class="row-btn" data-code="${esc(x.code)}" data-where="${where || "top"}"><span class="txt"><b>${esc(name)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span>${SVG.chev}</button></li>`;
  }).join("") + "</ul>", "list");
}
function goAction(go){
  if (go === "ocr") $("#photoOcr").click();
  else if (go === "manual"){ openManual(true); setTimeout(() => $("#txt").focus({preventScroll:true}), 350); }
  else if (go === "bcphoto") $("#bcPhoto").click();
  else if (go === "scan") startScan();
  else if (go.startsWith("retry:")){ const [, w, q] = go.split(":"); searchProducts(decodeURIComponent(q), w === "bottom" ? "bottom" : undefined); }
  else goView(go);
}
function onHitsClick(e){
  const r = e.target.closest("[data-code]"); if (r){ lookup(r.dataset.code, r.dataset.where); return; }
  const g = e.target.closest("[data-go]"); if (g) goAction(g.dataset.go);
}
$("#scanInfo").addEventListener("click", onHitsClick);
$("#manualHits").addEventListener("click", onHitsClick);

const OFF_FIELDS = "product_name,product_name_de,generic_name_de,brands,ingredients_text_de,ingredients_text,allergens_tags,traces_tags,labels_tags,categories_tags,nutriments";
function productName(p, code){
  return [p.brands && String(p.brands).split(",")[0].trim(), p.product_name_de || p.product_name || p.generic_name_de].filter(Boolean).join(" – ") || ("Produkt " + code);
}
/* Open-Food-Facts-Produkt → Bewertungsgrundlage (null, wenn weder Zutaten noch Allergene bekannt) */
function productToRaw(p, code){
  const name = productName(p, code || p.code);
  const txt = (p.ingredients_text_de || p.ingredients_text || "").replace(/_/g, "");
  const labels = p.labels_tags || [], allergens = p.allergens_tags || [], traces = p.traces_tags || [];
  const gf = labels.some(l => /no-gluten|gluten-free|glutenfrei/.test(l));
  const lf = labels.some(l => /no-lactose|lactose-free|laktosefrei/.test(l));
  if (!txt.trim() && !allergens.length) return null;
  const {parts, spuren} = splitIngredients(txt);
  const items = parts.map(n => ({n}));
  const probe = evaluate({mode:"label", items}, {on:Object.fromEntries(KEYS.map(c => [c, true])), sens:{}, mine:{}});
  /* Allergenkennzeichnung als zusätzliche Sicherheitsstufe, falls die Zutatenliste es nicht schon abdeckt */
  for (const tag of allergens){
    const c = OFF_ALLERGENS[tag]; if (!c || (c === "g" && gf)) continue;
    if (probe.items.some(i => i.r[c] >= 2)) continue;
    const x = Object.fromEntries(KEYS.map(k => [k, 0])); x[c] = 2;
    if (c === "m" && !lf) x.l = 1;
    if (c === "g" && !probe.items.some(i => i.r.wa >= 2)) x.wa = 1; /* Gluten laut Kennzeichnung – ob aus Weizen, ist unklar */
    items.push({n:"Allergenkennzeichnung: " + ALLERGEN_WORD[c], fix:true, x, note:"Laut Allergenkennzeichnung enthalten"});
  }
  const trWords = traces.map(t => OFF_ALLERGENS[t]).filter(Boolean).map(c => ALLERGEN_WORD[c]);
  let tr = spuren;
  if (trWords.length) tr = (tr ? tr + " " : "") + "Kann Spuren von " + trWords.join(", ") + " enthalten";
  const cats = p.categories_tags || [];
  const drink = cats.some(c => /beverages|drinks|getraenke/.test(c)) || /(^|\s)(saft|nektar|limonade|cola|eistee|tee|kaffee|wasser|schorle|smoothie|drink|bier|wein|sekt|milch|kakao|energy)(\s|$)/i.test(norm(name).replace(/[^a-z ]/g, " "));
  const nu = p.nutriments || {};
  const lac = nu.lactose_100g ?? nu.lactose_100ml, sug = nu.sugars_100g ?? nu.sugars_100ml;
  return {name, drink, full: !!txt.trim(), raw: {mode:"label", items, spuren: tr, gf, lf, lac: lac == null || lac === "" ? null : +lac, sug: sug == null || sug === "" ? null : +sug}};
}
async function lookup(code, where){
  try{ if (navigator.vibrate) navigator.vibrate(60); }catch(e){}
  const el = outEl(where), show = (h, k) => setFb(el, h, k);
  if (where !== "bottom") $("#eanIn").value = code;
  show(loadingHtml("Suche Produkt " + esc(code) + " …"));
  let j;
  try{
    const r = await fetch("https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json?lc=de&fields=" + OFF_FIELDS);
    j = await r.json();
  }catch(e){
    const old = history.find(h => h.code === code && h.raw);
    if (old){ show(""); const e2 = addEntry(old.name, old.raw, "barcode", code); e2.drink = old.drink; saveHistory(); openEntrySheet(e2, {fromCheck:true, note:"Offline – du siehst den zuletzt gespeicherten Stand vom " + new Date(old.ts).toLocaleDateString("de-DE") + "."}); return e2; }
    show(fbHtml("Keine Verbindung zu Open Food Facts", "Bist du online? Ohne Internet kannst du die Zutatenliste selbst eingeben.", ALT_ACTIONS, SVG.warn), "err"); return; }
  if (!j || j.status !== 1 || !j.product){
    show(fbHtml("Produkt " + esc(code) + " ist noch nicht in Open Food Facts", "Fotografiere die Zutatenliste oder gib sie selbst ein. " +
      '<a href="https://world.openfoodfacts.org/cgi/product.pl?type=add&code=' + esc(code) + '" target="_blank" rel="noopener">Produkt bei Open Food Facts eintragen</a>', ALT_ACTIONS), "warn");
    return;
  }
  const p = j.product;
  const pr = productToRaw(p, code);
  if (!pr){
    const nm = productName(p, code);
    show(fbHtml(esc(nm) + " – ohne Zutatenliste", "Das Produkt ist bekannt, aber die Zutaten fehlen. Fotografiere die Zutatenliste, um es zu prüfen. " +
      '<a href="https://world.openfoodfacts.org/cgi/product.pl?type=edit&code=' + esc(code) + '" target="_blank" rel="noopener">Zutaten bei Open Food Facts ergänzen</a> – das hilft allen.', ALT_ACTIONS), "warn");
    return;
  }
  const name = pr.name, txt = pr.full ? "x" : "";
  show("");
  const note = txt.trim() ? "" : "Nur die Allergenkennzeichnung ist hinterlegt, keine vollständige Zutatenliste – Histamin, Fructose & Co. sind deshalb nicht bewertbar.";
  const e = addEntry(name, pr.raw, "barcode", code);
  if (pr.drink){ e.drink = true; saveHistory(); }
  renderDiary(); renderRecent();
  openEntrySheet(e, {fromCheck:true, note});
  return e;
}

$("#txtBtn").addEventListener("click", () => {
  setFb($("#ocrProg"), ""); setFb($("#photoErr"), "");
  const t = $("#txt").value.trim();
  if (!t){
    const name = $("#txtName").value.trim();
    if (name) searchProducts(name, "bottom");
    else { setFb($("#manualHits"), fbHtml("Noch nichts eingegeben", "Füge die Zutatenliste ein – oder trag nur den Produktnamen ein, dann suchen wir online."), ""); $("#txt").focus(); }
    return;
  }
  const {parts, spuren} = splitIngredients(t);
  if (!parts.length){ setFb($("#manualHits"), fbHtml("Keine Zutaten erkannt", "Trenne die Zutaten mit Kommas, z. B. „Weizenmehl, Zucker, Salz“.", "", SVG.warn), "warn"); return; }
  setFb($("#manualHits"), "");
  const gf = /glutenfrei/i.test($("#txtName").value), lf = /laktosefrei/i.test($("#txtName").value);
  const e = addEntry($("#txtName").value.trim() || "Eigene Eingabe", {mode:"label", items: parts.map(n => ({n})), spuren, gf, lf}, "text");
  renderDiary(); renderRecent();
  openEntrySheet(e, {fromCheck:true});
});

/* Zuletzt geprüft */
function renderRecent(){
  const list = myEntries().filter(h => ["barcode","text","foto"].includes(h.src)).slice(0, 3);
  if (!list.length){ $("#recent").innerHTML = ""; return; }
  $("#recent").innerHTML = `<h2 class="section-title">Zuletzt geprüft</h2><div class="card flush"><ul class="list">${list.map(h => {
    const ev = evaluate(h.raw, P());
    return `<li><button type="button" class="row-btn" data-id="${h.id}">${st(ev.total)}<span class="txt"><b class="ell">${esc(h.name)}</b><small>${LABEL[ev.total]} · ${fmtDate(h.ts)}</small></span>${SVG.chev}</button></li>`;
  }).join("")}</ul></div>`;
}
$("#recent").addEventListener("click", e => { const b = e.target.closest("[data-id]"); if (!b) return; const h = history.find(x => x.id === b.dataset.id); if (h) openEntrySheet(h); });

/* ---------- Lebensmittel ---------- */
let foodCat = "Alle";
function badgesHtml(lv, cats){ return `<span class="badges">${cats.map(c => badge(c, lv[c])).join("")}</span>`; }
function foodLevels(f){ const lv = {}, pp = P(); for (const c of KEYS) lv[c] = finalLevel(c, f[c], false, pp.sens[c]); const k = ingKey(f.n); if (profile.mine[k] === "ok") KEYS.forEach(c => lv[c] = 0); return lv; }
function renderCats(){
  const ks = ["Alle", ...new Set(FOODS.map(f => f.k))];
  $("#cats").innerHTML = ks.map(k => `<button type="button" aria-pressed="${k===foodCat}" data-k="${esc(k)}">${esc(k)}</button>`).join("");
}
$("#cats").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; foodCat = b.dataset.k; renderCats(); renderFoods(); const n = $(`#cats [data-k="${CSS.escape(foodCat)}"]`); if (n) n.focus({preventScroll:true}); });
$("#q").addEventListener("input", () => renderFoods());
$("#q").addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
function renderFoods(){
  const q = norm($("#q").value.trim()), cats = activeCats();
  const list = FOODS.map((f, idx) => ({f, idx, lv: foodLevels(f)}))
    .filter(({f}) => (foodCat === "Alle" || f.k === foodCat) && (!q || norm(f.n).includes(q) || norm(f.note).includes(q)));
  const worst = x => (profile.mine[ingKey(x.f.n)] === "bad") ? 3 : cats.length ? Math.max(...cats.map(c => x.lv[c])) : 0;
  const rank = x => !q ? 0 : norm(x.f.n) === q ? -1 : norm(x.f.n).startsWith(q) ? 0 : norm(x.f.n).split(/[^a-z]+/).some(w => w.startsWith(q)) ? 1 : 2;
  list.sort((a,b) => rank(a) - rank(b) || worst(a) - worst(b) || a.f.n.localeCompare(b.f.n, "de"));
  $("#foodHint").innerHTML = cats.length
    ? `<div class="legend" aria-hidden="true"><span>${st(0,"sm")}verträglich</span><span>${st(1,"sm")}Vorsicht</span><span>${st(2,"sm")}meiden</span></div>`
    : `<div class="feedback" style="margin:var(--s2) 0">${fbHtml("Noch kein Profil aktiv", "Wähle aus, was du nicht verträgst – dann zeigt dir die Liste Ampeln.", actBtn("prof", "Profil einrichten", true))}</div>`;
  $("#foodList").innerHTML = list.length
    ? list.map(({f, idx, lv}) => {
      const m = profile.mine[ingKey(f.n)], w = Math.min(2, worst({f, lv}));
      return `<li><button type="button" class="row-btn food-row" data-i="${idx}">${cats.length || m ? st(m === "ok" ? 0 : w) + `<span class="sr-only">${m === "ok" ? LABEL[0] : LABEL[w]}:</span>` : ""}<span class="txt"><b>${esc(f.n)}</b>${f.note ? `<small>${esc(f.note)}</small>` : ""}${m ? `<span class="flag ${m === "ok" ? "ok" : "bad"}">${m === "ok" ? "✓ vertrage ich" : "✕ vertrage ich nicht"}</span>` : ""}</span>${badgesHtml(lv, cats)}</button></li>`;
    }).join("")
    : `<li class="empty">${SVG.search}<b>Kein Treffer in der Liste</b>Prüf verpackte Produkte lieber über Barcode oder Zutatenliste.<br><button type="button" class="btn btn-secondary" data-go="check">Produkt prüfen</button></li>`;
}
$("#foodList").addEventListener("click", e => {
  const g = e.target.closest("[data-go]"); if (g){ goView(g.dataset.go); return; }
  const row = e.target.closest(".food-row"); if (!row) return;
  const f = FOODS[+row.dataset.i]; if (f) openFoodSheet(f);
});
$("#foodHint").addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) goView(g.dataset.go); });
function openFoodSheet(f){
  const lv = foodLevels(f), key = ingKey(f.n);
  const inn = $("#sheetIn");
  const act = activeCats(), rest = KEYS.filter(c => !profile.on[c]);
  const sorted = act.slice().sort((a,b) => lv[b] - lv[a]);
  const worst = act.length ? Math.max(...act.map(c => lv[c])) : 0;
  const m = profile.mine[key];
  const total = m === "bad" ? 2 : worst;
  inn.innerHTML = `
  <div class="verdict v${total}"><div class="vi" aria-hidden="true">${SYM[total]}</div><div><p class="vl">${act.length || m ? LABEL[total] : "Kein Profil aktiv"}</p><p class="vn">${esc(f.k)}${f.note ? " · " + esc(f.note) : ""}</p></div></div>
  ${act.length ? `<div class="chips" style="margin-top:var(--s3)">${sorted.map(c => chip(lv[c], esc(CATS[c]), ": " + LABEL[lv[c]])).join("")}${m === "bad" ? chip(2, "Persönlich", ": Meiden") : ""}</div>` : ""}
  ${rest.length ? `<details class="disc" style="margin-top:var(--s2)"><summary>${SVG.chev}Weitere Kategorien</summary><div class="chips">${rest.map(c => `<span class="chip off">${badge(c, lv[c])}${esc(CATS[c])}: ${LABEL[lv[c]]}</span>`).join("")}</div></details>` : ""}
  <section class="block"><h3 class="block-title">Deine Erfahrung</h3>${mkButtons(key, f.n, m)}</section>
  ${typeof lacBlock === "function" ? lacBlock({mode:"food", items:[{n:f.n}]}) : ""}
  ${subsHtml(f.n, lv, act)}
  <section class="block"><h3 class="block-title">Heute ${f.k === "Getränke" ? "getrunken" : "gegessen"}?</h3><p class="hint" style="margin:-4px 0 var(--s2)">Trag ein, wie du es vertragen hast – das fließt in die Tagebuch-Analyse ein.</p>
  ${reactHtml(null, k => `data-fr="${k}"`)}</section>`;
  openSheet(f.n, {type:"food"});
  inn.onclick = ev => {
    const fr = ev.target.closest("[data-fr]");
    if (fr){
      const e = addEntry(f.n, {mode:"food", items:[{n:f.n, x:Object.fromEntries(KEYS.map(c => [c, f[c] || 0])), note:f.note}]}, "food");
      e.reaction = fr.dataset.fr; e.eaten = true; e.eatenAt = Date.now(); if (f.k === "Getränke") e.drink = true; saveHistory(); renderDiary(); closeSheet(); toast("Im Tagebuch gespeichert: " + REACT[e.reaction]); return;
    }
    handleActions(ev, () => { openFoodSheet(f); renderFoods(); });
  };
}

/* ---------- Rezepte ---------- */
let meal = "alle";
const recipeEntry = {};
function renderMeals(){ $("#meals").innerHTML = Object.keys(MEALS).map(k => `<button type="button" aria-pressed="${k===meal}" data-m="${k}">${MEALS[k]}</button>`).join(""); }
$("#meals").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; meal = b.dataset.m; renderMeals(); renderRecipes(); const n = $(`#meals [data-m="${meal}"]`); if (n) n.focus({preventScroll:true}); });
$("#showWarn").addEventListener("change", () => renderRecipes());
let rqT; $("#rq").addEventListener("input", () => { clearTimeout(rqT); rqT = setTimeout(renderRecipes, 150); });
$("#rq").addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
/* Rezepte: Suche, täglich wechselnde Vorschläge, Anpassung per Austausch */
let recipeShuffle = 0;
function recipeStatus(r){
  const ev = evaluate(recipeRaw(r), P());
  if (ev.total === 0) return {ev, kind:"fit"};
  const ad = adaptRecipe(r, ev);
  if (ad) return {ev, kind:"adapt", ad};
  return {ev, kind: ev.total === 1 ? "warn" : "no"};
}
function seededOrder(arr, seed){
  let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1e6) / 1e6; };
  const a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}
function recipeCard(x, open){
  const {r, i, ev, kind, ad} = x;
  const swapMap = ad ? Object.fromEntries(ad.swaps.map(s => [s.k, s])) : {};
  const zl = r.z.map((z, k) => { const it = ev.items[k]; const lv = Math.max(0, ...ev.cats.map(c => it.lvl[c])); const sw = swapMap[k];
    return `<li>${sw ? (sw.drop ? `<s>${esc(z.replace(/^~\s*/, ""))}</s> <span class="swap-note">weglassen</span>` : `<b>${esc(swapLabel(sw, z))}</b>${sw.variant && (norm(sw.to).includes(sw.core) || /^glutenfreie/i.test(sw.to)) ? "" : ` <span class="swap-note">statt ${esc(sw.from.replace(AMOUNT_RE, ""))}</span>`}`) : esc(z.replace(/^~\s*/, ""))}${lv && !sw ? `<span class="rflag">${ev.cats.filter(c => it.lvl[c] > 0).map(c => badge(c, it.lvl[c])).join("")}</span>` : ""}</li>`; }).join("");
  const last = recipeEntry[i] && history.find(h => h.id === recipeEntry[i]);
  const lv = kind === "fit" ? 0 : kind === "adapt" ? 0 : ev.total;
  return `<article class="card recipe"><div class="recipe-hd">${st(lv)}<span class="sr-only">${kind === "adapt" ? "für dich angepasst" : LABEL[lv]}:</span><div style="flex:1;min-width:0"><h3>${esc(r.t)}</h3><p class="meta">${r.m.map(m => MEALS[m]).join(" · ")} · ${r.min} Min.${kind === "adapt" ? ` · <span class="tag-rec">angepasst</span>` : ""}</p></div></div>
    ${kind === "adapt" ? `<p class="reason">Für dich angepasst: ${esc(ad.swaps.map(s => s.drop ? s.from.replace(AMOUNT_RE, "") + " weglassen" : s.variant ? swapLabel(s, s.from).replace(AMOUNT_RE, "") : s.to + " statt " + s.from.replace(AMOUNT_RE, "")).join(", "))}</p>` : ev.total ? `<p class="reason">${esc(reasonText(ev))}</p>` : ""}
    <details class="disc" data-i="${i}"${open.has(String(i)) ? " open" : ""}><summary>${SVG.chev}Zutaten &amp; Zubereitung</summary><h4>Zutaten</h4><ul>${zl}</ul><h4>Zubereitung</h4><ol>${(ad ? adaptSteps(r.s, ad.swaps) : r.s.map(esc)).map(s => `<li>${s}</li>`).join("")}</ol>
    ${F("lists") ? `<button type="button" class="btn btn-sm btn-outline" data-shop-r="${i}" style="margin-top:var(--s2)">${SVG.cart}Zutaten auf die Einkaufsliste</button>` : ""}
    <h4>Nachgekocht? Wie hast du es vertragen?</h4>
    ${reactHtml(last || null, k => `data-rr="${k}" data-ri="${i}"`)}</details></article>`;
}
function renderRecipes(){
  const open = new Set([...document.querySelectorAll("#recipeList details[open]")].map(d => d.dataset.i));
  const showWarn = $("#showWarn").checked;
  const q = norm(($("#rq") || {}).value || "").trim();
  const all = RECIPES.map((r, i) => Object.assign({r, i}, recipeStatus(r)))
    .filter(x => meal === "alle" || x.r.m.includes(meal))
    .filter(x => !q || norm(x.r.t + " " + x.r.z.join(" ")).includes(q));
  const ok = x => x.kind === "fit" || x.kind === "adapt" || (showWarn && x.kind === "warn");
  const shown = all.filter(ok), hidden = all.length - shown.length;
  let html = "";
  if (q){
    html = shown.sort((a, b) => (a.kind === "fit" ? 0 : 1) - (b.kind === "fit" ? 0 : 1)).map(x => recipeCard(x, open)).join("");
  } else {
    const day = new Date().toISOString().slice(0, 10);
    const order = seededOrder(shown, day + people.active + meal + recipeShuffle);
    const fit = order.filter(x => x.kind === "fit"), rest = order.filter(x => x.kind !== "fit");
    const picks = fit.slice(0, 3).concat(rest).slice(0, 3);
    const others = order.filter(x => !picks.includes(x));
    if (picks.length) html += `<div class="rec-hd"><h2 class="section-title" style="margin:0">Heute für dich</h2><button type="button" class="btn btn-sm btn-quiet" data-reshuffle>${SVG.shuffle}Andere Vorschläge</button></div>` + picks.map(x => recipeCard(x, open)).join("");
    if (others.length) html += `<h2 class="section-title">Alle passenden Rezepte (${others.length})</h2>` + others.map(x => recipeCard(x, open)).join("");
  }
  $("#recipeList").innerHTML = (html || `<div class="card empty">${SVG.bowl}<b>Keine passenden Rezepte</b>${q ? "Versuch einen anderen Suchbegriff." : hidden ? (showWarn ? "Für diese Mahlzeit passt gerade nichts zu deinem Profil." : "Schalte „Vorsicht“ ein oder wähle eine andere Mahlzeit.") : "Wähle eine andere Mahlzeit."}</div>`) +
    (hidden ? `<p class="meta" style="margin:var(--s3) var(--s1) 0">${hidden} Rezept${hidden>1?"e":""} ausgeblendet, weil sie nicht zu deinem Profil passen${showWarn ? "" : " oder Vorsicht-Zutaten enthalten"}.</p>` : "");
}
$("#recipeList").addEventListener("click", ev => {
  if (ev.target.closest("[data-reshuffle]")){ recipeShuffle++; renderRecipes(); return; }
  const sh = ev.target.closest("[data-shop-r]");
  if (sh){ const rr = RECIPES[+sh.dataset.shopR], st0 = recipeStatus(rr), sw = st0.ad ? Object.fromEntries(st0.ad.swaps.map(x => [x.k, x.drop ? "weglassen" : recipeItem(swapLabel(x, rr.z[x.k])).n])) : {};
    const n = addShop(rr.z.map((z, k) => sw[k] || recipeItem(z).n).filter(x => !/^(salz|pfeffer|wasser|weglassen)/i.test(x))); toast(n ? n + " Zutaten auf die Einkaufsliste gesetzt" : "Steht schon alles auf der Liste"); renderShell(); return; }
  const b = ev.target.closest("[data-rr]"); if (!b) return;
  const i = +b.dataset.ri, r = RECIPES[i];
  let e = recipeEntry[i] && history.find(h => h.id === recipeEntry[i]);
  if (!e){ e = addEntry(r.t, recipeRaw(r), "recipe"); recipeEntry[i] = e.id; }
  e.reaction = e.reaction === b.dataset.rr ? null : b.dataset.rr;
  e.eaten = !!e.reaction || e.eaten; if (e.eaten && !e.eatenAt) e.eatenAt = Date.now();
  saveHistory(); renderRecipes(); renderDiary();
  restoreFocus($("#recipeList"), `[data-rr="${b.dataset.rr}"][data-ri="${i}"]`);
  toast(e.reaction ? "Im Tagebuch gespeichert: " + REACT[e.reaction] : "Bewertung entfernt");
});

/* ---------- Tagebuch + Analyse ---------- */
const VERD = {strong:["Starker Hinweis","p-strong"], possible:["Möglicher Hinweis","p-possible"], none:["Kein Hinweis","p-none"], data:["Zu wenig Daten","p-data"]};
function acatHtml(c, x){
  const [vt, vc] = VERD[x.verdict];
  const pE = Math.round(x.rE * 100), pU = Math.round(x.rU * 100);
  let h = `<div class="acat"><div class="acat-hd"><b>${esc(CATS[c])}</b><span class="pill ${vc}">${vt}</span></div>`;
  if (x.verdict === "data") h += `<p class="meta" style="margin-top:2px">Noch zu wenige Einträge mit und ohne ${esc(CATS[c])}-Zutaten zum Vergleichen.</p>`;
  else h += `<div class="bars" aria-label="Schlecht vertragen: mit ${esc(CATS[c])}-Zutaten ${pE} %, ohne ${pU} %"><span>mit</span><div class="bar"><i style="width:${pE}%;background:var(--bad)"></i></div><span>${pE} %</span><span>ohne</span><div class="bar"><i style="width:${pU}%;background:var(--unk)"></i></div><span>${pU} %</span></div>`;
  if ((x.verdict === "strong" || x.verdict === "possible") && !profile.on[c]) h += `<button type="button" class="btn btn-secondary btn-sm" data-act="${c}" style="margin-top:var(--s2)">${esc(CATS[c])} im Profil aktivieren</button>`;
  if (c === "g" && (x.verdict === "strong" || x.verdict === "possible")) h += `<div class="note warn">Wichtig: Lass eine Zöliakie ärztlich abklären, <b>bevor</b> du dauerhaft auf Gluten verzichtest – sonst ist der Bluttest nicht mehr aussagekräftig.</div>`;
  if ((c === "f" || c === "l") && x.verdict === "strong") h += `<div class="note">Ein H2-Atemtest beim Arzt kann eine ${c === "f" ? "Fruktose" : "Laktose"}-Unverträglichkeit sicher bestätigen.</div>`;
  return h + `</div>`;
}
function dayLabel(ts){
  const d = new Date(ts), t = new Date(); t.setHours(0,0,0,0);
  const d0 = new Date(d); d0.setHours(0,0,0,0);
  const diff = Math.round((t - d0) / 864e5);
  return diff === 0 ? "Heute" : diff === 1 ? "Gestern" : d.toLocaleDateString("de-DE", {weekday:"long", day:"numeric", month:"long", year: d.getFullYear() === t.getFullYear() ? undefined : "numeric"});
}
function renderDiary(){
  const a = analyze(analysisEntries(), P());
  let h = `<div class="card-hd"><h2 class="h2">Analyse</h2>${a.n >= 5 ? `<span class="meta">${a.n} bewertet</span>` : ""}</div>`;
  if (a.n < 5){
    h += `<p class="lead">Bewerte mindestens 5 Sachen, die du gegessen hast, mit <b>Gut</b> oder <b>Schlecht</b> – dann zeigt dir die Analyse Muster.</p>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${a.n}" aria-label="Bewertungen"><i style="width:${a.n * 20}%"></i></div>
      <p class="meta">${a.n} von 5 Bewertungen · ideal sind 20 und mehr, auch gut vertragene Sachen</p>
      <ol class="steps"><li>Produkt prüfen, Lebensmittel oder Rezept wählen</li><li>Nach dem Essen „Wie hast du es vertragen?“ antippen</li></ol>`;
  } else {
    h += `<p class="meta" style="margin-bottom:var(--s2)">${a.bad} davon schlecht vertragen${a.unsure ? ` · ${a.unsure} × „weiß nicht“ nicht berücksichtigt` : ""}</p>`;
    const hint = c => ["strong","possible"].includes(a.cats[c].verdict);
    const main = KEYS.filter(c => profile.on[c] || hint(c)).sort((x, y) => (hint(y) - hint(x)));
    const more = KEYS.filter(c => !main.includes(c) && ["h","f","l","g"].includes(c));
    h += main.length ? main.map(c => acatHtml(c, a.cats[c])).join("") : `<p class="meta">Kein Profil aktiv und keine Auffälligkeiten.</p>`;
    if (more.length) h += `<details class="disc"><summary>${SVG.chev}Weitere Kategorien</summary>${more.map(c => acatHtml(c, a.cats[c])).join("")}</details>`;
    if (a.suspects.length) h += `<section class="block"><h3 class="block-title">Verdächtige Zutaten</h3><p class="hint" style="margin:-4px 0 var(--s1)">Tauchen vor allem bei schlecht Vertragenem auf.</p>` +
      a.suspects.map(s => `<div class="sug"><span class="name">${esc(s.name)} <span class="meta">· ${s.bad}× schlecht, ${s.good}× gut</span></span>${profile.mine[s.key] === "bad" ? '<span class="flag bad meta">✕ markiert</span>' : `<button type="button" class="btn btn-sm btn-outline" data-mk="bad" data-key="${esc(s.key)}" data-name="${esc(s.name)}">vertrage ich nicht</button>`}</div>`).join("") + `</section>`;
    if (a.safe.length) h += `<section class="block"><h3 class="block-title">Gut vertragen</h3>` +
      a.safe.map(s => `<div class="sug"><span class="name">${esc(s.name)} <span class="meta">· ${s.good}× gut</span></span>${profile.mine[s.key] === "ok" ? '<span class="flag ok meta">✓ markiert</span>' : `<button type="button" class="btn btn-sm btn-outline" data-mk="ok" data-key="${esc(s.key)}" data-name="${esc(s.name)}">vertrage ich</button>`}</div>`).join("") + `</section>`;
    h += `<p class="fine">Die Analyse vergleicht, wie oft du Essen mit und ohne bestimmte Zutaten schlecht vertragen hast. Sie ist ein Hinweis, keine Diagnose – sprich Auffälligkeiten mit deiner Ärztin oder deinem Arzt ab.</p>`;
  }
  const openMore = $("#analysis details[open]");
  if (a.n >= 5) h += diaryAnalysisExtras();
  h += diaryAnalysisActions();
  $("#analysis").innerHTML = h;
  $("#analysisTools").innerHTML = diaryExtrasTop();
  if (openMore){ const d = $("#analysis details"); if (d) d.open = true; }

  const el = $("#histList");
  const derivedMap = Object.fromEntries(analysisEntries().filter(x => x.derived).map(x => [x.id, x.reaction]));
  const mineE = myEntries().filter(x => x.src === "symptom" || isEaten(x));
  if (!mineE.length){ el.innerHTML = `<div class="card empty">${SVG.book}<b>Noch keine Einträge</b>Was du gegessen hast, landet hier – tippe dafür im Ergebnis auf „Ja, gegessen“ oder bewerte es.<br><button type="button" class="btn btn-secondary" data-go="check">Erstes Produkt prüfen</button></div>`; return; }
  let out = "", lastDay = "";
  for (const x of mineE){
    const day = dayLabel(x.ts);
    if (day !== lastDay){ out += (lastDay ? "</ul>" : "") + `<div class="day">${esc(day)}</div><ul class="list">`; lastDay = day; }
    if (x.src === "symptom"){ out += symptomRowHtml(x); continue; }
    const ev = evaluate(x.raw, P());
    const dr = derivedMap[x.id];
    const rx = x.reaction ? `<span class="rx ${x.reaction}">${REACT[x.reaction]}</span>` : dr ? `<span class="rx ${dr} derived">${REACT[dr]} (aus Beschwerden)</span>` : `<span class="rx none">Noch nicht bewertet</span>`;
    out += `<li><button type="button" class="row-btn hist" data-id="${x.id}">${st(ev.total)}<span class="sr-only">${LABEL[ev.total]}:</span><span class="txt"><b class="ell">${esc(x.name)}</b><small>${fmtTime(x.eatenAt || x.ts)} · ${SRC[x.src]||""} · ${rx}</small></span>${SVG.chev}</button></li>`;
  }
  el.innerHTML = `<div class="card flush">${out}</ul></div>`;
}
$("#analysis").addEventListener("click", ev => {
  const act = ev.target.closest("[data-act]");
  if (act){ profile.on[act.dataset.act] = true; saveProfile(); toast(CATS[act.dataset.act] + " im Profil aktiviert"); refreshAll(); return; }
  handleActions(ev, () => {});
});
$("#histList").addEventListener("click", e => {
  const g = e.target.closest("[data-go]"); if (g){ goView(g.dataset.go); return; }
  const row = e.target.closest(".hist"); if (!row) return;
  const h = history.find(x => x.id === row.dataset.id); if (!h) return;
  if (h.src === "symptom") openSymptomEntry(h); else openEntrySheet(h);
});

/* ---------- Profil ---------- */
function renderProfile(){
  $("#profCats").innerHTML = GROUPS.map(G => {
    const cs = CAT_DEF.filter(d => d.grp === G.g), n = cs.filter(d => profile.on[d.k]).length;
    return `<section class="card" aria-labelledby="grp-${G.g}">
      <div class="group-hd"><h2 class="h2" id="grp-${G.g}">${G.title}</h2><span class="count">${n ? n + " aktiv" : "keine aktiv"}</span></div>
      <p class="hint" style="margin-top:2px">${G.hint}</p>
      <ul class="cat-list">${cs.map(d => { const c = d.k, on = profile.on[c]; return `
        <li class="cat-row">
          <label class="cat-toggle"><span class="txt"><b>${esc(d.n)}</b><small>${esc(CAT_DESC[c])}</small></span><span class="sw"><input type="checkbox" role="switch" data-on="${c}"${on ? " checked" : ""}><span></span></span></label>
          ${on ? `<div class="sens"><div class="seg" role="radiogroup" aria-label="Empfindlichkeit ${esc(d.n)}">${[1,2,3].map(s => `<button type="button" role="radio" aria-checked="${profile.sens[c]===s}" data-sens="${c}" data-s="${s}">${(SENS_LBL_CAT[c] || SENS_LBL)[s-1]}</button>`).join("")}</div><p class="sens-hint">${esc(SENS_TXT[c][profile.sens[c]])}</p>${c === "l" && typeof lacOptsHtml === "function" ? lacOptsHtml() : ""}</div>` : ""}
        </li>`; }).join("")}</ul>
    </section>`;
  }).join("");
  const m = Object.entries(profile.mine);
  $("#mineList").innerHTML = m.length
    ? m.sort((a,b) => a[0].localeCompare(b[0])).map(([k, v]) => `<div class="mine-row"><span class="name">${esc(k)}</span><span class="flag ${v === "ok" ? "ok" : "bad"}" style="font-size:var(--fs-sm)">${v==="ok"?"✓ vertrage ich":"✕ vertrage ich nicht"}</span><button type="button" class="icon-btn" data-del="${esc(k)}" aria-label="${esc(k)} entfernen">${SVG.x}</button></div>`).join("")
    : `<p class="meta">Noch keine. Markiere Zutaten im Ergebnis oder in der Lebensmittel-Liste.</p>`;
}
$("#profCats").addEventListener("change", e => {
  const c = e.target.dataset.on; if (!c) return;
  profile.on[c] = e.target.checked; saveProfile(); refreshAll();
  restoreFocus($("#profCats"), `[data-on="${c}"]`);
});
$("#profCats").addEventListener("click", e => {
  const b = e.target.closest("[data-sens]"); if (!b) return;
  profile.sens[b.dataset.sens] = +b.dataset.s; saveProfile(); refreshAll();
  restoreFocus($("#profCats"), `[data-sens="${b.dataset.sens}"][data-s="${b.dataset.s}"]`);
});
$("#mineList").addEventListener("click", e => { const b = e.target.closest("[data-del]"); if (!b) return; delete profile.mine[b.dataset.del]; saveProfile(); refreshAll(); toast("Markierung entfernt"); });
function renderSub(){
  const a = activeCats(), max = 4;
  const p = $("#profPill");
  p.setAttribute("aria-label", a.length ? "Dein Profil: " + a.map(c => CATS[c]).join(", ") + ". Ändern" : "Kein Profil aktiv. Profil einrichten");
  const nm = (typeof F === "function" && F("family") && people.list.length > 1) ? `<span class="pname">${esc(personName())}</span>` : "";
  p.innerHTML = a.length
    ? `${SVG.user}${nm}<span class="codes" aria-hidden="true">${a.slice(0, max).map(c => `<span class="badge">${esc(CAT[c].short)}</span>`).join("")}${a.length > max ? `<span class="badge">+${a.length - max}</span>` : ""}</span>`
    : `${SVG.user}${nm}<span aria-hidden="true">Profil wählen</span>`;
}
$("#profPill").addEventListener("click", () => { if (F("family") && people.list.length > 1) openPeopleSheet(); else goView("prof"); });

/* ---------- Onboarding ---------- */
let onbStep = 1, onbSel = new Set(), onbFeat = new Set(), onbFromProfile = false;
function showOnb(fromProfile){
  onbFromProfile = !!fromProfile;
  onbSel = new Set(fromProfile ? activeCats() : []);
  onbStep = 1; renderOnb(); $("#onb").hidden = false; document.body.classList.add("lock");
}
function closeOnb(){ $("#onb").hidden = true; document.body.classList.remove("lock"); }
function renderOnb(){
  const o = $("#onb");
  const dots = `<div class="onb-steps" aria-label="Schritt ${onbStep} von 3"><i class="on"></i><i class="${onbStep >= 2 ? "on" : ""}"></i><i class="${onbStep === 3 ? "on" : ""}"></i></div>`;
  if (onbStep === 1){
    o.innerHTML = `<div class="onb-in"><div class="onb-body">
      <img class="logo" src="icon-192.png" alt="">
      <h1 id="onbTitle" tabindex="-1">Willkommen bei Verträglich</h1>
      <p class="lead">Scanne Lebensmittel und sieh sofort, ob sie zu dir passen – bei Unverträglichkeiten und Allergien.</p>
      <ul class="feat">
        <li><span class="ico">${SVG.scan}</span><span><b>Prüfen in Sekunden</b><span>Barcode scannen oder Zutatenliste fotografieren – mit Ampel und Begründung.</span></span></li>
        <li><span class="ico">${SVG.bowl}</span><span><b>Passende Rezepte</b><span>Nur Gerichte, die zu deinem Profil passen.</span></span></li>
        <li><span class="ico">${SVG.chart}</span><span><b>Tagebuch mit Analyse</b><span>Erkennt Muster in dem, was du schlecht verträgst.</span></span></li>
      </ul>
      <p class="hint" style="margin-top:var(--s5)">Deine Daten bleiben nur auf diesem Gerät.</p>
    </div>
    <div class="onb-foot"><button type="button" class="btn btn-primary btn-lg btn-block" data-onb="next">Los geht’s</button><button type="button" class="btn-link" data-onb="skip">Überspringen</button></div></div>`;
  } else if (onbStep === 3){
    const rec = recommendFeatures([...onbSel]);
    o.innerHTML = `<div class="onb-in"><div class="onb-body">${dots}
      <h1 id="onbTitle" tabindex="-1">Was möchtest du nutzen?</h1>
      <p class="lead">Wir haben passend zu deiner Auswahl etwas vorgeschlagen. Die App zeigt nur, was du einschaltest – ändern kannst du das jederzeit im Profil unter „Funktionen“.</p>
      <h2>Empfohlen für dich</h2>
      <ul class="cat-list onb-feat">${featureListHtml(onbFeat, null, f => rec.has(f.k))}</ul>
      <details class="disc onb-more"><summary>${SVG.chev}Weitere Funktionen (${FEATURES.filter(f => !rec.has(f.k)).length})</summary>
        <ul class="cat-list onb-feat">${featureListHtml(onbFeat, null, f => !rec.has(f.k))}</ul></details>
    </div>
    <div class="onb-foot"><button type="button" class="btn btn-primary btn-lg btn-block" data-onb="finish">Fertig – los geht’s</button><button type="button" class="btn-link" data-onb="back">Zurück</button></div></div>`;
  } else {
    const grp = G => `<h2>${G.title}</h2><div class="pick" role="group" aria-label="${G.title}">${CAT_DEF.filter(d => d.grp === G.g).map(d =>
      `<button type="button" aria-pressed="${onbSel.has(d.k)}" data-pick="${d.k}">${SVG.check}${esc(d.n)}</button>`).join("")}</div>`;
    const n = onbSel.size;
    o.innerHTML = `<div class="onb-in"><div class="onb-body">${dots}
      <h1 id="onbTitle" tabindex="-1">Was verträgst du nicht?</h1>
      <p class="lead">Wähle alles aus, was auf dich zutrifft. Feinjustieren und ändern kannst du es jederzeit im Profil.</p>
      ${GROUPS.map(grp).join("")}
      <details class="disc onb-more"><summary>${SVG.chev}Gluten oder Weizen – was passt zu mir?</summary>
        <ul class="steps" style="margin-top:var(--s2)">
          <li><b>Zöliakie</b> (Autoimmunerkrankung): „Gluten“ wählen, im Profil Stufe „Zöliakie“ – streng, auch Spuren.</li>
          <li><b>Gluten-/Weizensensitivität</b>: „Gluten“ wählen, Stufe „Sensitivität“ – die Menge macht's.</li>
          <li><b>Weizenallergie</b> (echte Allergie): „Weizenallergie“ wählen – Roggen und Gerste gehen oft, glutenfreie Weizenstärke aber nicht.</li>
          <li>Probleme mit Weizen<b>brot</b>, aber nicht mit Weizen<b>stärke</b>? Oft stecken Fruktane dahinter – dann „FODMAP“.</li>
        </ul>
        <p class="hint">Verdacht auf Zöliakie? Lass dich testen, <b>bevor</b> du Gluten weglässt – sonst ist der Test nicht mehr aussagekräftig.</p></details>
    </div>
    <div class="onb-foot"><button type="button" class="btn btn-primary btn-lg btn-block" data-onb="done"${n ? "" : ' aria-disabled="true"'}>${n ? `${onbFromProfile ? "Fertig" : "Weiter"} – ${n} ausgewählt` : "Wähle mindestens eins aus"}</button><button type="button" class="btn-link" data-onb="skip">Später einrichten</button></div></div>`;
  }
  const t = $("#onbTitle"); if (t) t.focus({preventScroll:true});
  o.scrollTop = 0;
}
$("#onb").addEventListener("change", e => {
  const t = e.target.closest("[data-feat]"); if (!t) return;
  const k = t.dataset.feat;
  if (t.checked){ onbFeat.add(k); if (FEAT[k].needs) onbFeat.add(FEAT[k].needs); }
  else { onbFeat.delete(k); FEATURES.filter(f => f.needs === k).forEach(f => onbFeat.delete(f.k)); }
  $$("#onb [data-feat]").forEach(i => i.checked = onbFeat.has(i.dataset.feat));
});
$("#onb").addEventListener("click", e => {
  const p = e.target.closest("[data-pick]");
  if (p){
    const k = p.dataset.pick; onbSel.has(k) ? onbSel.delete(k) : onbSel.add(k);
    p.setAttribute("aria-pressed", onbSel.has(k));
    const d = $('#onb [data-onb="done"]'), n = onbSel.size;
    d.textContent = n ? `${onbFromProfile ? "Fertig" : "Weiter"} – ${n} ausgewählt` : "Wähle mindestens eins aus";
    if (n) d.removeAttribute("aria-disabled"); else d.setAttribute("aria-disabled", "true");
    return;
  }
  const b = e.target.closest("[data-onb]"); if (!b) return;
  const a = b.dataset.onb;
  if (a === "next"){ onbStep = 2; renderOnb(); }
  else if (a === "skip"){ if (!hasStoredProfile) saveProfile(); closeOnb(); refreshAll(); toast("Dein Profil kannst du jederzeit unter „Profil“ einrichten"); }
  else if (a === "done"){
    if (!onbSel.size){ toast("Tippe auf alles, was du nicht verträgst"); return; }
    KEYS.forEach(c => profile.on[c] = onbSel.has(c));
    saveProfile();
    if (onbFromProfile){ closeOnb(); goView("check"); refreshAll(); toast("Profil gespeichert"); return; }
    const rec = recommendFeatures([...onbSel]);
    onbFeat = new Set(FEATURES.map(f => f.k).filter(k => rec.has(k)));
    onbStep = 3; renderOnb();
  }
  else if (a === "back"){ onbStep = 2; renderOnb(); }
  else if (a === "finish"){
    FEATURES.forEach(f => settings.features[f.k] = onbFeat.has(f.k));
    settings.newHint = false; saveSettings();
    closeOnb(); goView("check"); refreshAll();
    toast("Fertig – scanne dein erstes Produkt");
    $("#scanBtn").focus({preventScroll:true});
  }
});
$("#onbAgain").addEventListener("click", () => showOnb(true));

/* ---------- Navigation ---------- */
const TITLES = {check:"Prüfen", eat:"Essen", diary:"Tagebuch", sos:"Notfall", prof:"Ich"};
function goView(v){
  if (v === "foods" || v === "recipes"){ eatSection = v; v = "eat"; }
  if (!TITLES[v]) return;
  if (v === "eat") renderEat();
  if (v === "sos") renderSos();
  $$(".tabbar button").forEach(x => { if (x.dataset.v === v) x.setAttribute("aria-current", "page"); else x.removeAttribute("aria-current"); });
  $$(".view").forEach(s => s.classList.toggle("on", s.id === "v-" + v));
  $("#viewTitle").textContent = TITLES[v];
  document.title = TITLES[v] + " – Verträglich";
  if (v !== "check") stopScan();
  window.scrollTo(0, 0);
}
$$(".tabbar button").forEach(b => b.addEventListener("click", () => goView(b.dataset.v)));

/* Start: siehe features.js */
