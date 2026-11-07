"use strict";
/* Verträglich – Zusatzfunktionen als Module.
   Jede Funktion ist einzeln an-/abschaltbar (Einstieg + Profil → Funktionen).
   Abhängigkeiten: app.js (UI-Bausteine, Zustand), engine.js, config.js */

/* ================= Funktionskatalog ================= */
const FEATURES = [
  {k:"foods",        n:"Lebensmittel-Liste",       d:"Über 140 Lebensmittel mit Ampel nachschlagen", tab:true},
  {k:"recipes",      n:"Rezepte",                  d:"Gerichte, die zu deinem Profil passen", tab:true},
  {k:"diary",        n:"Tagebuch & Analyse",       d:"Bewerte, was du gegessen hast – die App erkennt Muster", tab:true},
  {k:"symptoms",     n:"Symptome erfassen",        d:"Beschwerden mit Stärke und Uhrzeit, dazu Stress, Schlaf & Co. – erkennt auch verzögerte Reaktionen", needs:"diary"},
  {k:"report",       n:"Bericht für den Arzt",     d:"Tagebuch und Analyse als PDF oder Tabelle teilen", needs:"diary"},
  {k:"alternatives", n:"Alternativen vorschlagen", d:"Bei roten Produkten verträgliche Alternativen finden"},
  {k:"lists",        n:"Favoriten & Einkaufsliste",d:"Sichere Produkte merken und Einkäufe planen"},
  {k:"family",       n:"Mehrere Profile",          d:"Für Familie oder Partner – sieh sofort, für wen ein Produkt passt"},
  {k:"program",      n:"Ernährungsprogramm",       d:"Schritt für Schritt durch Karenz-, Test- und Dauerphase"},
  {k:"card",         n:"Allergiekarte",            d:"Zeig im Restaurant, was du nicht verträgst – in 6 Sprachen"},
  {k:"emergency",    n:"Notfall",                  d:"Notfallplan, Notfallkontakt und Ablaufdatum deines Adrenalin-Pens"},
].filter(f => !APP_CONFIG.features[f.k] || APP_CONFIG.features[f.k].available !== false);
const FEAT = Object.fromEntries(FEATURES.map(f => [f.k, f]));
const DEFAULT_FEATURES = {foods:true, recipes:true, diary:true};

let settings = {features: Object.assign({}, DEFAULT_FEATURES), newHint: true, program: null, emergency: {}, cardLang: "en"};
function loadSettings(){
  const s = LS.get("vt_settings");
  if (s) settings = Object.assign(settings, s, {features: Object.assign({}, s.features || DEFAULT_FEATURES)});
  else settings.newHint = hasStoredProfile || history.length > 0; // bestehende Nutzer: Hinweis auf neue Funktionen
}
function saveSettings(){ LS.set("vt_settings", settings); }
/* Ist eine Funktion aktiv? (inkl. Abhängigkeit) */
function F(k){
  if (!FEAT[k]) return false;
  if (!settings.features[k]) return false;
  const n = FEAT[k].needs; return n ? F(n) : true;
}
/* Empfehlungen passend zum Profil */
function recommendFeatures(cats){
  const r = new Set(["foods","recipes","diary"]);
  if (cats.some(c => CAT[c] && CAT[c].grp === "all")){ r.add("card"); r.add("emergency"); }
  if (cats.some(c => ["h","o","f","s"].includes(c))) r.add("program");
  if (cats.some(c => ["h","o"].includes(c))) r.add("symptoms");
  return r;
}

/* ================= Mehrere Profile ================= */
let people = {active:"main", list:[{id:"main", name:"Ich"}]};
function loadPeople(){
  const p = LS.get("vt_people");
  if (p && Array.isArray(p.list) && p.list.length){
    people = p;
    const me = people.list.find(x => x.id === people.active) || people.list[0];
    people.active = me.id;
    if (me.profile) profile = normProfile(me.profile);
  }
  syncPerson();
}
function normProfile(p){
  return {on: Object.assign(Object.fromEntries(KEYS.map(c => [c, false])), p.on || {}),
          sens: Object.assign(Object.fromEntries(KEYS.map(c => [c, 2])), p.sens || {}), mine: p.mine || {}};
}
function syncPerson(){
  const me = people.list.find(x => x.id === people.active);
  if (me) me.profile = JSON.parse(JSON.stringify(profile));
  LS.set("vt_people", people);
}
const personName = () => (people.list.find(x => x.id === people.active) || {}).name || "Ich";
const myEntries = () => history.filter(h => (h.who || "main") === people.active);
function switchPerson(id){
  syncPerson();
  const p = people.list.find(x => x.id === id); if (!p) return;
  people.active = id; profile = normProfile(p.profile || {}); LS.set("vt_profile", profile); syncPerson();
  refreshAll(); toast("Profil: " + p.name);
}

/* Profil, mit dem bewertet wird – im Programm (Karenzphase) strenger */
function P(){
  const prg = settings.program;
  if (!F("program") || !prg || prg.phase !== 1 || prg.who !== people.active) return profile;
  const def = PROGRAMS[prg.type]; if (!def) return profile;
  const q = {on: Object.assign({}, profile.on), sens: Object.assign({}, profile.sens), mine: profile.mine};
  q.on[def.cat] = true; q.sens[def.cat] = 3;
  return q;
}

/* ================= Symptome ================= */
const SYMPTOMS = [["bloat","Blähbauch"],["pain","Bauchschmerzen"],["diarrhea","Durchfall"],["nausea","Übelkeit"],["heartburn","Sodbrennen"],
  ["headache","Kopfschmerzen"],["skin","Haut (Rötung, Juckreiz)"],["nose","Nase/Augen (Schnupfen, Niesen)"],["heart","Herzrasen"],["tired","Müdigkeit"]];
const FACTORS = [["stress","Stress"],["sleep","Schlecht geschlafen"],["period","Periode"],["meds","Medikamente"],["sport","Sport"],["alcohol","Alkohol"]];
const SYM_N = Object.fromEntries(SYMPTOMS), FAC_N = Object.fromEntries(FACTORS);
const SEV = ["–","leicht","mittel","stark"];

/* Für die Analyse: Reaktionen aus Symptomen ableiten (0,5–8 h nach dem Essen) */
function analysisEntries(){
  const mine = myEntries().filter(h => h.src !== "symptom");
  if (!F("symptoms")) return mine;
  const sym = myEntries().filter(h => h.src === "symptom");
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  return mine.map(h => {
    if (h.reaction) return h;
    const after = sym.filter(s => !s.free && s.ts > h.ts + 30*60e3 && s.ts <= h.ts + 8*3600e3);
    const sev = Math.max(0, ...after.map(s => s.sev || 0));
    if (sev >= 2) return Object.assign({}, h, {reaction:"bad", derived:true});
    if (sev === 1) return h;
    if (sym.some(s => s.free && sameDay(s.ts, h.ts))) return Object.assign({}, h, {reaction:"good", derived:true});
    return h;
  });
}
function openSymptomSheet(){
  const inn = $("#sheetIn");
  const sel = {}, fac = new Set();
  const now = new Date(Date.now() - new Date().getTimezoneOffset()*60e3).toISOString().slice(0,16);
  inn.innerHTML = `
    <p class="hint" style="margin-top:0">Wähle aus, was du gerade hast, und wie stark. Die Analyse verknüpft es mit dem, was du in den Stunden davor gegessen hast.</p>
    <ul class="list sym-list">${SYMPTOMS.map(([k, n]) => `<li class="sym-row"><span class="name">${n}</span>
      <div class="seg sym-seg" role="radiogroup" aria-label="${n}">${[0,1,2,3].map(v => `<button type="button" role="radio" aria-checked="${v===0}" data-sym="${k}" data-v="${v}">${SEV[v]}</button>`).join("")}</div></li>`).join("")}</ul>
    <h3 class="block-title" style="margin-top:var(--s4)">Begleitumstände <span class="n">(optional)</span></h3>
    <div class="pick sm">${FACTORS.map(([k, n]) => `<button type="button" aria-pressed="false" data-fac="${k}">${SVG.check}${n}</button>`).join("")}</div>
    <label class="label" for="symTime">Zeitpunkt</label><input class="input" type="datetime-local" id="symTime" value="${now}">
    <label class="label" for="symNote">Notiz <span class="opt">(optional)</span></label><input class="input" type="text" id="symNote" autocomplete="off">
    <div class="sheet-actions"><button type="button" class="btn btn-primary btn-block" id="symSave">Speichern</button></div>`;
  openSheet("Beschwerden eintragen", {type:"symptom"});
  inn.onclick = ev => {
    const s = ev.target.closest("[data-sym]");
    if (s){ sel[s.dataset.sym] = +s.dataset.v; inn.querySelectorAll(`[data-sym="${s.dataset.sym}"]`).forEach(b => b.setAttribute("aria-checked", b === s)); return; }
    const f = ev.target.closest("[data-fac]");
    if (f){ const k = f.dataset.fac; fac.has(k) ? fac.delete(k) : fac.add(k); f.setAttribute("aria-pressed", fac.has(k)); return; }
    if (ev.target.closest("#symSave")){
      const sym = Object.fromEntries(Object.entries(sel).filter(([, v]) => v > 0));
      if (!Object.keys(sym).length){ toast("Wähle mindestens eine Beschwerde aus"); return; }
      const t = Date.parse($("#symTime").value) || Date.now();
      addSymptomEntry({sym, factors:[...fac], note: $("#symNote").value.trim(), ts: t});
      closeSheet(); toast("Beschwerden gespeichert");
    }
  };
}
function addSymptomEntry(o){
  const sev = Math.max(0, ...Object.values(o.sym || {}));
  const name = o.free ? "Beschwerdefrei" : "Beschwerden: " + Object.keys(o.sym).map(k => SYM_N[k]).join(", ");
  const e = addEntry(name, {mode:"food", items:[]}, "symptom");
  Object.assign(e, {ts: o.ts || e.ts, sym: o.sym || {}, factors: o.factors || [], note: o.note || "", sev, free: !!o.free});
  history.sort((a, b) => b.ts - a.ts); saveHistory();
  return e;
}
function symptomRowHtml(x){
  const desc = x.free ? "Keine Beschwerden" : Object.entries(x.sym || {}).map(([k, v]) => `${SYM_N[k]} (${SEV[v]})`).join(", ");
  const fac = (x.factors || []).map(k => FAC_N[k]).join(", ");
  return `<li><button type="button" class="row-btn hist" data-id="${x.id}"><span class="st ${x.free ? "lv0" : x.sev >= 2 ? "lv2" : "lv1"}" aria-hidden="true">${x.free ? "✓" : "!"}</span><span class="txt"><b class="ell">${x.free ? "Beschwerdefrei" : "Beschwerden"}</b><small>${fmtTime(x.ts)} · ${esc(desc)}${fac ? " · " + esc(fac) : ""}</small></span>${SVG.chev}</button></li>`;
}
function openSymptomEntry(x){
  const inn = $("#sheetIn");
  inn.innerHTML = `<p class="lead" style="margin-top:0">${esc(fmtDate(x.ts))}</p>
    ${x.free ? `<p>Keine Beschwerden an diesem Tag.</p>` : `<ul class="list">${Object.entries(x.sym || {}).map(([k, v]) => `<li class="ing"><div class="ing-line"><span class="ing-name">${SYM_N[k]}</span><span class="pill ${v >= 3 ? "p-strong" : v === 2 ? "p-possible" : "p-data"}">${SEV[v]}</span></div></li>`).join("")}</ul>`}
    ${(x.factors || []).length ? `<p class="meta" style="margin-top:var(--s3)">Begleitumstände: ${esc(x.factors.map(k => FAC_N[k]).join(", "))}</p>` : ""}
    ${x.note ? `<p class="meta">Notiz: ${esc(x.note)}</p>` : ""}
    <div class="sheet-actions"><button type="button" class="btn btn-danger btn-block" id="shDel">Eintrag löschen</button></div>`;
  openSheet(x.free ? "Beschwerdefrei" : "Beschwerden", {type:"symptomEntry"});
  inn.onclick = ev => {
    const del = ev.target.closest("#shDel"); if (!del) return;
    if (del.dataset.c){ history = history.filter(h => h.id !== x.id); saveHistory(); closeSheet(); toast("Eintrag gelöscht"); }
    else { del.dataset.c = "1"; del.classList.add("armed"); del.textContent = "Wirklich löschen? Nochmal tippen"; }
  };
}
/* Begleitfaktoren: wie oft bei Beschwerden vs. ohne */
function factorStats(){
  const sym = myEntries().filter(h => h.src === "symptom");
  const bad = sym.filter(s => !s.free && s.sev >= 2), calm = sym.filter(s => s.free || s.sev < 2);
  if (bad.length < 3) return [];
  return FACTORS.map(([k, n]) => ({n, b: bad.filter(s => (s.factors||[]).includes(k)).length, c: calm.filter(s => (s.factors||[]).includes(k)).length}))
    .filter(x => x.b >= 2 && x.b / bad.length >= 0.4).sort((a, b) => b.b - a.b)
    .map(x => ({...x, nb: bad.length, nc: calm.length}));
}
function diaryExtrasTop(){
  if (!F("symptoms") && !F("report")) return "";
  return `<div class="quick">${F("symptoms") ? `<button type="button" class="btn btn-secondary" data-fx="symptom">${SVG.warn}Beschwerden eintragen</button><button type="button" class="btn btn-outline" data-fx="free">${SVG.check}Heute beschwerdefrei</button>` : ""}
    ${F("report") ? `<button type="button" class="btn btn-outline" data-fx="report">${SVG.book}Bericht für den Arzt</button>` : ""}</div>`;
}
function diaryAnalysisExtras(){
  if (!F("symptoms")) return "";
  const fs = factorStats();
  const derived = analysisEntries().filter(h => h.derived).length;
  let h = "";
  if (derived) h += `<p class="meta" style="margin-top:var(--s2)">${derived} Bewertung${derived > 1 ? "en" : ""} automatisch aus deinen Beschwerden abgeleitet (0,5–8 Stunden nach dem Essen).</p>`;
  if (fs.length) h += `<section class="block"><h3 class="block-title">Begleitumstände bei Beschwerden</h3>` +
    fs.map(x => `<div class="sug"><span class="name">${esc(x.n)} <span class="meta">· bei ${x.b} von ${x.nb} Beschwerden${x.nc ? `, ${x.c} von ${x.nc} ohne` : ""}</span></span></div>`).join("") +
    `<p class="hint">Nicht jede Beschwerde kommt vom Essen – Stress oder Schlaf spielen oft mit.</p></section>`;
  return h;
}

/* ================= Arztbericht ================= */
function openReportSheet(){
  const inn = $("#sheetIn");
  inn.innerHTML = `<p class="hint" style="margin-top:0">Erstellt eine Übersicht aus Profil, Analyse und Tagebuch – zum Ausdrucken, als PDF sichern oder als Tabelle teilen.</p>
    <label class="label">Zeitraum</label>
    <div class="seg" role="radiogroup" aria-label="Zeitraum" id="repDays">${[14,30,90,365].map((d, i) => `<button type="button" role="radio" aria-checked="${i===1}" data-days="${d}">${d === 365 ? "1 Jahr" : d + " Tage"}</button>`).join("")}</div>
    <div class="sheet-actions">
      <button type="button" class="btn btn-primary btn-block" id="repPdf">${SVG.book}Als PDF / Drucken</button>
      <button type="button" class="btn btn-secondary btn-block" id="repCsv">Als Tabelle (CSV) teilen</button>
    </div>
    <p class="fine">Tipp fürs iPhone: Im Druckmenü auf „Teilen“ tippen, dann kannst du das PDF z. B. per Mail schicken oder in „Dateien“ sichern.</p>`;
  openSheet("Bericht für den Arzt", {type:"report"});
  let days = 30;
  inn.onclick = ev => {
    const d = ev.target.closest("[data-days]");
    if (d){ days = +d.dataset.days; inn.querySelectorAll("[data-days]").forEach(b => b.setAttribute("aria-checked", b === d)); return; }
    if (ev.target.closest("#repPdf")){ buildReport(days); try{ window.print(); }catch(e){ toast("Drucken wird hier nicht unterstützt"); } return; }
    if (ev.target.closest("#repCsv")) shareCsv(days);
  };
}
function reportEntries(days){ const from = Date.now() - days * 864e5; return myEntries().filter(h => h.ts >= from); }
function buildReport(days){
  const list = reportEntries(days), a = analyze(analysisEntries(), P()), cats = activeCats();
  const row = h => {
    if (h.src === "symptom") return `<tr><td>${fmtDate(h.ts)}</td><td>${h.free ? "Beschwerdefrei" : "Beschwerden"}</td><td>${esc(h.free ? "" : Object.entries(h.sym||{}).map(([k, v]) => SYM_N[k] + " (" + SEV[v] + ")").join(", "))}${(h.factors||[]).length ? "<br><i>" + esc(h.factors.map(k => FAC_N[k]).join(", ")) + "</i>" : ""}</td><td></td></tr>`;
    const ev = evaluate(h.raw, P());
    return `<tr><td>${fmtDate(h.ts)}</td><td>${esc(SRC[h.src] || "")}</td><td>${esc(h.name)}${ev.total ? "<br><i>" + esc(reasonText(ev)) + "</i>" : ""}</td><td>${h.reaction ? REACT[h.reaction] : ""}</td></tr>`;
  };
  const verd = c => ({strong:"starker Hinweis", possible:"möglicher Hinweis", none:"kein Hinweis", data:"zu wenig Daten"})[a.cats[c].verdict];
  $("#printArea").innerHTML = `
    <h1>Ernährungs- und Symptomtagebuch</h1>
    <p>${esc(personName())} · Zeitraum: letzte ${days} Tage (bis ${new Date().toLocaleDateString("de-DE")}) · erstellt mit ${esc(APP_CONFIG.name)}</p>
    <h2>Profil</h2>
    <p>${cats.length ? cats.map(c => esc(CATS[c]) + " (" + SENS_LBL[profile.sens[c]-1] + ")").join(", ") : "keine Angaben"}</p>
    ${Object.keys(profile.mine).length ? `<p>Eigene Markierungen: ${Object.entries(profile.mine).map(([k, v]) => esc(k) + (v === "ok" ? " (verträglich)" : " (unverträglich)")).join(", ")}</p>` : ""}
    <h2>Auswertung</h2>
    ${a.n >= 5 ? `<p>${a.n} bewertete Einträge, davon ${a.bad} schlecht vertragen.</p><ul>${KEYS.filter(c => profile.on[c] || ["strong","possible"].includes(a.cats[c].verdict)).map(c => `<li>${esc(CATS[c])}: ${verd(c)} (schlecht vertragen mit: ${Math.round(a.cats[c].rE*100)} %, ohne: ${Math.round(a.cats[c].rU*100)} %)</li>`).join("")}</ul>
      ${a.suspects.length ? `<p>Auffällige Zutaten: ${a.suspects.map(s => esc(s.name) + " (" + s.bad + "× schlecht, " + s.good + "× gut)").join(", ")}</p>` : ""}` : `<p>Noch zu wenige Bewertungen für eine Auswertung.</p>`}
    <p class="small">Hinweis: Statistische Auffälligkeiten aus Selbstbeobachtung, keine Diagnose.</p>
    <h2>Einträge (${list.length})</h2>
    <table><thead><tr><th>Datum</th><th>Art</th><th>Was</th><th>Vertragen</th></tr></thead><tbody>${list.map(row).join("")}</tbody></table>`;
}
async function shareCsv(days){
  const q = s => '"' + String(s ?? "").replace(/"/g, '""') + '"';
  const rows = [["Datum","Uhrzeit","Art","Was","Vertragen","Beschwerden","Begleitumstände","Bewertung App"]];
  for (const h of reportEntries(days).slice().reverse()){
    const d = new Date(h.ts);
    if (h.src === "symptom") rows.push([d.toLocaleDateString("de-DE"), fmtTime(h.ts), h.free ? "Beschwerdefrei" : "Beschwerden", "", "", Object.entries(h.sym||{}).map(([k, v]) => SYM_N[k] + " (" + SEV[v] + ")").join("; "), (h.factors||[]).map(k => FAC_N[k]).join("; "), ""]);
    else { const ev = evaluate(h.raw, P()); rows.push([d.toLocaleDateString("de-DE"), fmtTime(h.ts), SRC[h.src] || "", h.name, h.reaction ? REACT[h.reaction] : "", "", "", LABEL[ev.total]]); }
  }
  const csv = "﻿" + rows.map(r => r.map(q).join(";")).join("\r\n");
  const file = new File([csv], "tagebuch-vertraeglich.csv", {type:"text/csv"});
  try{
    if (navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:"Tagebuch"}); return; }
  }catch(e){ if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ================= Produkt → Bewertung (für Alternativen) ================= */
const OFF_PFIELDS = "code,product_name,product_name_de,generic_name_de,brands,ingredients_text_de,ingredients_text,allergens_tags,traces_tags,labels_tags";
async function findAlternatives(e, out){
  const show = (h, k) => { setFb(out, h, k); out.classList.add("alt-out"); };
  show( loadingHtml("Suche Alternativen…"));
  try{
    const pj = await fetchJson(APP_CONFIG.data.off + "/api/v2/product/" + encodeURIComponent(e.code) + ".json?fields=categories_tags", 12000);
    const tags = (pj.product && pj.product.categories_tags) || [];
    if (!tags.length){ show(fbHtml("Keine Kategorie bekannt", "Für dieses Produkt ist bei Open Food Facts keine Kategorie hinterlegt."), "warn"); return; }
    let found = [];
    for (const cat of tags.slice(-2).reverse()){
      const p = new URLSearchParams({categories_tags: cat, countries_tags_en: "germany", fields: OFF_PFIELDS, page_size: "60", sort_by: "unique_scans_n"});
      const j = await fetchJson(APP_CONFIG.data.off + "/api/v2/search?" + p.toString(), 15000);
      for (const prod of (j.products || [])){
        if (!prod.code || prod.code === e.code || found.some(f => f.code === prod.code)) continue;
        const pr = productToRaw(prod); if (!pr || !pr.full) continue;
        const ev = evaluate(pr.raw, P());
        if (ev.total < e._total) found.push({code: prod.code, name: pr.name, total: ev.total});
      }
      if (found.filter(f => f.total === 0).length >= 3) break;
    }
    found.sort((a, b) => a.total - b.total);
    found = found.slice(0, 6);
    if (!found.length){ show(fbHtml("Keine besseren Alternativen gefunden", "In derselben Kategorie gibt es bei Open Food Facts gerade nichts, das besser zu deinem Profil passt."), ""); return; }
    out.className = "alt-out"; out.hidden = false;
    out.innerHTML = `<ul class="list">${found.map(f => `<li><button type="button" class="row-btn" data-alt-code="${esc(f.code)}">${st(f.total)}<span class="txt"><b class="ell">${esc(f.name)}</b><small>${LABEL[f.total]} für dein Profil</small></span>${SVG.chev}</button></li>`).join("")}</ul>`;
  }catch(err){ show(fbHtml("Suche nicht möglich", "Open Food Facts ist gerade nicht erreichbar. Versuch es später noch einmal.", "", SVG.warn), "err"); }
}

/* ================= Favoriten & Einkaufsliste ================= */
let lists = LS.get("vt_lists") || {fav: [], shop: []};
function saveLists(){ LS.set("vt_lists", lists); }
const isFav = e => lists.fav.some(f => (e.code && f.code === e.code) || (!e.code && f.name === e.name));
function toggleFav(e){
  if (isFav(e)){ lists.fav = lists.fav.filter(f => !((e.code && f.code === e.code) || (!e.code && f.name === e.name))); toast("Aus Favoriten entfernt"); }
  else { lists.fav.unshift({id: e.id, name: e.name, code: e.code || null, raw: e.raw, ts: Date.now()}); toast("Zu Favoriten hinzugefügt"); }
  saveLists();
}
function addShop(items){
  let n = 0;
  for (const t of items){ const s = String(t).trim(); if (s && !lists.shop.some(x => !x.done && x.t.toLowerCase() === s.toLowerCase())){ lists.shop.push({id: Date.now().toString(36) + Math.random().toString(36).slice(2,5), t: s, done: false}); n++; } }
  saveLists(); return n;
}
function openListsSheet(tab){
  tab = tab || "fav";
  const inn = $("#sheetIn");
  const favHtml = lists.fav.length
    ? `<ul class="list">${lists.fav.map(f => { const ev = evaluate(f.raw, P()); return `<li class="fav-row"><button type="button" class="row-btn" data-fav-open="${esc(f.id)}">${st(ev.total)}<span class="txt"><b class="ell">${esc(f.name)}</b><small>${LABEL[ev.total]}</small></span></button><button type="button" class="icon-btn" data-fav-shop="${esc(f.id)}" aria-label="${esc(f.name)} auf die Einkaufsliste">${SVG.cart}</button><button type="button" class="icon-btn" data-fav-del="${esc(f.id)}" aria-label="${esc(f.name)} entfernen">${SVG.x}</button></li>`; }).join("")}</ul>`
    : `<div class="empty">${SVG.star}<b>Noch keine Favoriten</b>Tippe im Ergebnis auf „Merken“, um sichere Produkte hier zu sammeln.</div>`;
  const open = lists.shop.filter(x => !x.done), done = lists.shop.filter(x => x.done);
  const shopRow = x => `<li class="shop-row"><label><input type="checkbox" data-shop-id="${x.id}"${x.done ? " checked" : ""}><span>${esc(x.t)}</span></label><button type="button" class="icon-btn" data-shop-del="${x.id}" aria-label="${esc(x.t)} löschen">${SVG.x}</button></li>`;
  const shopHtml = `<form class="searchrow" id="shopForm" action="#"><div class="field" style="padding-left:0"><label for="shopIn" class="sr-only">Artikel hinzufügen</label><input class="input" id="shopIn" type="text" placeholder="Artikel hinzufügen" autocomplete="off" enterkeyhint="done" style="padding-left:var(--s3)"></div><button class="btn btn-secondary" type="submit">Hinzufügen</button></form>
    ${open.length ? `<ul class="list">${open.map(shopRow).join("")}</ul>` : (done.length ? "" : `<div class="empty">${SVG.cart}<b>Einkaufsliste ist leer</b>Füge Artikel hinzu – oder übernimm Zutaten aus einem Rezept.</div>`)}
    ${done.length ? `<details class="disc"><summary>${SVG.chev}Erledigt (${done.length})</summary><ul class="list">${done.map(shopRow).join("")}</ul><button type="button" class="btn btn-sm btn-outline" id="shopClear" style="margin-top:var(--s2)">Erledigte löschen</button></details>` : ""}`;
  inn.innerHTML = `<div class="seg" role="tablist" aria-label="Listen" style="margin-bottom:var(--s3)"><button type="button" role="tab" aria-selected="${tab==="fav"}" aria-pressed="${tab==="fav"}" data-ltab="fav">Favoriten (${lists.fav.length})</button><button type="button" role="tab" aria-selected="${tab==="shop"}" aria-pressed="${tab==="shop"}" data-ltab="shop">Einkaufsliste (${open.length})</button></div>
    <div>${tab === "fav" ? favHtml : shopHtml}</div>`;
  openSheet("Favoriten & Einkaufsliste", {type:"lists"});
  const sf = $("#shopForm");
  if (sf) sf.onsubmit = ev => { ev.preventDefault(); const v = $("#shopIn").value; if (addShop([v])){ openListsSheet("shop"); setTimeout(() => { const i = $("#shopIn"); if (i) i.focus(); }, 0); } };
  inn.onchange = ev => { const c = ev.target.closest("[data-shop-id]"); if (!c) return; const x = lists.shop.find(s => s.id === c.dataset.shopId); if (x){ x.done = c.checked; saveLists(); setTimeout(() => openListsSheet("shop"), 150); } };
  inn.onclick = ev => {
    const t = ev.target.closest("[data-ltab]"); if (t){ openListsSheet(t.dataset.ltab); return; }
    const o = ev.target.closest("[data-fav-open]");
    if (o){ const f = lists.fav.find(x => x.id === o.dataset.favOpen); if (!f) return;
      if (f.code){ closeSheet(); lookup(f.code); } else { const e = addEntry(f.name, f.raw, "text"); openEntrySheet(e, {fromCheck:true}); } return; }
    const fs = ev.target.closest("[data-fav-shop]");
    if (fs){ const f = lists.fav.find(x => x.id === fs.dataset.favShop); if (f){ addShop([f.name]) ? toast("Auf die Einkaufsliste gesetzt") : toast("Steht schon auf der Liste"); } return; }
    const fd = ev.target.closest("[data-fav-del]");
    if (fd){ lists.fav = lists.fav.filter(x => x.id !== fd.dataset.favDel); saveLists(); openListsSheet("fav"); return; }
    const sd = ev.target.closest("[data-shop-del]");
    if (sd){ lists.shop = lists.shop.filter(x => x.id !== sd.dataset.shopDel); saveLists(); openListsSheet("shop"); return; }
    if (ev.target.closest("#shopClear")){ lists.shop = lists.shop.filter(x => !x.done); saveLists(); openListsSheet("shop"); }
  };
}

/* ================= Ergebnis-Erweiterungen ================= */
function resultExtras(e, ev){
  let h = "";
  if (F("lists") && e.src !== "symptom"){
    const f = isFav(e);
    h += `<div class="quick" style="margin-top:var(--s3)"><button type="button" class="btn btn-outline btn-sm" data-fx="fav" aria-pressed="${f}">${f ? SVG.starFill + "Gemerkt" : SVG.star + "Merken"}</button><button type="button" class="btn btn-outline btn-sm" data-fx="shop">${SVG.cart}Auf die Einkaufsliste</button></div>`;
  }
  if (F("family") && people.list.length > 1){
    const others = people.list.filter(p => p.id !== people.active);
    h += `<section class="block"><h3 class="block-title">Für die anderen</h3><div class="chips">${others.map(p => {
      const pe = evaluate(e.raw, normProfile(p.profile || {})); const none = !pe.cats.length && !pe.personal;
      return chip(none ? 0 : pe.total, esc(p.name), ": " + (none ? "kein Profil" : LABEL[pe.total]));
    }).join("")}</div></section>`;
  }
  if (F("alternatives") && ev.total > 0 && e.code){
    h += `<section class="block"><h3 class="block-title">Bessere Alternativen</h3><p class="hint" style="margin:-4px 0 var(--s2)">Ähnliche Produkte aus derselben Kategorie, die besser zu deinem Profil passen.</p>
      <button type="button" class="btn btn-secondary btn-block" data-fx="alt">${SVG.search}Alternativen suchen</button><div class="alt-out" hidden></div></section>`;
  }
  return h;
}
/* Klicks auf Ergebnis-Erweiterungen; true = behandelt */
function extrasClick(ev, e, el, ev0){
  const alt = ev.target.closest("[data-alt-code]");
  if (alt){ lookup(alt.dataset.altCode); return true; }
  const b = ev.target.closest("[data-fx]"); if (!b) return false;
  const a = b.dataset.fx;
  if (a === "fav"){ toggleFav(e); showResult(e, el); return true; }
  if (a === "shop"){ addShop([e.name]) ? toast("Auf die Einkaufsliste gesetzt") : toast("Steht schon auf der Liste"); return true; }
  if (a === "alt"){ e._total = ev0.total; b.hidden = true; findAlternatives(e, el.querySelector(".alt-out")); return true; }
  return false;
}

/* ================= Ernährungsprogramm ================= */
const PROGRAMS = {
  fodmap: {n:"Low-FODMAP", cat:"o", phases:[
      {n:"Eliminationsphase", dur:"2–6 Wochen", min:14, d:"Iss möglichst nur, was bei FODMAP grün ist. Die App bewertet in dieser Phase streng. Ziel: Die Beschwerden lassen deutlich nach."},
      {n:"Wiedereinführung", dur:"ca. 6–8 Wochen", d:"Teste die FODMAP-Gruppen einzeln: 3 Tage lang steigende Mengen eines Testlebensmittels (klein, mittel, normal), danach 2–3 Tage Pause mit Low-FODMAP-Kost."},
      {n:"Personalisierung", dur:"dauerhaft", d:"Iss wieder alles, was du gut vertragen hast. Meide nur, was in der Testphase Beschwerden gemacht hat."}],
    tests:[["fructose","Fruktose","z. B. Honig oder Mango"],["lactose","Laktose","z. B. Milch oder Joghurt"],["sorbitol","Sorbit","z. B. Brombeeren oder Avocado"],["mannitol","Mannit","z. B. Champignons oder Blumenkohl"],
      ["fructan_grain","Fruktane aus Getreide","z. B. Weizenbrot"],["fructan_onion","Fruktane aus Zwiebel","z. B. Zwiebel"],["fructan_garlic","Fruktane aus Knoblauch","z. B. Knoblauch"],["gos","GOS (Hülsenfrüchte)","z. B. Kichererbsen oder Linsen"]]},
  histamin: {n:"Histaminarm", cat:"h", phases:[
      {n:"Karenzphase", dur:"10–14 Tage", min:10, d:"Histaminarm essen: frisch und unverarbeitet. Gereiftes, Fermentiertes, Alkohol und Histaminliberatoren weglassen. Die App bewertet in dieser Phase streng."},
      {n:"Testphase", dur:"bis zu 6 Wochen", d:"Führe einzelne Lebensmittel nacheinander wieder ein und beobachte 1–2 Tage, wie du reagierst."},
      {n:"Dauerernährung", dur:"dauerhaft", d:"Abwechslungsreich essen und nur meiden, was du nachweislich schlecht verträgst."}],
    tests:[["cheese","Gereifter Käse","z. B. alter Gouda, Parmesan"],["tomato","Tomate","erst frische Tomate, dann Tomatenmark"],["citrus","Zitrusfrüchte","z. B. Orange"],["cocoa","Kakao/Schokolade",""],
      ["nuts","Nüsse","z. B. Walnuss, Cashew"],["fermented","Fermentiertes","z. B. Sauerkraut, Sojasauce"],["cured","Gereifte Wurst","z. B. Salami"],["strawberry","Erdbeeren",""]]},
  fruktose: {n:"Fruktosearm", cat:"f", phases:[
      {n:"Karenzphase", dur:"ca. 2 Wochen", min:14, d:"Fruktose- und sorbitarm essen, damit sich der Darm beruhigt. Die App bewertet in dieser Phase streng."},
      {n:"Testphase", dur:"ca. 6–8 Wochen", d:"Obst und Gemüse einzeln wieder einführen und die verträgliche Menge herausfinden. Tipp: Obst zusammen mit Eiweiß oder Fett essen."},
      {n:"Dauerernährung", dur:"dauerhaft", d:"Die für dich verträgliche Menge Fruktose genießen – meide nur, was dir nicht bekommt."}],
    tests:[["apple","Apfel",""],["pear","Birne",""],["honey","Honig",""],["juice","Fruchtsaft",""],["stone","Steinobst","z. B. Kirsche, Pflaume (Sorbit)"],["dried","Trockenobst",""],["onion","Zwiebel/Knoblauch","Fruktane"]]}
};
const daysSince = ts => Math.floor((Date.now() - ts) / 864e5) + 1;
function programCardHtml(){
  const prg = settings.program;
  if (!F("program") || !prg || prg.who !== people.active || !PROGRAMS[prg.type]) return "";
  const def = PROGRAMS[prg.type], ph = def.phases[prg.phase - 1];
  const day = daysSince(prg.phaseStart || prg.start);
  const running = Object.values(prg.tests || {}).find(t => t.state === "running");
  return `<button type="button" class="card prog-card" data-fx="program">
    <span class="prog-steps" aria-hidden="true">${def.phases.map((_, i) => `<i class="${i < prg.phase ? "on" : ""}"></i>`).join("")}</span>
    <span class="txt"><small>${esc(def.n)} · Phase ${prg.phase} von 3</small><b>${esc(ph.n)} · Tag ${day}</b>${running ? `<small>Test läuft: ${esc((def.tests.find(t => t[0] === running.k) || [])[1] || "")}</small>` : `<small>${esc(ph.dur)}</small>`}</span>${SVG.chev}</button>`;
}
function openProgramSheet(){
  const inn = $("#sheetIn"), prg = settings.program;
  if (!prg || !PROGRAMS[prg.type] || prg.who !== people.active){
    inn.innerHTML = `<p class="hint" style="margin-top:0">Ein Programm führt dich in drei Phasen zu deiner persönlichen Ernährung: erst weglassen, dann gezielt testen, dann dauerhaft nur meiden, was dir nicht bekommt.</p>
      <ul class="list">${Object.entries(PROGRAMS).map(([k, d]) => `<li><button type="button" class="row-btn" data-prg-start="${k}"><span class="txt"><b>${esc(d.n)}</b><small>${d.phases.map(p => p.n + " (" + p.dur + ")").join(" → ")}</small></span>${SVG.chev}</button></li>`).join("")}</ul>
      <p class="fine">Am besten begleitet von einer Ernährungsfachkraft. Bei Verdacht auf Zöliakie oder Allergien zuerst ärztlich abklären lassen.</p>`;
  } else {
    const def = PROGRAMS[prg.type], ph = def.phases[prg.phase - 1], day = daysSince(prg.phaseStart || prg.start);
    const tests = prg.tests || {};
    const tState = k => (tests[k] || {}).state || "open";
    const testHtml = prg.phase < 2 ? "" : `<section class="block"><h3 class="block-title">Tests</h3><p class="hint" style="margin:-4px 0 var(--s2)">Immer nur eins zur Zeit. Über 3 Tage die Menge steigern, dann bewerten. Allergene nie ohne ärztliche Rücksprache testen.</p>
      <ul class="list">${def.tests.map(([k, n, ex]) => { const s = tState(k), t = tests[k];
        const lbl = s === "ok" ? `<span class="pill p-none">vertragen</span>` : s === "bad" ? `<span class="pill p-strong">Beschwerden</span>` : s === "running" ? `<span class="pill p-possible">Tag ${daysSince(t.start)}</span>` : "";
        const act = s === "running" ? `<div class="quick"><button type="button" class="btn btn-sm btn-secondary" data-test-res="ok" data-k="${k}">Gut vertragen</button><button type="button" class="btn btn-sm btn-outline" data-test-res="bad" data-k="${k}">Beschwerden</button></div>`
          : s === "open" && !Object.values(tests).some(x => x.state === "running") ? `<button type="button" class="btn btn-sm btn-outline" data-test-start="${k}">Test starten</button>` : (s === "ok" || s === "bad") ? `<button type="button" class="btn-link sm" data-test-reset="${k}">zurücksetzen</button>` : "";
        return `<li class="ing"><div class="ing-line"><span class="ing-name">${esc(n)}</span>${lbl}</div>${ex ? `<div class="ing-meta">${esc(ex)}</div>` : ""}${act}</li>`; }).join("")}</ul></section>`;
    const okN = def.tests.filter(([k]) => tState(k) === "ok").length, badN = def.tests.filter(([k]) => tState(k) === "bad").length;
    const summary = prg.phase === 3 ? `<section class="block"><h3 class="block-title">Dein Ergebnis</h3><p>${okN} Gruppen vertragen, ${badN} mit Beschwerden.</p>
      ${badN ? `<p class="hint">Meide vor allem: ${esc(def.tests.filter(([k]) => tState(k) === "bad").map(t => t[1]).join(", "))}.</p>` : `<p class="hint">Alles gut vertragen – du kannst die Empfindlichkeit für ${esc(CATS[def.cat])} im Profil auf „leicht“ stellen.</p>`}</section>` : "";
    const canNext = prg.phase < 3;
    inn.innerHTML = `<div class="prog-head"><span class="prog-steps" aria-hidden="true">${def.phases.map((_, i) => `<i class="${i < prg.phase ? "on" : ""}"></i>`).join("")}</span>
        <p class="meta">${esc(def.n)} · Phase ${prg.phase} von 3 · Tag ${day}</p><h3 class="h2">${esc(ph.n)} <span class="meta">(${esc(ph.dur)})</span></h3><p>${esc(ph.d)}</p></div>
      ${testHtml}${summary}
      <div class="sheet-actions">
        ${canNext ? `<button type="button" class="btn btn-primary btn-block" data-prg-next>${prg.phase === 1 ? "Weiter zur Testphase" : "Weiter zur Dauerphase"}</button>${ph.min && day < ph.min ? `<p class="hint" style="text-align:center">Empfohlen sind mindestens ${ph.min} Tage – du bist bei Tag ${day}.</p>` : ""}` : ""}
        ${prg.phase > 1 ? `<button type="button" class="btn btn-outline btn-block" data-prg-back>Eine Phase zurück</button>` : ""}
        <button type="button" class="btn btn-danger btn-block" data-prg-end>Programm beenden</button>
      </div>`;
  }
  openSheet("Ernährungsprogramm", {type:"program"});
  inn.onclick = ev => {
    const s = ev.target.closest("[data-prg-start]");
    if (s){ settings.program = {type: s.dataset.prgStart, who: people.active, start: Date.now(), phaseStart: Date.now(), phase: 1, tests: {}};
      saveSettings(); refreshAll(); openProgramSheet(); toast(PROGRAMS[s.dataset.prgStart].n + " gestartet"); return; }
    const p = settings.program; if (!p) return;
    if (ev.target.closest("[data-prg-next]")){ p.phase = Math.min(3, p.phase + 1); p.phaseStart = Date.now(); saveSettings(); refreshAll(); openProgramSheet(); return; }
    if (ev.target.closest("[data-prg-back]")){ p.phase = Math.max(1, p.phase - 1); p.phaseStart = Date.now(); saveSettings(); refreshAll(); openProgramSheet(); return; }
    const end = ev.target.closest("[data-prg-end]");
    if (end){ if (end.dataset.c){ settings.program = null; saveSettings(); closeSheet(); refreshAll(); toast("Programm beendet"); } else { end.dataset.c = "1"; end.classList.add("armed"); end.textContent = "Wirklich beenden? Nochmal tippen"; } return; }
    const ts = ev.target.closest("[data-test-start]");
    if (ts){ p.tests[ts.dataset.testStart] = {k: ts.dataset.testStart, state: "running", start: Date.now()}; saveSettings(); refreshAll(); openProgramSheet(); return; }
    const tr = ev.target.closest("[data-test-res]");
    if (tr){ const t = p.tests[tr.dataset.k]; if (t){ t.state = tr.dataset.testRes; t.end = Date.now(); saveSettings(); refreshAll(); openProgramSheet(); } return; }
    const tz = ev.target.closest("[data-test-reset]");
    if (tz){ delete p.tests[tz.dataset.testReset]; saveSettings(); openProgramSheet(); }
  };
}

/* ================= Allergiekarte ================= */
const CARD_LANGS = {de:"Deutsch", en:"English", it:"Italiano", es:"Español", fr:"Français", nl:"Nederlands"};
const CARD_TXT = {
  de:{t:"Bitte beachten: Lebensmittelallergie / -unverträglichkeit", i:"Ich vertrage folgende Lebensmittel und Zutaten nicht:", a:"Bitte bereiten Sie mein Essen ohne diese Zutaten zu – auch nicht in Soßen, Brühen, Dressings oder zum Braten.", s:"Schon kleinste Mengen und Spuren können bei mir eine schwere allergische Reaktion auslösen. Bitte achten Sie auch auf saubere Utensilien und eine separate Fritteuse.", u:"Wenn Sie unsicher sind, sagen Sie es mir bitte – ich wähle dann gern etwas anderes.", d:"Vielen Dank!"},
  en:{t:"Please note: food allergy / intolerance", i:"I cannot eat the following foods and ingredients:", a:"Please prepare my meal without these ingredients – also not in sauces, stocks, dressings or for frying.", s:"Even tiny amounts and traces can cause a severe allergic reaction. Please also use clean utensils and a separate fryer.", u:"If you are unsure, please tell me – I'm happy to choose something else.", d:"Thank you very much!"},
  it:{t:"Attenzione: allergia / intolleranza alimentare", i:"Non posso mangiare i seguenti alimenti e ingredienti:", a:"Per favore preparate il mio piatto senza questi ingredienti – nemmeno in salse, brodi, condimenti o per friggere.", s:"Anche piccolissime quantità e tracce possono provocarmi una grave reazione allergica. Per favore usate utensili puliti e una friggitrice separata.", u:"Se non siete sicuri, ditemelo per favore – sceglierò volentieri qualcos'altro.", d:"Grazie mille!"},
  es:{t:"Atención: alergia / intolerancia alimentaria", i:"No puedo comer los siguientes alimentos e ingredientes:", a:"Por favor, preparen mi comida sin estos ingredientes, tampoco en salsas, caldos, aliños ni para freír.", s:"Incluso cantidades mínimas y trazas pueden provocarme una reacción alérgica grave. Por favor, usen utensilios limpios y una freidora aparte.", u:"Si no están seguros, díganmelo por favor; con gusto elegiré otra cosa.", d:"¡Muchas gracias!"},
  fr:{t:"Attention : allergie / intolérance alimentaire", i:"Je ne peux pas manger les aliments et ingrédients suivants :", a:"Merci de préparer mon plat sans ces ingrédients – ni dans les sauces, bouillons, vinaigrettes ou pour la cuisson.", s:"Même d'infimes quantités ou des traces peuvent provoquer chez moi une réaction allergique grave. Merci d'utiliser des ustensiles propres et une friteuse séparée.", u:"Si vous avez un doute, dites-le-moi s'il vous plaît – je choisirai volontiers autre chose.", d:"Merci beaucoup !"},
  nl:{t:"Let op: voedselallergie / -intolerantie", i:"Ik kan de volgende voedingsmiddelen en ingrediënten niet eten:", a:"Bereid mijn maaltijd alstublieft zonder deze ingrediënten – ook niet in sauzen, bouillons, dressings of om in te bakken.", s:"Zelfs kleine hoeveelheden en sporen kunnen bij mij een ernstige allergische reactie veroorzaken. Gebruik alstublieft schoon keukengerei en een aparte frituur.", u:"Als u twijfelt, laat het me dan weten – ik kies graag iets anders.", d:"Hartelijk dank!"}
};
const CARD_CAT = {
  h:{de:"Histamin (z. B. gereifter Käse, Salami, Tomaten, Spinat, Essig, Wein, Thunfisch)", en:"histamine (e.g. aged cheese, salami, tomatoes, spinach, vinegar, wine, tuna)", it:"istamina (ad es. formaggi stagionati, salame, pomodori, spinaci, aceto, vino, tonno)", es:"histamina (p. ej. queso curado, salami, tomate, espinacas, vinagre, vino, atún)", fr:"histamine (p. ex. fromages affinés, saucisson, tomates, épinards, vinaigre, vin, thon)", nl:"histamine (bijv. belegen kaas, salami, tomaten, spinazie, azijn, wijn, tonijn)"},
  f:{de:"Fruktose (z. B. Apfel, Birne, Honig, Fruchtsaft, Sorbit)", en:"fructose (e.g. apple, pear, honey, fruit juice, sorbitol)", it:"fruttosio (ad es. mela, pera, miele, succo di frutta, sorbitolo)", es:"fructosa (p. ej. manzana, pera, miel, zumo de fruta, sorbitol)", fr:"fructose (p. ex. pomme, poire, miel, jus de fruits, sorbitol)", nl:"fructose (bijv. appel, peer, honing, vruchtensap, sorbitol)"},
  s:{de:"Sorbit (E420, z. B. in zuckerfreien Süßwaren, Steinobst)", en:"sorbitol (E420, e.g. in sugar-free sweets, stone fruit)", it:"sorbitolo (E420, ad es. nei dolci senza zucchero, frutta con nocciolo)", es:"sorbitol (E420, p. ej. en dulces sin azúcar, fruta de hueso)", fr:"sorbitol (E420, p. ex. confiseries sans sucre, fruits à noyau)", nl:"sorbitol (E420, bijv. in suikervrij snoep, steenvruchten)"},
  l:{de:"Laktose (Milchzucker: Milch, Sahne, Joghurt, Quark, Frischkäse)", en:"lactose (milk sugar: milk, cream, yoghurt, soft cheese)", it:"lattosio (latte, panna, yogurt, formaggi freschi)", es:"lactosa (leche, nata, yogur, queso fresco)", fr:"lactose (lait, crème, yaourt, fromage frais)", nl:"lactose (melk, room, yoghurt, verse kaas)"},
  g:{de:"Gluten (Weizen, Dinkel, Roggen, Gerste – auch Paniermehl, gebundene Soßen, Bier)", en:"gluten (wheat, spelt, rye, barley – also breadcrumbs, thickened sauces, beer)", it:"glutine (frumento, farro, segale, orzo – anche pangrattato, salse addensate, birra)", es:"gluten (trigo, espelta, centeno, cebada – también pan rallado, salsas espesadas, cerveza)", fr:"gluten (blé, épeautre, seigle, orge – aussi chapelure, sauces liées, bière)", nl:"gluten (tarwe, spelt, rogge, gerst – ook paneermeel, gebonden sauzen, bier)"},
  o:{de:"FODMAP (v. a. Zwiebel, Knoblauch, Weizen, Hülsenfrüchte, Apfel, Milch)", en:"FODMAPs (especially onion, garlic, wheat, legumes, apple, milk)", it:"FODMAP (soprattutto cipolla, aglio, frumento, legumi, mela, latte)", es:"FODMAP (sobre todo cebolla, ajo, trigo, legumbres, manzana, leche)", fr:"FODMAP (surtout oignon, ail, blé, légumineuses, pomme, lait)", nl:"FODMAP's (vooral ui, knoflook, tarwe, peulvruchten, appel, melk)"},
  t:{de:"Tomate in jeder Form (auch Tomatenmark, Ketchup, Gewürzmischungen)", en:"tomato in any form (incl. tomato paste, ketchup, spice mixes)", it:"pomodoro in qualsiasi forma (anche concentrato, ketchup, miscele di spezie)", es:"tomate en cualquier forma (también concentrado, kétchup, mezclas de especias)", fr:"tomate sous toutes ses formes (aussi concentré, ketchup, mélanges d'épices)", nl:"tomaat in elke vorm (ook tomatenpuree, ketchup, kruidenmengsels)"},
  m:{de:"Milch und Milchprodukte (auch Butter, Käse, laktosefreie Milch)", en:"milk and dairy (incl. butter, cheese, lactose-free milk)", it:"latte e latticini (anche burro, formaggio, latte senza lattosio)", es:"leche y lácteos (también mantequilla, queso, leche sin lactosa)", fr:"lait et produits laitiers (y compris beurre, fromage, lait sans lactose)", nl:"melk en zuivel (ook boter, kaas, lactosevrije melk)"},
  e:{de:"Ei (auch Mayonnaise, Eiernudeln, Panade)", en:"egg (incl. mayonnaise, egg pasta, batter)", it:"uova (anche maionese, pasta all'uovo, pastella)", es:"huevo (también mayonesa, pasta al huevo, rebozados)", fr:"œuf (y compris mayonnaise, pâtes aux œufs, panure)", nl:"ei (ook mayonaise, eiernoedels, beslag)"},
  y:{de:"Soja (auch Sojasauce, Tofu)", en:"soy (incl. soy sauce, tofu)", it:"soia (anche salsa di soia, tofu)", es:"soja (también salsa de soja, tofu)", fr:"soja (y compris sauce soja, tofu)", nl:"soja (ook sojasaus, tofu)"},
  nu:{de:"Schalenfrüchte / Nüsse (Mandel, Haselnuss, Walnuss, Cashew, Pistazie u. a.)", en:"tree nuts (almond, hazelnut, walnut, cashew, pistachio etc.)", it:"frutta a guscio (mandorle, nocciole, noci, anacardi, pistacchi ecc.)", es:"frutos de cáscara (almendra, avellana, nuez, anacardo, pistacho, etc.)", fr:"fruits à coque (amande, noisette, noix, cajou, pistache, etc.)", nl:"noten (amandel, hazelnoot, walnoot, cashew, pistache enz.)"},
  p:{de:"Erdnüsse (auch Erdnussöl)", en:"peanuts (incl. peanut oil)", it:"arachidi (anche olio di arachidi)", es:"cacahuetes (también aceite de cacahuete)", fr:"arachides / cacahuètes (y compris huile d'arachide)", nl:"pinda's (ook pindaolie)"},
  c:{de:"Sellerie (auch Selleriesalz, Brühe)", en:"celery (incl. celery salt, stock)", it:"sedano (anche sale al sedano, brodo)", es:"apio (también sal de apio, caldo)", fr:"céleri (y compris sel de céleri, bouillon)", nl:"selderij (ook selderijzout, bouillon)"},
  u:{de:"Senf", en:"mustard", it:"senape", es:"mostaza", fr:"moutarde", nl:"mosterd"},
  z:{de:"Sesam (auch Tahin)", en:"sesame (incl. tahini)", it:"sesamo (anche tahina)", es:"sésamo (también tahini)", fr:"sésame (y compris tahini)", nl:"sesam (ook tahin)"},
  i:{de:"Fisch (auch Fischsauce)", en:"fish (incl. fish sauce)", it:"pesce (anche salsa di pesce)", es:"pescado (también salsa de pescado)", fr:"poisson (y compris sauce de poisson)", nl:"vis (ook vissaus)"},
  kr:{de:"Krebstiere (Garnelen, Krabben, Hummer)", en:"crustaceans (shrimp, prawns, crab, lobster)", it:"crostacei (gamberi, granchi, aragosta)", es:"crustáceos (gambas, cangrejo, langosta)", fr:"crustacés (crevettes, crabe, homard)", nl:"schaaldieren (garnalen, krab, kreeft)"},
  w:{de:"Weichtiere (Muscheln, Tintenfisch, Schnecken)", en:"molluscs (mussels, clams, squid, octopus, snails)", it:"molluschi (cozze, vongole, calamari, polpo, lumache)", es:"moluscos (mejillones, almejas, calamar, pulpo, caracoles)", fr:"mollusques (moules, palourdes, calmar, poulpe, escargots)", nl:"weekdieren (mosselen, inktvis, slakken)"},
  v:{de:"Lupine (Lupinenmehl)", en:"lupin (lupin flour)", it:"lupini (farina di lupini)", es:"altramuz (harina de altramuz)", fr:"lupin (farine de lupin)", nl:"lupine (lupinemeel)"},
  q:{de:"Sulfite (Schwefel, z. B. in Wein, Trockenobst)", en:"sulphites (e.g. in wine, dried fruit)", it:"solfiti (ad es. nel vino, frutta secca)", es:"sulfitos (p. ej. en el vino, fruta seca)", fr:"sulfites (p. ex. dans le vin, fruits secs)", nl:"sulfieten (bijv. in wijn, gedroogd fruit)"}
};
function openCardSheet(){
  const inn = $("#sheetIn"), lang = settings.cardLang || "en", T = CARD_TXT[lang], cats = activeCats();
  const severe = cats.some(c => CAT[c].grp === "all" || (c === "g" && profile.sens.g === 3));
  inn.innerHTML = `<div class="chipbar" role="group" aria-label="Sprache" style="margin-bottom:var(--s3)">${Object.entries(CARD_LANGS).map(([k, n]) => `<button type="button" aria-pressed="${k===lang}" data-lang="${k}">${n}</button>`).join("")}</div>
    ${cats.length ? `<div class="acard" lang="${lang}"><p class="acard-t">${SVG.warn}${esc(T.t)}</p><p>${esc(T.i)}</p>
      <ul>${cats.map(c => `<li>${esc((CARD_CAT[c] || {})[lang] || CATS[c])}</li>`).join("")}</ul>
      <p>${esc(T.a)}</p>${severe ? `<p class="acard-s">${esc(T.s)}</p>` : ""}<p>${esc(T.u)}</p><p><b>${esc(T.d)}</b></p></div>
      <p class="fine">Tipp: Bildschirmhelligkeit hochdrehen und das Handy der Bedienung zeigen.</p>`
    : `<div class="empty">${SVG.user}<b>Noch kein Profil aktiv</b>Wähle im Profil aus, was du nicht verträgst – dann erscheint es hier.</div>`}`;
  openSheet("Allergiekarte", {type:"card"});
  inn.onclick = ev => { const l = ev.target.closest("[data-lang]"); if (l){ settings.cardLang = l.dataset.lang; saveSettings(); openCardSheet(); } };
}

/* ================= Notfall ================= */
function penWarnings(){
  if (!F("emergency")) return [];
  const pens = (settings.emergency && settings.emergency.pens) || [];
  const now = new Date();
  return pens.filter(p => p.exp).map(p => {
    const [y, m] = p.exp.split("-").map(Number), end = new Date(y, m, 0, 23, 59);
    const days = Math.ceil((end - now) / 864e5);
    return {label: p.label || "Adrenalin-Pen", days, end};
  }).filter(x => x.days <= 30);
}
function emergencyBannerHtml(){
  const w = penWarnings(); if (!w.length) return "";
  return `<button type="button" class="feedback fb-${w.some(x => x.days < 0) ? "err" : "warn"} banner" data-fx="emergency">${fbHtml(w.map(x => esc(x.label) + (x.days < 0 ? " ist abgelaufen" : " läuft in " + x.days + " Tag" + (x.days === 1 ? "" : "en") + " ab")).join(" · "), "Rechtzeitig ein neues Rezept besorgen. Tippen für Details.", "", SVG.warn)}</button>`;
}
const PLAN_DEFAULT = [
  "Bei Zeichen einer schweren Reaktion (Atemnot, Schwellung von Zunge oder Hals, Schwindel, Kreislaufprobleme): Adrenalin-Autoinjektor sofort in den äußeren Oberschenkel.",
  "Notruf 112 wählen und „Anaphylaxie“ sagen.",
  "Bei Atemnot aufrecht sitzen, bei Schwindel oder Kreislaufproblemen hinlegen und Beine hochlagern.",
  "Bessert sich nichts, nach 5–15 Minuten den zweiten Pen geben, falls vorhanden.",
  "Notfallmedikamente wie verordnet einnehmen. Nicht allein bleiben."
];
function openEmergencySheet(edit){
  const inn = $("#sheetIn"), em = settings.emergency || {};
  const pens = em.pens && em.pens.length ? em.pens : [];
  const warn = penWarnings();
  if (!edit){
    inn.innerHTML = `<a class="btn btn-danger btn-lg btn-block" href="tel:112">Notruf 112 anrufen</a>
      ${em.contactPhone ? `<a class="btn btn-secondary btn-block" style="margin-top:var(--s2)" href="tel:${esc(em.contactPhone.replace(/[^\d+]/g, ""))}">${esc(em.contactName || "Notfallkontakt")} anrufen · ${esc(em.contactPhone)}</a>` : ""}
      ${warn.length ? `<div class="feedback fb-warn" style="margin-top:var(--s3)">${fbHtml(warn.map(x => esc(x.label) + (x.days < 0 ? " ist abgelaufen" : " läuft in " + x.days + " Tagen ab")).join(" · "), "", "", SVG.warn)}</div>` : ""}
      <section class="block"><h3 class="block-title">Notfallplan</h3><ol class="steps">${(em.plan ? em.plan.split(/\n+/).filter(Boolean) : PLAN_DEFAULT).map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        ${em.plan ? "" : `<p class="hint">Allgemeiner Ablauf – maßgeblich ist der Notfallplan deiner Ärztin oder deines Arztes. Du kannst ihn unten eintragen.</p>`}</section>
      ${em.meds ? `<section class="block"><h3 class="block-title">Notfallmedikamente</h3><p>${esc(em.meds)}</p></section>` : ""}
      ${pens.length ? `<section class="block"><h3 class="block-title">Adrenalin-Pens</h3><ul class="list">${pens.map(p => `<li class="ing"><div class="ing-line"><span class="ing-name">${esc(p.label || "Adrenalin-Pen")}</span><span class="meta">gültig bis ${esc(p.exp ? p.exp.split("-").reverse().join("/") : "–")}</span></div></li>`).join("")}</ul></section>` : ""}
      <div class="sheet-actions"><button type="button" class="btn btn-outline btn-block" data-em-edit>Angaben bearbeiten</button></div>`;
  } else {
    inn.innerHTML = `<form id="emForm" action="#">
      <label class="label" for="emCN">Notfallkontakt – Name</label><input class="input" id="emCN" type="text" autocomplete="off" value="${esc(em.contactName || "")}">
      <label class="label" for="emCP">Telefonnummer</label><input class="input" id="emCP" type="tel" autocomplete="off" value="${esc(em.contactPhone || "")}">
      <label class="label">Adrenalin-Pens <span class="opt">(Ablaufmonat steht auf dem Pen)</span></label>
      <div id="emPens">${(pens.length ? pens : [{}]).map((p, i) => `<div class="pen-row"><input class="input" type="text" placeholder="Bezeichnung, z. B. Pen Handtasche" data-pen-l="${i}" value="${esc(p.label || "")}"><input class="input" type="month" data-pen-e="${i}" value="${esc(p.exp || "")}" aria-label="Ablaufmonat"></div>`).join("")}</div>
      <button type="button" class="btn-link sm" data-em-addpen>+ weiteren Pen hinzufügen</button>
      <label class="label" for="emMeds">Notfallmedikamente <span class="opt">(optional)</span></label><input class="input" id="emMeds" type="text" autocomplete="off" value="${esc(em.meds || "")}">
      <label class="label" for="emPlan">Eigener Notfallplan <span class="opt">(ein Schritt pro Zeile, optional)</span></label><textarea class="input" id="emPlan" rows="5">${esc(em.plan || "")}</textarea>
      <div class="sheet-actions"><button type="submit" class="btn btn-primary btn-block">Speichern</button></div></form>`;
  }
  openSheet("Notfall", {type:"emergency"});
  const form = $("#emForm");
  if (form) form.onsubmit = ev => {
    ev.preventDefault();
    const pens2 = [...inn.querySelectorAll("[data-pen-l]")].map(l => ({label: l.value.trim(), exp: (inn.querySelector(`[data-pen-e="${l.dataset.penL}"]`) || {}).value || ""})).filter(p => p.label || p.exp);
    settings.emergency = {contactName: $("#emCN").value.trim(), contactPhone: $("#emCP").value.trim(), pens: pens2, meds: $("#emMeds").value.trim(), plan: $("#emPlan").value.trim()};
    saveSettings(); refreshAll(); openEmergencySheet(false); toast("Notfallangaben gespeichert");
  };
  inn.onclick = ev => {
    if (ev.target.closest("[data-em-edit]")){ openEmergencySheet(true); return; }
    if (ev.target.closest("[data-em-addpen]")){
      const box = $("#emPens"), i = box.children.length;
      box.insertAdjacentHTML("beforeend", `<div class="pen-row"><input class="input" type="text" placeholder="Bezeichnung" data-pen-l="${i}"><input class="input" type="month" data-pen-e="${i}" aria-label="Ablaufmonat"></div>`);
    }
  };
}

/* ================= Mehrere Profile verwalten ================= */
function openPeopleSheet(){
  const inn = $("#sheetIn");
  inn.innerHTML = `<p class="hint" style="margin-top:0">Jede Person hat ihr eigenes Profil und Tagebuch. Bei jedem Ergebnis siehst du, für wen das Produkt passt.</p>
    <ul class="list">${people.list.map(p => { const on = p.id === people.active; const pr = normProfile(p.profile || {}); const cs = KEYS.filter(c => pr.on[c]);
      return `<li class="fav-row"><button type="button" class="row-btn" data-person="${esc(p.id)}" aria-current="${on}"><span class="st ${on ? "lv0" : ""}" aria-hidden="true">${on ? "✓" : esc(p.name.slice(0,1).toUpperCase())}</span><span class="txt"><b>${esc(p.name)}${on ? " · aktiv" : ""}</b><small>${cs.length ? esc(cs.map(c => CATS[c]).join(", ")) : "kein Profil"}</small></span></button>
        <button type="button" class="icon-btn" data-person-ren="${esc(p.id)}" aria-label="${esc(p.name)} umbenennen">${SVG.edit}</button>${p.id !== "main" ? `<button type="button" class="icon-btn" data-person-del="${esc(p.id)}" aria-label="${esc(p.name)} löschen">${SVG.x}</button>` : ""}</li>`; }).join("")}</ul>
    <form class="searchrow" id="personForm" action="#" style="margin-top:var(--s3)"><div class="field" style="padding-left:0"><label class="sr-only" for="personIn">Name</label><input class="input" id="personIn" type="text" placeholder="Name, z. B. Lena" autocomplete="off" style="padding-left:var(--s3)"></div><button type="submit" class="btn btn-secondary">Hinzufügen</button></form>`;
  openSheet("Profile", {type:"people"});
  $("#personForm").onsubmit = ev => {
    ev.preventDefault(); const n = $("#personIn").value.trim(); if (!n) return;
    const id = "p" + Date.now().toString(36);
    people.list.push({id, name: n, profile: normProfile({})}); syncPerson();
    switchPerson(id); closeSheet(); goView("prof"); toast(n + " angelegt – wähle aus, was " + n + " nicht verträgt");
  };
  inn.onclick = ev => {
    const p = ev.target.closest("[data-person]"); if (p){ switchPerson(p.dataset.person); openPeopleSheet(); return; }
    const r = ev.target.closest("[data-person-ren]");
    if (r){ const pp = people.list.find(x => x.id === r.dataset.personRen); const row = r.closest("li");
      row.innerHTML = `<form class="searchrow" style="flex:1"><input class="input" type="text" value="${esc(pp.name)}" aria-label="Neuer Name"><button class="btn btn-secondary" type="submit">OK</button></form>`;
      const f = row.querySelector("form"), i = f.querySelector("input"); i.focus(); i.select();
      f.onsubmit = e2 => { e2.preventDefault(); const v = i.value.trim(); if (v){ pp.name = v; syncPerson(); refreshAll(); } openPeopleSheet(); };
      return; }
    const d = ev.target.closest("[data-person-del]");
    if (d){ if (d.dataset.c){ const id = d.dataset.personDel; people.list = people.list.filter(x => x.id !== id); history = history.filter(h => (h.who || "main") !== id); saveHistory();
        if (people.active === id) switchPerson("main"); else syncPerson(); openPeopleSheet(); toast("Profil gelöscht"); }
      else { d.dataset.c = "1"; d.classList.add("armed"); d.setAttribute("aria-label", "Wirklich löschen? Nochmal tippen"); toast("Nochmal tippen zum Löschen – inkl. Tagebuch"); } }
  };
}

/* ================= Funktionen verwalten ================= */
function featureListHtml(sel, rec, only){
  return FEATURES.filter(f => !only || only(f)).map(f => {
    const on = sel.has(f.k), dep = f.needs && !sel.has(f.needs);
    return `<li class="cat-row"><label class="cat-toggle"><span class="txt"><b>${esc(f.n)}${rec && rec.has(f.k) ? ` <span class="tag-rec">empfohlen</span>` : ""}</b><small>${esc(f.d)}${dep ? ` · braucht „${esc(FEAT[f.needs].n)}“` : ""}</small></span><span class="sw"><input type="checkbox" role="switch" data-feat="${f.k}"${on ? " checked" : ""}><span></span></span></label></li>`;
  }).join("");
}
function renderFeatures(){
  const el = $("#featCard"); if (!el) return;
  const sel = new Set(Object.keys(settings.features).filter(k => settings.features[k]));
  el.innerHTML = `<div class="group-hd"><h2 class="h2">Funktionen</h2><span class="count">${FEATURES.filter(f => F(f.k)).length} aktiv</span></div>
    <p class="hint" style="margin-top:2px">Schalte nur ein, was du brauchst – die App zeigt dann genau das.</p><ul class="cat-list">${featureListHtml(sel)}</ul>`;
  const pc = $("#peopleCard");
  if (pc){
    pc.hidden = !F("family");
    if (F("family")) pc.innerHTML = `<div class="group-hd"><h2 class="h2">Profile</h2><span class="count">${people.list.length}</span></div>
      <p class="hint" style="margin-top:2px">Aktiv: <b>${esc(personName())}</b>. Die Einstellungen oben gelten für dieses Profil.</p>
      <button type="button" class="btn btn-secondary btn-block" data-fx="people" style="margin-top:var(--s2)">Profile verwalten</button>`;
  }
}
function setFeature(k, on){
  settings.features[k] = on;
  if (on && FEAT[k].needs) settings.features[FEAT[k].needs] = true;
  if (!on) FEATURES.filter(f => f.needs === k).forEach(f => settings.features[f.k] = false);
  saveSettings(); applyFeatures(); refreshAll();
}

/* Navigation & Prüfen-Seite an aktive Funktionen anpassen */
function applyFeatures(){
  ["foods","recipes","diary"].forEach(k => { const b = $(`.tabbar [data-v="${k}"]`); if (b) b.hidden = !F(k); });
  const cur = ($$(".view.on")[0] || {}).id; if (cur && ["v-foods","v-recipes","v-diary"].includes(cur) && !F(cur.slice(2))) goView("check");
  renderCheckExtras();
}
function renderCheckExtras(){
  const top = $("#checkTop"); if (!top) return;
  let h = emergencyBannerHtml() + programCardHtml();
  if (settings.newHint) h += `<div class="feedback newhint">${fbHtml("Neu: weitere Funktionen", "Symptom-Tagebuch, Arztbericht, Allergiekarte, Familienprofile und mehr – such dir aus, was du brauchst.", actBtn("features", "Funktionen ansehen", true) + `<button type="button" class="btn btn-sm btn-quiet" data-fx="dismissNew">Später</button>`)}</div>`;
  top.innerHTML = h; top.hidden = !h;
  const q = $("#quickTools"); if (!q) return;
  const tools = [];
  if (F("card")) tools.push(`<button type="button" class="tool" data-fx="card">${SVG.card}<span>Allergiekarte</span></button>`);
  if (F("lists")) tools.push(`<button type="button" class="tool" data-fx="lists">${SVG.star}<span>Favoriten</span></button><button type="button" class="tool" data-fx="shoplist">${SVG.cart}<span>Einkauf${lists.shop.filter(x => !x.done).length ? " (" + lists.shop.filter(x => !x.done).length + ")" : ""}</span></button>`);
  if (F("program") && !programCardHtml()) tools.push(`<button type="button" class="tool" data-fx="program">${SVG.chart}<span>Programm</span></button>`);
  if (F("emergency")) tools.push(`<button type="button" class="tool danger" data-fx="emergency">${SVG.sos}<span>Notfall</span></button>`);
  q.innerHTML = tools.length ? `<h2 class="section-title">Werkzeuge</h2><div class="tools-row">${tools.join("")}</div>` : "";
}

/* Zentrale Klick-Behandlung für data-fx außerhalb von Ergebnissen */
function globalFx(ev){
  const b = ev.target.closest("[data-fx],[data-go='features']"); if (!b) return false;
  if (b.dataset.go === "features"){ settings.newHint = false; saveSettings(); goView("prof"); setTimeout(() => { const c = $("#featCard"); if (c) c.scrollIntoView({behavior:"smooth", block:"start"}); }, 50); renderCheckExtras(); return true; }
  const a = b.dataset.fx;
  const map = {card: openCardSheet, lists: () => openListsSheet("fav"), shoplist: () => openListsSheet("shop"), program: openProgramSheet, emergency: () => openEmergencySheet(false),
    symptom: openSymptomSheet, report: openReportSheet, people: openPeopleSheet,
    free: () => { addSymptomEntry({free: true, sym: {}, ts: Date.now()}); renderDiary(); toast("Beschwerdefreier Tag gespeichert"); },
    dismissNew: () => { settings.newHint = false; saveSettings(); renderCheckExtras(); }};
  if (map[a]){ map[a](); return true; }
  return false;
}
document.addEventListener("click", ev => {
  if (ev.target.closest("#sheetIn .verdict, #shRes")) return; // Ergebnis-Klicks laufen über showResult
  if (ev.target.closest("#checkTop, #quickTools, #analysisTools, #peopleCard, #v-diary")) globalFx(ev);
});
document.addEventListener("change", ev => { const t = ev.target.closest("[data-feat]"); if (t && t.closest("#featCard")) setFeature(t.dataset.feat, t.checked); });

/* ================= Offline (Service Worker) ================= */
if ("serviceWorker" in navigator && location.protocol === "https:"){
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}

/* ================= Start ================= */
load(); loadPeople(); loadSettings();
renderCats(); renderMeals(); applyFeatures(); refreshAll();
if (!hasStoredProfile && !history.length) showOnb(false);
