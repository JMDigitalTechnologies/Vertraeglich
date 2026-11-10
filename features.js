"use strict";
/* Verträglich – Zusatzfunktionen als Module.
   Jede Funktion ist einzeln an-/abschaltbar (Einstieg + Ich → Funktionen).
   Navigation: Prüfen · Essen · Tagebuch · Notfall/Karte · Ich – Tabs erscheinen nur, wenn ihre Funktionen aktiv sind.
   Abhängigkeiten: app.js (UI-Bausteine, Zustand), engine.js, config.js */

/* ================= Funktionskatalog ================= */
const FEATURES = [
  {k:"foods",        n:"Lebensmittel-Liste",       d:"Über 140 Lebensmittel mit Ampel nachschlagen", where:"Essen"},
  {k:"recipes",      n:"Rezepte",                  d:"Gerichte, die zu deinem Profil passen", where:"Essen"},
  {k:"lists",        n:"Favoriten & Einkaufsliste",d:"Sichere Produkte merken und Einkäufe planen", where:"Essen"},
  {k:"diary",        n:"Tagebuch & Analyse",       d:"Trag ein, was du gegessen hast – die App erkennt Muster", where:"Tagebuch"},
  {k:"symptoms",     n:"Beschwerden erfassen",     d:"Beschwerden mit Stärke und Uhrzeit – erkennt auch verzögerte Reaktionen", needs:"diary", where:"Tagebuch"},
  {k:"report",       n:"Bericht für den Arzt",     d:"Tagebuch und Auswertung als PDF oder Tabelle teilen", needs:"diary", where:"Tagebuch"},
  {k:"program",      n:"Ernährungsprogramm",       d:"Schritt für Schritt durch Karenz-, Test- und Dauerphase", needs:"diary", where:"Tagebuch"},
  {k:"menu",         n:"Speisekarte prüfen",       d:"Speisekarte fotografieren – Gerichte mit kritischen Zutaten werden markiert", where:"Prüfen"},
  {k:"alternatives", n:"Alternativen vorschlagen", d:"Bei roten Produkten verträgliche Alternativen finden", where:"Ergebnis"},
  {k:"family",       n:"Mehrere Profile",          d:"Für Familie oder Partner – sieh sofort, für wen ein Produkt passt", where:"Ich"},
  {k:"emergency",    n:"Notfall",                  d:"Notruf, Notfallplan, Notfallkontakt und Ablaufdatum deines Adrenalin-Pens", where:"Notfall"},
  {k:"card",         n:"Allergiekarte",            d:"Zeig im Restaurant, was du nicht verträgst – in 6 Sprachen", where:"Notfall"},
].filter(f => !APP_CONFIG.features[f.k] || APP_CONFIG.features[f.k].available !== false);
const FEAT = Object.fromEntries(FEATURES.map(f => [f.k, f]));
const DEFAULT_FEATURES = {foods:true, recipes:true, diary:true};

let settings = {features: Object.assign({}, DEFAULT_FEATURES), newHint: true, programs: {}, cardLang: "en", lac: {show: true, pill: false, fcc: 4500, f: 0}};
function loadSettings(){
  const s = LS.get("vt_settings");
  if (s){
    settings = Object.assign(settings, s, {features: Object.assign({}, s.features || DEFAULT_FEATURES)});
    if (s.program && !s.programs){ settings.programs = {[s.program.who || "main"]: s.program}; } // ältere Version
    delete settings.program;
    if (s.emergency && Object.keys(s.emergency).length){ const me = people.list.find(p => p.id === "main"); if (me && !me.emergency) me.emergency = s.emergency; delete settings.emergency; syncPerson(); }
  } else settings.newHint = hasStoredProfile || history.length > 0;
  settings.programs = settings.programs || {};
  settings.lac = Object.assign({show: true, pill: false, fcc: 4500, f: 0}, settings.lac || {});
}
function saveSettings(){ LS.set("vt_settings", settings); }
function F(k){
  if (!FEAT[k] || !settings.features[k]) return false;
  const n = FEAT[k].needs; return n ? F(n) : true;
}
function recommendFeatures(cats){
  const r = new Set(["foods","recipes","diary"]);
  if (cats.some(c => CAT[c] && CAT[c].grp === "all")){ r.add("card"); r.add("emergency"); }
  if (cats.includes("g") || cats.some(c => ["h","o","f","s","l"].includes(c))) r.add("card");
  if (cats.some(c => ["h","o","f","s"].includes(c))){ r.add("program"); r.add("symptoms"); }
  if (cats.some(c => CAT[c] && CAT[c].grp === "all") || cats.includes("g")) r.add("menu");
  return r;
}

/* ================= Personen ================= */
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
const me = () => people.list.find(x => x.id === people.active) || people.list[0];
const personName = () => me().name || "Ich";
const myEntries = () => history.filter(h => (h.who || "main") === people.active);
const multi = () => F("family") && people.list.length > 1;
function switchPerson(id){
  syncPerson();
  const p = people.list.find(x => x.id === id); if (!p) return;
  people.active = id; profile = normProfile(p.profile || {}); LS.set("vt_profile", profile); syncPerson();
  refreshAll(); toast("Aktives Profil: " + p.name);
}
function resultWho(){ return multi() ? ` <span class="who-tag">für ${esc(personName())}</span>` : ""; }

/* Bewertungsprofil: im Programm ist die Kategorie immer aktiv; streng in Phase 1 (bei Low-FODMAP auch in Phase 2) */
function P(){
  const prg = myProgram();
  if (!F("program") || !prg) return profile;
  const def = PROGRAMS[prg.type]; if (!def) return profile;
  const q = {on: Object.assign({}, profile.on), sens: Object.assign({}, profile.sens), mine: profile.mine};
  q.on[def.cat] = true;
  if (prg.phase === 1 || (prg.type === "fodmap" && prg.phase === 2)) q.sens[def.cat] = 3;
  return q;
}

/* ================= Beschwerden ================= */
/* fast = schnelle Reaktion (Haut, Kreislauf, Kopf): Fenster 0–4 h; sonst Verdauung: 0,5–12 h */
const SYMPTOMS = [
  ["bloat","Blähbauch"],["gas","Blähungen"],["pain","Bauchschmerzen"],["diarrhea","Durchfall"],["constipation","Verstopfung"],["nausea","Übelkeit"],["heartburn","Sodbrennen"],
  ["headache","Kopfschmerzen", 1],["flush","Hitzegefühl / Gesichtsrötung", 1],["skin","Haut (Juckreiz, Quaddeln)", 1],["nose","Nase / Augen (Schnupfen, Niesen)", 1],["heart","Herzrasen", 1],["tired","Müdigkeit"],
  ["severe","Atemnot, Schwellung im Hals, Kreislaufprobleme", 1, 1]];
const SYM_N = Object.fromEntries(SYMPTOMS.map(s => [s[0], s[1]])), SYM_FAST = Object.fromEntries(SYMPTOMS.map(s => [s[0], !!s[2]]));
const FACTORS = [["stress","Stress"],["sleep","Schlecht geschlafen"],["period","Periode"],["meds","Medikamente"],["sport","Sport"],["alcohol","Alkohol"],["infect","Infekt"],["out","Auswärts gegessen"]];
const FAC_N = Object.fromEntries(FACTORS);
const SEV = ["–","leicht","mittel","stark"];
const DERIVED_W = 0.5;
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const mealTime = h => h.eatenAt || h.ts;

/* Für die Analyse: nur Gegessenes; fehlende Bewertungen aus Beschwerden ableiten (geringer gewichtet) */
function analysisEntries(list){
  const all = list || myEntries();
  const meals = all.filter(h => h.src !== "symptom" && isEaten(h));
  if (!F("symptoms")) return meals;
  const sym = myEntries().filter(h => h.src === "symptom");
  const hits = sym.filter(s => !s.free);
  return meals.map(h => {
    if (h.reaction) return h;
    const t = mealTime(h);
    const rel = hits.filter(s => Object.keys(s.sym || {}).some(k => SYM_FAST[k] ? (s.ts >= t && s.ts <= t + 4*3600e3) : (s.ts >= t + 30*60e3 && s.ts <= t + 12*3600e3)));
    const sev = Math.max(0, ...rel.map(s => s.sev || 0));
    if (sev >= 2) return Object.assign({}, h, {reaction:"bad", derived:true, w:DERIVED_W});
    if (sev === 1) return h;
    const free = sym.find(s => s.free && sameDay(s.day || s.ts, t));
    if (free && t <= (free.until || free.ts) - 8*3600e3 && !hits.some(s => s.ts >= t && s.ts <= t + 12*3600e3))
      return Object.assign({}, h, {reaction:"good", derived:true, w:DERIVED_W});
    return h;
  });
}
function nowLocal(){ return new Date(Date.now() - new Date().getTimezoneOffset()*60e3).toISOString().slice(0,16); }
function openSymptomSheet(){
  const inn = $("#sheetIn");
  const sel = {}, fac = new Set();
  inn.innerHTML = `
    <p class="hint" style="margin-top:0">Wähle aus, was du hast, und wie stark. Die Auswertung verknüpft es mit dem, was du in den Stunden davor gegessen hast.</p>
    <ul class="list sym-list">${SYMPTOMS.map(([k, n, , sev]) => `<li class="sym-row${sev ? " sym-severe" : ""}"><span class="name">${n}</span>
      <div class="seg sym-seg" role="radiogroup" aria-label="${n}">${[0,1,2,3].map(v => `<button type="button" role="radio" aria-checked="${v===0}" data-sym="${k}" data-v="${v}">${SEV[v]}</button>`).join("")}</div></li>`).join("")}</ul>
    <div id="symSevere"></div>
    <h3 class="block-title" style="margin-top:var(--s4)">Begleitumstände <span class="n">(optional)</span></h3>
    <div class="pick sm">${FACTORS.map(([k, n]) => `<button type="button" aria-pressed="false" data-fac="${k}">${SVG.check}${n}</button>`).join("")}</div>
    <label class="label" for="symTime">Zeitpunkt</label><input class="input" type="datetime-local" id="symTime" value="${nowLocal()}" max="${nowLocal()}">
    <label class="label" for="symNote">Notiz <span class="opt">(optional)</span></label><input class="input" type="text" id="symNote" autocomplete="off">
    <div class="sheet-actions"><button type="button" class="btn btn-primary btn-block" id="symSave">Speichern</button></div>`;
  openSheet("Beschwerden eintragen", {type:"symptom"});
  inn.onclick = ev => {
    const s = ev.target.closest("[data-sym]");
    if (s){
      sel[s.dataset.sym] = +s.dataset.v; inn.querySelectorAll(`[data-sym="${s.dataset.sym}"]`).forEach(b => b.setAttribute("aria-checked", b === s));
      if (s.dataset.sym === "severe") $("#symSevere").innerHTML = +s.dataset.v > 0 ? `<div class="feedback fb-err">${fbHtml("Das kann eine schwere allergische Reaktion sein", "Wenn du einen Adrenalin-Pen hast: jetzt anwenden und den Notruf 112 wählen.", `<a class="btn btn-danger btn-sm" href="tel:112">112 anrufen</a>${F("emergency") ? `<button type="button" class="btn btn-sm btn-secondary" data-go-sos>Notfallplan</button>` : ""}`, SVG.warn)}</div>` : "";
      return;
    }
    if (ev.target.closest("[data-go-sos]")){ closeSheet(); goView("sos"); return; }
    const f = ev.target.closest("[data-fac]");
    if (f){ const k = f.dataset.fac; fac.has(k) ? fac.delete(k) : fac.add(k); f.setAttribute("aria-pressed", fac.has(k)); return; }
    if (ev.target.closest("#symSave")){
      const sym = Object.fromEntries(Object.entries(sel).filter(([, v]) => v > 0));
      if (!Object.keys(sym).length){ toast("Wähle mindestens eine Beschwerde aus"); return; }
      const t = Math.min(Date.now(), Date.parse($("#symTime").value) || Date.now());
      addSymptomEntry({sym, factors:[...fac], note: $("#symNote").value.trim(), ts: t});
      closeSheet(); toast("Beschwerden gespeichert");
    }
  };
}
function openFreeSheet(){
  const inn = $("#sheetIn");
  const y = new Date(); y.setDate(y.getDate() - 1);
  const hasSym = d => myEntries().some(s => s.src === "symptom" && !s.free && sameDay(s.ts, d));
  const done = d => myEntries().some(s => s.src === "symptom" && s.free && sameDay(s.day || s.ts, d));
  const opt = (d, lbl) => { const dis = hasSym(d) || done(d);
    return `<button type="button" class="btn btn-secondary btn-block" data-free="${d.getTime()}"${dis ? " disabled" : ""}>${lbl}${hasSym(d) ? " – Beschwerden eingetragen" : done(d) ? " – schon eingetragen" : ""}</button>`; };
  inn.innerHTML = `<p class="hint" style="margin-top:0">Ein beschwerdefreier Tag zeigt der Auswertung, was du gut verträgst. Mahlzeiten zählen, wenn danach mindestens 8 Stunden ohne Beschwerden vergangen sind.</p>
    <div class="sheet-actions">${opt(y, "Gestern war beschwerdefrei")}${opt(new Date(), "Heute bisher beschwerdefrei")}</div>`;
  openSheet("Beschwerdefreier Tag", {type:"free"});
  inn.onclick = ev => {
    const b = ev.target.closest("[data-free]"); if (!b || b.disabled) return;
    const d = new Date(+b.dataset.free), isToday = sameDay(d, Date.now());
    const until = isToday ? Date.now() : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59).getTime();
    addSymptomEntry({free:true, sym:{}, ts: isToday ? Date.now() : until, day: d.getTime(), until});
    closeSheet(); toast("Beschwerdefreier Tag gespeichert");
  };
}
function addSymptomEntry(o){
  const sev = Math.max(0, ...Object.values(o.sym || {}));
  const name = o.free ? "Beschwerdefrei" : "Beschwerden: " + Object.keys(o.sym).map(k => SYM_N[k]).join(", ");
  const e = addEntry(name, {mode:"food", items:[]}, "symptom");
  Object.assign(e, {ts: o.ts || e.ts, sym: o.sym || {}, factors: o.factors || [], note: o.note || "", sev, free: !!o.free, day: o.day || null, until: o.until || null});
  history.sort((a, b) => b.ts - a.ts); saveHistory(); renderDiary();
  return e;
}
function symptomRowHtml(x){
  const desc = x.free ? (sameDay(x.day || x.ts, Date.now()) ? "Heute bisher keine Beschwerden" : "Keine Beschwerden") : Object.entries(x.sym || {}).map(([k, v]) => `${SYM_N[k]} (${SEV[v]})`).join(", ");
  const fac = (x.factors || []).map(k => FAC_N[k]).join(", ");
  return `<li><button type="button" class="row-btn hist" data-id="${x.id}"><span class="st ${x.free ? "lv0" : x.sev >= 2 ? "lv2" : "lv1"}" aria-hidden="true">${x.free ? "✓" : "!"}</span><span class="txt"><b class="ell">${x.free ? "Beschwerdefrei" : "Beschwerden"}</b><small>${x.free ? "" : fmtTime(x.ts) + " · "}${esc(desc)}${fac ? " · " + esc(fac) : ""}</small></span>${SVG.chev}</button></li>`;
}
function openSymptomEntry(x){
  const inn = $("#sheetIn");
  inn.innerHTML = `<p class="lead" style="margin-top:0">${esc(x.free ? new Date(x.day || x.ts).toLocaleDateString("de-DE", {weekday:"long", day:"numeric", month:"long"}) : fmtDate(x.ts))}</p>
    ${x.free ? `<p>Keine Beschwerden.</p>` : `<ul class="list">${Object.entries(x.sym || {}).map(([k, v]) => `<li class="ing"><div class="ing-line"><span class="ing-name">${SYM_N[k]}</span><span class="pill ${v >= 3 ? "p-strong" : v === 2 ? "p-possible" : "p-data"}">${SEV[v]}</span></div></li>`).join("")}</ul>`}
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
/* Begleitumstände: nur Häufigkeit bei Beschwerden (ein Vergleich wäre verzerrt) */
function factorStats(){
  const bad = myEntries().filter(h => h.src === "symptom" && !h.free && h.sev >= 2);
  if (bad.length < 3) return [];
  return FACTORS.map(([k, n]) => ({n, b: bad.filter(s => (s.factors||[]).includes(k)).length, nb: bad.length}))
    .filter(x => x.b >= 2 && x.b / x.nb >= 0.4).sort((a, b) => b.b - a.b);
}
function diaryExtrasTop(){
  return openRatingsHtml() + (!F("symptoms") ? "" : `<div class="quick"><button type="button" class="btn btn-secondary" data-fx="symptom">${SVG.warn}Beschwerden eintragen</button><button type="button" class="btn btn-outline" data-fx="free">${SVG.check}Beschwerdefreier Tag</button></div>`);
}
function diaryAnalysisExtras(){
  let h = "";
  if (F("symptoms")){
    const derived = analysisEntries().filter(x => x.derived).length;
    if (derived) h += `<p class="meta" style="margin-top:var(--s2)">${derived} Bewertung${derived > 1 ? "en" : ""} aus deinen Beschwerden abgeleitet – sie zählen nur halb. Tippe auf einen Eintrag, um selbst zu bewerten.</p>`;
    const fs = factorStats();
    if (fs.length) h += `<section class="block"><h3 class="block-title">Häufig bei Beschwerden</h3>` +
      fs.map(x => `<div class="sug"><span class="name">${esc(x.n)} <span class="meta">· bei ${x.b} von ${x.nb} Beschwerde-Einträgen</span></span></div>`).join("") +
      `<p class="hint">Nicht jede Beschwerde kommt vom Essen – Stress, Schlaf oder ein Infekt spielen oft mit.</p></section>`;
  }
  return h;
}
function diaryAnalysisActions(){
  const a = [];
  if (F("report")) a.push(`<button type="button" class="btn btn-sm btn-outline" data-fx="report">${SVG.book}Bericht für den Arzt</button>`);
  if (F("program") && !myProgram()) a.push(`<button type="button" class="btn btn-sm btn-outline" data-fx="program">${SVG.chart}Programm starten</button>`);
  return a.length ? `<div class="quick" style="margin-top:var(--s3)">${a.join("")}</div>` : "";
}

/* ================= Arztbericht ================= */
function openReportSheet(){
  const inn = $("#sheetIn");
  inn.innerHTML = `<p class="hint" style="margin-top:0">Übersicht aus Profil, Auswertung und Tagebuch – zum Ausdrucken, als PDF sichern oder als Tabelle teilen.</p>
    <label class="label">Zeitraum</label>
    <div class="seg" role="radiogroup" aria-label="Zeitraum">${[14,30,90,365].map((d, i) => `<button type="button" role="radio" aria-checked="${i===1}" data-days="${d}">${d === 365 ? "1 Jahr" : d + " Tage"}</button>`).join("")}</div>
    <div class="sheet-actions">
      <button type="button" class="btn btn-primary btn-block" id="repPdf">${SVG.book}Als PDF / Drucken</button>
      <button type="button" class="btn btn-secondary btn-block" id="repHtml">Als Datei teilen</button>
      <button type="button" class="btn btn-outline btn-block" id="repCsv">Als Tabelle (CSV) teilen</button>
    </div>
    <p class="fine">Tipp fürs iPhone: Im Druckmenü auf „Teilen“ tippen, dann lässt sich das PDF z. B. per Mail schicken. Falls Drucken nicht klappt: „Als Datei teilen“.</p>`;
  openSheet("Bericht für den Arzt", {type:"report"});
  let days = 30;
  inn.onclick = ev => {
    const d = ev.target.closest("[data-days]");
    if (d){ days = +d.dataset.days; inn.querySelectorAll("[data-days]").forEach(b => b.setAttribute("aria-checked", b === d)); return; }
    if (ev.target.closest("#repPdf")){ buildReport(days); try{ window.print(); }catch(e){ toast("Drucken wird hier nicht unterstützt – nutze „Als Datei teilen“"); } return; }
    if (ev.target.closest("#repHtml")){ buildReport(days); shareFile(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tagebuch</title><style>body{font:14px/1.45 -apple-system,Helvetica,Arial,sans-serif;max-width:900px;margin:20px auto;padding:0 12px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}h2{border-bottom:1px solid #999}</style></head><body>${$("#printArea").innerHTML}</body></html>`, "tagebuch-vertraeglich.html", "text/html"); return; }
    if (ev.target.closest("#repCsv")) shareCsv(days);
  };
}
function reportEntries(days){ const from = Date.now() - days * 864e5; return myEntries().filter(h => (h.src === "symptom" || isEaten(h)) && h.ts >= from); }
function buildReport(days){
  const list = reportEntries(days), ae = analysisEntries(list), derived = Object.fromEntries(ae.filter(x => x.derived).map(x => [x.id, x.reaction]));
  const a = analyze(ae, profile), cats = activeCats();
  const prg = myProgram();
  const em = me().emergency || {};
  const row = h => {
    if (h.src === "symptom") return `<tr><td>${h.free ? new Date(h.day || h.ts).toLocaleDateString("de-DE") : fmtDate(h.ts)}</td><td>${h.free ? "Beschwerdefrei" : "Beschwerden"}</td><td>${esc(h.free ? "" : Object.entries(h.sym||{}).map(([k, v]) => SYM_N[k] + " (" + SEV[v] + ")").join(", "))}${(h.factors||[]).length ? "<br><i>Begleitumstände: " + esc(h.factors.map(k => FAC_N[k]).join(", ")) + "</i>" : ""}${h.note ? "<br><i>Notiz: " + esc(h.note) + "</i>" : ""}</td><td></td></tr>`;
    const ev = evaluate(h.raw, profile);
    const rx = h.reaction ? REACT[h.reaction] : derived[h.id] ? REACT[derived[h.id]] + " (abgeleitet)" : "";
    return `<tr><td>${fmtDate(mealTime(h))}</td><td>${esc(SRC[h.src] || "")}</td><td>${esc(h.name)}${ev.total ? "<br><i>" + esc(reasonText(ev)) + "</i>" : ""}</td><td>${rx}</td></tr>`;
  };
  const verd = c => ({strong:"starker Hinweis", possible:"möglicher Hinweis", none:"kein Hinweis", unclear:"noch unklar", data:"zu wenig Daten"})[a.cats[c].verdict];
  const frac = (b, w) => w >= 0.5 ? `${Math.round(b*10)/10} von ${Math.round(w*10)/10} (${Math.round(b / w * 100)} %)` : "–";
  $("#printArea").innerHTML = `
    <h1>Ernährungs- und Symptomtagebuch</h1>
    <p>${esc(personName())} · letzte ${days} Tage (bis ${new Date().toLocaleDateString("de-DE")}) · erstellt mit ${esc(APP_CONFIG.name)}</p>
    <h2>Profil</h2>
    <p>${cats.length ? cats.map(c => esc(CATS[c]) + " (" + SENS_LBL[profile.sens[c]-1] + ")").join(", ") : "keine Angaben"}</p>
    ${Object.keys(profile.mine).length ? `<p>Eigene Markierungen: ${Object.entries(profile.mine).map(([k, v]) => esc(k) + (v === "ok" ? " (verträglich)" : " (unverträglich)")).join(", ")}</p>` : ""}
    ${em.meds || (em.pens||[]).length ? `<p>Notfallmedikation: ${esc([em.meds, ...(em.pens||[]).map(p => (p.label || "Adrenalin-Pen") + (p.exp ? " bis " + p.exp : ""))].filter(Boolean).join("; "))}</p>` : ""}
    ${prg && PROGRAMS[prg.type] ? `<h2>Ernährungsprogramm</h2><p>${esc(PROGRAMS[prg.type].n)} seit ${new Date(prg.start).toLocaleDateString("de-DE")}, aktuell Phase ${prg.phase}: ${esc(PROGRAMS[prg.type].phases[prg.phase-1].n)}</p>
      ${Object.values(prg.tests||{}).filter(t => t.state === "ok" || t.state === "bad").length ? `<p>Tests: ${Object.values(prg.tests).filter(t => t.state === "ok" || t.state === "bad").map(t => esc(testName(prg.type, t.k)) + ": " + (t.state === "ok" ? "vertragen" : "Beschwerden")).join(", ")}</p>` : ""}` : ""}
    <h2>Auswertung (Zeitraum)</h2>
    ${a.n >= 5 ? `<p>${a.n} bewertete Mahlzeiten, davon ${a.bad} schlecht vertragen. Aus Beschwerden abgeleitete Bewertungen zählen halb.</p><ul>${KEYS.filter(c => profile.on[c] || ["strong","possible"].includes(a.cats[c].verdict)).map(c => `<li>${esc(CATS[c])}: ${verd(c)} – schlecht vertragen mit ${esc(CATS[c])}-Zutaten: ${frac(a.cats[c].rE * a.cats[c].wE, a.cats[c].wE)}, ohne: ${frac(a.cats[c].rU * a.cats[c].wU, a.cats[c].wU)}</li>`).join("")}</ul>
      ${a.suspects.length ? `<p>Auffällige Zutaten: ${a.suspects.map(s => esc(s.name) + " (" + s.bad + "× schlecht, " + s.good + "× gut)").join(", ")}</p>` : ""}` : `<p>Noch zu wenige bewertete Mahlzeiten (${a.n}) für eine Auswertung.</p>`}
    <p class="small">Statistische Auffälligkeiten aus Selbstbeobachtung, keine Diagnose.</p>
    <h2>Einträge (${list.length})</h2>
    <table><thead><tr><th>Datum</th><th>Art</th><th>Was</th><th>Vertragen</th></tr></thead><tbody>${list.map(row).join("")}</tbody></table>`;
}
async function shareFile(content, name, type){
  const file = new File([content], name, {type});
  try{ if (navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title: name}); return; } }
  catch(e){ if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function shareCsv(days){
  const q = s => '"' + String(s ?? "").replace(/"/g, '""') + '"';
  const list = reportEntries(days), derived = Object.fromEntries(analysisEntries(list).filter(x => x.derived).map(x => [x.id, x.reaction]));
  const rows = [["Datum","Uhrzeit","Art","Was","Vertragen","Beschwerden","Begleitumstände","Notiz","Bewertung App"]];
  for (const h of list.slice().reverse()){
    const t = h.src === "symptom" ? h.ts : mealTime(h), d = new Date(t);
    if (h.src === "symptom") rows.push([d.toLocaleDateString("de-DE"), h.free ? "" : fmtTime(t), h.free ? "Beschwerdefrei" : "Beschwerden", "", "", Object.entries(h.sym||{}).map(([k, v]) => SYM_N[k] + " (" + SEV[v] + ")").join("; "), (h.factors||[]).map(k => FAC_N[k]).join("; "), h.note || "", ""]);
    else { const ev = evaluate(h.raw, profile); rows.push([d.toLocaleDateString("de-DE"), fmtTime(t), SRC[h.src] || "", h.name, h.reaction ? REACT[h.reaction] : derived[h.id] ? REACT[derived[h.id]] + " (abgeleitet)" : "", "", "", "", LABEL[ev.total]]); }
  }
  shareFile("﻿" + rows.map(r => r.map(q).join(";")).join("\r\n"), "tagebuch-vertraeglich.csv", "text/csv");
}

/* ================= Alternativen ================= */
const OFF_PFIELDS = "code,product_name,product_name_de,generic_name_de,brands,ingredients_text_de,ingredients_text,allergens_tags,traces_tags,labels_tags";
const hasAllergy = pr => KEYS.some(c => pr.on[c] && CAT[c].grp === "all");
/* Kandidaten aus mehreren Quellen holen: neue Suche (Search-a-licious), API v2, alte Suche – je nachdem, was erreichbar ist */
async function altCandidates(cat){
  const errs = [];
  const tries = [
    async () => { const p = new URLSearchParams({q: `categories_tags:"${cat}"`, langs: "de,en", page_size: "60"});
      const j = await fetchJson(APP_CONFIG.data.offSearch + "/search?" + p.toString(), 12000); return j.hits || []; },
    async () => { const p = new URLSearchParams({categories_tags: cat, countries_tags_en: "germany", fields: OFF_PFIELDS, page_size: "50", sort_by: "unique_scans_n"});
      const j = await fetchJson(APP_CONFIG.data.off + "/api/v2/search?" + p.toString(), 15000); return j.products || []; },
    async () => { const p = new URLSearchParams({action:"process", json:"1", tagtype_0:"categories", tag_contains_0:"contains", tag_0:cat, page_size:"50", fields:OFF_PFIELDS, sort_by:"unique_scans_n"});
      const j = await fetchJson(APP_CONFIG.data.off + "/cgi/search.pl?" + p.toString(), 15000); return j.products || []; }
  ];
  for (const t of tries){ try{ const l = await t(); if (l.length) return l; }catch(err){ errs.push(err.name === "AbortError" ? "Zeitüberschreitung" : err.message); } }
  if (errs.length === tries.length) throw new Error(errs.join(" · "));
  return [];
}
async function findAlternatives(e, out){
  const show = (h, k) => { setFb(out, h, k); out.classList.add("alt-out"); };
  show(loadingHtml("Suche Alternativen…"));
  const strict = hasAllergy(P()) || (P().on.g && P().sens.g === 3);
  try{
    const pj = await fetchJson(APP_CONFIG.data.off + "/api/v2/product/" + encodeURIComponent(e.code) + ".json?fields=categories_tags", 12000);
    const tags = (pj.product && pj.product.categories_tags) || [];
    if (!tags.length){ show(fbHtml("Keine Kategorie bekannt", "Für dieses Produkt ist bei Open Food Facts keine Kategorie hinterlegt."), "warn"); return; }
    let found = [];
    for (const cat of tags.slice(-2).reverse()){
      const cand = (await altCandidates(cat)).filter(p => p.code && p.code !== e.code);
      /* Fehlen Zutaten in der Trefferliste, Details einzeln nachladen (max. 12) */
      const need = cand.filter(p => !(p.ingredients_text_de || p.ingredients_text)).slice(0, 12);
      const det = await Promise.all(need.map(p => fetchJson(APP_CONFIG.data.off + "/api/v2/product/" + encodeURIComponent(p.code) + ".json?lc=de&fields=" + OFF_PFIELDS + ",categories_tags", 10000).then(j => j.product ? Object.assign({code: p.code}, j.product) : null).catch(() => null)));
      const full = cand.filter(p => p.ingredients_text_de || p.ingredients_text).concat(det.filter(Boolean));
      for (const prod of full){
        if (found.some(f => f.code === prod.code)) continue;
        const pr = productToRaw(prod); if (!pr || !pr.full) continue;
        const ev = evaluate(pr.raw, P());
        if (strict ? ev.total === 0 : ev.total < e._total){
          const allOk = multi() ? people.list.every(pp => evaluate(pr.raw, pp.id === people.active ? P() : normProfile(pp.profile || {})).total === 0) : null;
          found.push({code: prod.code, name: pr.name, total: ev.total, allOk});
        }
      }
      if (found.filter(f => f.total === 0).length >= 3) break;
    }
    found.sort((a, b) => a.total - b.total || (b.allOk === true) - (a.allOk === true));
    found = found.slice(0, 6);
    if (!found.length){ show(fbHtml("Keine besseren Alternativen gefunden", "In derselben Kategorie gibt es bei Open Food Facts gerade nichts, das besser zu deinem Profil passt."), ""); return; }
    out.className = "alt-out"; out.hidden = false;
    out.innerHTML = `<ul class="list">${found.map(f => `<li><button type="button" class="row-btn" data-alt-code="${esc(f.code)}">${st(f.total)}<span class="txt"><b class="ell">${esc(f.name)}</b><small>${LABEL[f.total]} für ${multi() ? esc(personName()) : "dein Profil"}${f.allOk === true ? " · passt für alle" : ""}</small></span>${SVG.chev}</button></li>`).join("")}</ul>
      <p class="hint" style="margin-top:var(--s2)">Daten von Open Food Facts können unvollständig sein – prüf vor dem Kauf die Zutatenliste auf der Packung${strict ? ", gerade bei Allergien" : ""}.</p>`;
  }catch(err){ show(fbHtml("Suche gerade nicht möglich", "Open Food Facts antwortet im Moment nicht. Versuch es später noch einmal.<br><span class=\"meta\">Details: " + esc(err.message) + "</span>", `<button type="button" class="btn btn-sm btn-secondary" data-fx="altRetry">Nochmal versuchen</button>`, SVG.warn), "err"); }
}

/* ================= Favoriten & Einkaufsliste (Tab „Essen“) ================= */
let lists = LS.get("vt_lists") || {fav: [], shop: []};
function saveLists(){ LS.set("vt_lists", lists); }
const isFav = e => lists.fav.some(f => (e.code && f.code === e.code) || (!e.code && f.name === e.name));
const itemNames = raw => JSON.stringify((raw && raw.items || []).map(i => i.n));
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
function renderFav(){
  const el = $("#eat-fav"); if (!el) return;
  el.innerHTML = lists.fav.length
    ? `<div class="card flush"><ul class="list">${lists.fav.map(f => { const ev = evaluate(f.raw, P());
        const others = multi() ? people.list.filter(p => p.id !== people.active).map(p => { const pe = evaluate(f.raw, normProfile(p.profile || {})); return !pe.cats.length && !pe.personal ? "" : `<span class="badge lv${pe.total}" title="${esc(p.name)}: ${LABEL[pe.total]}">${esc(p.name.slice(0,2))}</span>`; }).join("") : "";
        return `<li class="fav-row"><button type="button" class="row-btn" data-fav-open="${esc(f.id)}">${st(ev.total)}<span class="txt"><b class="ell">${esc(f.name)}</b><small>${LABEL[ev.total]} · <span class="fav-meta">Stand ${new Date(f.checked || f.ts).toLocaleDateString("de-DE")}${f.changed ? " · Zutaten geändert!" : ""}</span></small></span>${others ? `<span class="badges">${others}</span>` : ""}</button><button type="button" class="icon-btn" data-fav-shop="${esc(f.id)}" aria-label="${esc(f.name)} auf die Einkaufsliste">${SVG.cart}</button><button type="button" class="icon-btn" data-fav-del="${esc(f.id)}" aria-label="${esc(f.name)} entfernen">${SVG.x}</button></li>`; }).join("")}</ul></div>
      <p class="hint" style="margin:var(--s2) var(--s1) 0">Antippen lädt die aktuellen Zutaten neu – Rezepturen ändern sich manchmal.</p>`
    : `<div class="card empty">${SVG.star}<b>Noch keine Favoriten</b>Tippe im Ergebnis auf „Merken“, um sichere Produkte hier zu sammeln.</div>`;
}
function renderShop(){
  const el = $("#eat-shop"); if (!el) return;
  const open = lists.shop.filter(x => !x.done), done = lists.shop.filter(x => x.done);
  const row = x => `<li class="shop-row"><label><input type="checkbox" data-shop-id="${x.id}"${x.done ? " checked" : ""}><span>${esc(x.t)}</span></label><button type="button" class="icon-btn" data-shop-del="${x.id}" aria-label="${esc(x.t)} löschen">${SVG.x}</button></li>`;
  el.innerHTML = `<div class="card"><form class="searchrow" id="shopForm" action="#"><div class="field" style="padding-left:0"><label for="shopIn" class="sr-only">Artikel hinzufügen</label><input class="input" id="shopIn" type="text" placeholder="Artikel hinzufügen" autocomplete="off" enterkeyhint="done" style="padding-left:var(--s3)"></div><button class="btn btn-secondary" type="submit">Hinzufügen</button></form>
    ${open.length ? `<ul class="list" style="margin-top:var(--s2)">${open.map(row).join("")}</ul>` : (done.length ? "" : `<div class="empty">${SVG.cart}<b>Einkaufsliste ist leer</b>Füge Artikel hinzu${F("recipes") ? " – oder übernimm Zutaten aus einem Rezept" : ""}.</div>`)}
    ${done.length ? `<details class="disc"><summary>${SVG.chev}Erledigt (${done.length})</summary><ul class="list">${done.map(row).join("")}</ul><button type="button" class="btn btn-sm btn-outline" id="shopClear" style="margin-top:var(--s2)">Erledigte löschen</button></details>` : ""}
    ${open.length ? `<button type="button" class="btn btn-sm btn-outline" id="shopShare" style="margin-top:var(--s3)">Liste teilen</button>` : ""}</div>`;
  $("#shopForm").onsubmit = ev => { ev.preventDefault(); if (addShop([$("#shopIn").value])){ renderShop(); renderShell(); const i = $("#shopIn"); if (i) i.focus(); } };
}
async function openFav(f){
  if (!f.code){ const e = addEntry(f.name, f.raw, "text"); openEntrySheet(e, {fromCheck:true}); return; }
  const e = await lookup(f.code);
  if (e && e.raw){
    const changed = itemNames(e.raw) !== itemNames(f.raw);
    f.checked = Date.now(); f.changed = changed; if (changed){ f.raw = e.raw; toast("Achtung: Die Zutaten haben sich seit dem Merken geändert"); }
    saveLists(); renderFav();
  }
}
function wireLists(){
  $("#eat-fav").addEventListener("click", ev => {
    const o = ev.target.closest("[data-fav-open]"); if (o){ const f = lists.fav.find(x => x.id === o.dataset.favOpen); if (f) openFav(f); return; }
    const fs = ev.target.closest("[data-fav-shop]");
    if (fs){ const f = lists.fav.find(x => x.id === fs.dataset.favShop); if (f){ addShop([f.name]) ? toast("Auf die Einkaufsliste gesetzt") : toast("Steht schon auf der Liste"); renderShell(); } return; }
    const fd = ev.target.closest("[data-fav-del]");
    if (fd){ lists.fav = lists.fav.filter(x => x.id !== fd.dataset.favDel); saveLists(); renderFav(); }
  });
  $("#eat-shop").addEventListener("change", ev => { const c = ev.target.closest("[data-shop-id]"); if (!c) return; const x = lists.shop.find(s => s.id === c.dataset.shopId); if (x){ x.done = c.checked; saveLists(); setTimeout(() => { renderShop(); renderShell(); }, 350); } });
  $("#eat-shop").addEventListener("click", ev => {
    const sd = ev.target.closest("[data-shop-del]"); if (sd){ lists.shop = lists.shop.filter(x => x.id !== sd.dataset.shopDel); saveLists(); renderShop(); renderShell(); return; }
    if (ev.target.closest("#shopClear")){ lists.shop = lists.shop.filter(x => !x.done); saveLists(); renderShop(); return; }
    if (ev.target.closest("#shopShare")){ const t = lists.shop.filter(x => !x.done).map(x => "• " + x.t).join("\n");
      if (navigator.share) navigator.share({title:"Einkaufsliste", text: t}).catch(() => {}); else navigator.clipboard && navigator.clipboard.writeText(t).then(() => toast("Liste kopiert")).catch(() => {}); }
  });
}

/* ================= Ergebnis-Erweiterungen ================= */
function othersHtml(e){
  const others = people.list.filter(p => p.id !== people.active);
  return `<section class="block"><h3 class="block-title">Für die anderen</h3><div class="chips">${others.map(p => {
    const pe = evaluate(e.raw, normProfile(p.profile || {})); const none = !pe.cats.length && !pe.personal;
    return none ? `<span class="chip off">${esc(p.name)}: kein Profil</span>` : chip(pe.total, esc(p.name), ": " + LABEL[pe.total]);
  }).join("")}</div></section>`;
}
function resultExtras(e, ev, where){
  let h = "";
  const othersAllergy = multi() && people.list.some(p => p.id !== people.active && hasAllergy(normProfile(p.profile || {})));
  if (where === "top"){ h += lacBlock(e.raw); if (multi() && othersAllergy) h += othersHtml(e); return h; }
  if (multi() && !othersAllergy) h += othersHtml(e);
  if (F("lists") && e.src !== "symptom"){
    const f = isFav(e);
    h += `<div class="quick" style="margin-top:var(--s3)"><button type="button" class="btn btn-outline btn-sm" data-fx="fav" aria-pressed="${f}">${f ? SVG.starFill + "Gemerkt" : SVG.star + "Merken"}</button><button type="button" class="btn btn-outline btn-sm" data-fx="shop">${SVG.cart}Auf die Einkaufsliste</button></div>`;
  }
  if (F("alternatives") && ev.total > 0 && e.code){
    h += `<section class="block"><h3 class="block-title">Bessere Alternativen</h3><p class="hint" style="margin:-4px 0 var(--s2)">Ähnliche Produkte aus derselben Kategorie, die besser passen.</p>
      <button type="button" class="btn btn-secondary btn-block" data-fx="alt">${SVG.search}Alternativen suchen</button><div class="alt-out" hidden></div></section>`;
  }
  return h;
}
function extrasClick(ev, e, el, ev0){
  const alt = ev.target.closest("[data-alt-code]");
  if (alt){ lookup(alt.dataset.altCode); return true; }
  const b = ev.target.closest("[data-fx]"); if (!b) return false;
  const a = b.dataset.fx;
  if (a === "fav"){ toggleFav(e); showResult(e, el); renderFav(); return true; }
  if (a === "shop"){ addShop([e.name]) ? toast("Auf die Einkaufsliste gesetzt") : toast("Steht schon auf der Liste"); renderShop(); renderShell(); return true; }
  if (a === "alt" || a === "altRetry"){ e._total = ev0.total; const ab = el.querySelector('[data-fx="alt"]'); if (ab) ab.hidden = true; findAlternatives(e, el.querySelector(".alt-out")); return true; }
  return false;
}

/* ================= Ernährungsprogramm ================= */
/* tests: [key, Name, Beispiel, betroffene Kategorien, Zutaten-Schlüssel für „Meine Zutaten“] */
const PROGRAMS = {
  fodmap: {n:"Low-FODMAP", cat:"o", pause:3,
    pre:["Bei Verdacht auf Zöliakie: <b>vorher</b> testen lassen – Low-FODMAP senkt die Weizenmenge und macht den Bluttest unzuverlässig.",
         "Reizdarm sollte ärztlich gesichert sein; Warnzeichen wie Blut im Stuhl, Gewichtsverlust oder Fieber vorher abklären.",
         "Nicht bei Kindern, Untergewicht oder (früheren) Essstörungen ohne fachliche Begleitung."],
    testHow:"Teste eine Gruppe nach der anderen: 3 Tage lang steigende Mengen des Testlebensmittels (klein, mittel, normal), sonst weiter Low-FODMAP essen. Danach 2–3 Tage Pause.",
    plan:["kleine Menge","mittlere Menge","normale Portion"],
    phases:[
      {n:"Eliminationsphase", dur:"2–6 Wochen", min:14, d:"Iss möglichst nur, was bei FODMAP grün ist – die App bewertet streng. Ziel: Die Beschwerden lassen deutlich nach."},
      {n:"Wiedereinführung", dur:"ca. 6–8 Wochen", d:"Die Grundkost bleibt Low-FODMAP. Getestet wird nur das jeweilige Testlebensmittel."},
      {n:"Personalisierung", dur:"dauerhaft", d:"Iss wieder alles, was du gut vertragen hast. Was Beschwerden gemacht hat, nur in kleinen Mengen – die Verträglichkeit ist oft eine Frage der Menge."}],
    tests:[["fructose","Fruktose","z. B. Honig oder Mango",["f"],["honig","mango"]],["lactose","Laktose","z. B. Milch oder Naturjoghurt",["l","m"],["milch"]],
      ["sorbitol","Sorbit","z. B. Brombeeren oder Avocado",["s"],["avocado"]],["mannitol","Mannit","z. B. Champignons oder Blumenkohl",[],["champignons","blumenkohl"]],
      ["fructan_grain","Fruktane aus Getreide","z. B. Weizenbrot",["g","wa"],["weizenbrot","weizenmehl"]],["fructan_onion","Fruktane aus Zwiebel","z. B. Zwiebel",[],["zwiebel"]],
      ["fructan_garlic","Fruktane aus Knoblauch","z. B. Knoblauch",[],["knoblauch"]],["gos","GOS (Hülsenfrüchte)","z. B. Kichererbsen oder Linsen",["y","v","p"],["kichererbsen","linsen"]]]},
  histamin: {n:"Histaminarm", cat:"h", pause:2,
    pre:["Allergien und andere Ursachen (z. B. Mastzellerkrankung, Medikamente) möglichst vorher ärztlich abklären.",
         "Nicht bei Kindern oder Essstörungen ohne fachliche Begleitung."],
    testHow:"Führe ein Lebensmittel nach dem anderen wieder ein: eine normale Portion, dann 1–2 Tage beobachten. Reagierst du, danach erst pausieren, bis die Beschwerden abgeklungen sind.",
    plan:["Portion essen","beobachten","beobachten"],
    phases:[
      {n:"Karenzphase", dur:"10–14 Tage", min:10, d:"Histaminarm essen: frisch und unverarbeitet. Gereiftes, Fermentiertes, Alkohol und Histaminliberatoren weglassen – die App bewertet streng."},
      {n:"Testphase", dur:"bis zu 6 Wochen", d:"Einzelne Lebensmittel nacheinander wieder einführen und beobachten, wie du reagierst."},
      {n:"Dauerernährung", dur:"dauerhaft", d:"Abwechslungsreich essen und nur meiden, was du nachweislich schlecht verträgst."}],
    tests:[["cheese","Gereifter Käse","z. B. alter Gouda, Parmesan",["m"],["gouda","parmesan"]],["tomato","Tomate","erst frische Tomate, dann Tomatenmark",["t"],["tomate","tomatenmark"]],
      ["citrus","Zitrusfrüchte","z. B. Orange",[],["orange"]],["cocoa","Kakao/Schokolade","z. B. Zartbitterschokolade",["m","nu","p","y"],["kakao","schokolade"]],
      ["nuts","Nüsse","z. B. Walnuss, Cashew",["nu","p"],["walnuss","cashew"]],["fermented","Fermentiertes","z. B. Sauerkraut",[],["sauerkraut"]],
      ["cured","Gereifte Wurst","z. B. Salami",["c","u"],["salami"]],["strawberry","Erdbeeren","",[],["erdbeeren"]]]},
  fruktose: {n:"Fruktosearm", cat:"f", pause:2,
    pre:["Fruktosemalabsorption vorher ärztlich sichern lassen (H2-Atemtest).",
         "Eine <b>hereditäre Fruktoseintoleranz</b> (angeboren, sehr selten, aber gefährlich) muss ausgeschlossen sein – dann niemals Fruktose testen.",
         "Nicht bei Kindern oder Essstörungen ohne fachliche Begleitung."],
    testHow:"Teste Obst und Gemüse einzeln: über 3 Tage steigende Mengen, am besten zusammen mit einer Mahlzeit. Danach 2 Tage Pause.",
    plan:["kleine Menge","mittlere Menge","normale Portion"],
    phases:[
      {n:"Karenzphase", dur:"ca. 2–4 Wochen", min:14, d:"Fruktose- und sorbitarm essen, damit sich der Darm beruhigt – die App bewertet streng."},
      {n:"Testphase", dur:"ca. 6–8 Wochen", d:"Obst und Gemüse einzeln wieder einführen und die verträgliche Menge herausfinden. Tipp: Obst mit Eiweiß oder Fett kombinieren."},
      {n:"Dauerernährung", dur:"dauerhaft", d:"Die für dich verträgliche Menge Fruktose genießen – nur meiden, was dir nicht bekommt."}],
    tests:[["apple","Apfel","",[],["apfel"]],["pear","Birne","",[],["birne"]],["honey","Honig","",[],["honig"]],["juice","Fruchtsaft","z. B. Apfelsaft",[],["apfelsaft"]],
      ["stone","Steinobst (Sorbit)","z. B. Kirsche, Pflaume",[],["kirsche","pflaume"]],["dried","Trockenobst","z. B. Rosinen",["q"],["rosinen"]],["onion","Zwiebel/Knoblauch","Fruktane – keine Fruktose, aber oft ähnlich unverträglich",[],["zwiebel","knoblauch"]]]}
};
const testName = (type, k) => ((PROGRAMS[type] && PROGRAMS[type].tests.find(t => t[0] === k)) || [, k])[1];
const myProgram = () => { const p = settings.programs[people.active]; return p && PROGRAMS[p.type] ? p : null; };
const daysSince = ts => Math.floor((Date.now() - ts) / 864e5) + 1;
/* Test gesperrt? Allergene, Zöliakie (streng) */
function testBlock(cats){
  const pr = profile;
  const bad = (cats || []).filter(c => pr.on[c] && (CAT[c].grp === "all" || (c === "g" && pr.sens.g === 3)));
  return bad.length ? "Nicht testen – du hast " + bad.map(c => c === "g" ? "Zöliakie (Gluten streng)" : CATS[c]).join(", ") + " im Profil. Nur nach ärztlicher Rücksprache." : "";
}
function programCardHtml(){
  if (!F("program")) return "";
  const prg = myProgram(); if (!prg) return "";
  const def = PROGRAMS[prg.type], ph = def.phases[prg.phase - 1];
  const day = daysSince(prg.phaseStart || prg.start);
  const running = Object.values(prg.tests || {}).find(t => t.state === "running");
  const sub = running ? `Test: ${esc(testName(prg.type, running.k))} – Tag ${Math.min(3, daysSince(running.start))}: ${esc(def.plan[Math.min(2, daysSince(running.start) - 1)])}` : esc(ph.dur);
  return `<button type="button" class="card prog-card" data-fx="program">
    <span class="prog-steps" aria-hidden="true">${def.phases.map((_, i) => `<i class="${i < prg.phase ? "on" : ""}"></i>`).join("")}</span>
    <span class="txt"><small>${esc(def.n)} · Phase ${prg.phase} von 3</small><b>${esc(ph.n)} · Tag ${day}</b><small>${sub}</small></span>${SVG.chev}</button>`;
}
function openProgramSheet(view){
  const inn = $("#sheetIn"), prg = myProgram();
  let html;
  if (!prg && view && PROGRAMS[view]){
    const def = PROGRAMS[view];
    html = `<h3 class="h2" style="margin-top:0">${esc(def.n)}</h3><p class="meta">${def.phases.map(p => p.n + " (" + p.dur + ")").join(" → ")}</p>
      <div class="dlg"><b>Bevor du startest</b>${def.pre.map((t, i) => `<label><input type="checkbox" data-pre="${i}"><span>${t}</span></label>`).join("")}</div>
      <p class="fine">Am besten begleitet von einer Ernährungsfachkraft. Die App ersetzt keine Beratung.</p>
      <div class="sheet-actions"><button type="button" class="btn btn-primary btn-block" data-prg-go="${view}" disabled>Programm starten</button><button type="button" class="btn btn-outline btn-block" data-prg-list>Zurück</button></div>`;
  } else if (!prg){
    html = `<p class="hint" style="margin-top:0">Ein Programm führt dich in drei Phasen zu deiner persönlichen Ernährung: erst weglassen, dann gezielt testen, dann dauerhaft nur meiden, was dir nicht bekommt.</p>
      <ul class="list">${Object.entries(PROGRAMS).map(([k, d]) => `<li><button type="button" class="row-btn" data-prg-pick="${k}"><span class="txt"><b>${esc(d.n)}</b><small>${d.phases.map(p => p.n + " (" + p.dur + ")").join(" → ")}</small></span>${SVG.chev}</button></li>`).join("")}</ul>`;
  } else {
    const def = PROGRAMS[prg.type], ph = def.phases[prg.phase - 1], day = daysSince(prg.phaseStart || prg.start);
    const tests = prg.tests || {}, tState = k => (tests[k] || {}).state || "open";
    const running = Object.values(tests).find(t => t.state === "running");
    const lastEnd = Math.max(0, ...Object.values(tests).filter(t => t.end).map(t => t.end));
    const pauseLeft = Math.ceil((lastEnd + def.pause * 864e5 - Date.now()) / 864e5);
    let testHtml = "";
    if (prg.phase === 2){
      const symDuring = running ? myEntries().filter(s => s.src === "symptom" && !s.free && s.ts >= running.start && s.sev >= 2).length : 0;
      testHtml = `<section class="block"><h3 class="block-title">Tests</h3><p class="hint" style="margin:-4px 0 var(--s2)">${esc(def.testHow)}</p>
      ${!running && pauseLeft > 0 ? `<div class="note">Pause: noch ${pauseLeft} Tag${pauseLeft > 1 ? "e" : ""}, bis der nächste Test startet – damit sich Reaktionen nicht überlagern.</div>` : ""}
      <ul class="list">${def.tests.map(([k, n, ex, cats]) => { const s = tState(k), t = tests[k], block = testBlock(cats);
        const lbl = s === "ok" ? `<span class="pill p-none">vertragen</span>` : s === "bad" ? `<span class="pill p-strong">Beschwerden</span>` : s === "running" ? `<span class="pill p-possible">läuft</span>` : "";
        let act = "";
        if (s === "running"){ const d = Math.min(3, daysSince(t.start));
          act = `<ol class="steps">${def.plan.map((p, i) => `<li${i + 1 === d ? ' style="font-weight:700"' : ""}>Tag ${i + 1}: ${esc(p)}</li>`).join("")}</ol>
            ${symDuring ? `<div class="note warn">Seit Teststart ${symDuring} × Beschwerden eingetragen – das spricht für „Beschwerden“.</div>` : ""}
            <div class="quick"><button type="button" class="btn btn-sm btn-secondary" data-test-res="ok" data-k="${k}">Gut vertragen</button><button type="button" class="btn btn-sm btn-outline" data-test-res="bad" data-k="${k}">Beschwerden</button><button type="button" class="btn-link sm" data-test-reset="${k}">abbrechen</button></div>`; }
        else if (block) act = `<p class="blocked">${esc(block)}</p>`;
        else if (s === "open" && !running && pauseLeft <= 0) act = `<button type="button" class="btn btn-sm btn-outline" data-test-start="${k}">Test starten</button>`;
        else if (s === "ok" || s === "bad") act = `<button type="button" class="btn-link sm" data-test-reset="${k}">zurücksetzen</button>`;
        return `<li class="ing"><div class="ing-line"><span class="ing-name">${esc(n)}</span>${lbl}</div>${ex ? `<div class="ing-meta">${esc(ex)}</div>` : ""}${act}</li>`; }).join("")}</ul></section>`;
    }
    let summary = "";
    if (prg.phase === 3){
      const ok = def.tests.filter(t => tState(t[0]) === "ok"), bad = def.tests.filter(t => tState(t[0]) === "bad");
      summary = `<section class="block"><h3 class="block-title">Dein Ergebnis</h3><p>${ok.length} Gruppe${ok.length === 1 ? "" : "n"} vertragen, ${bad.length} mit Beschwerden.</p>
        ${bad.length ? `<p class="hint">${prg.type === "fodmap" ? "Nur in kleinen Mengen – die Schwelle kannst du später erneut austesten" : "Weiter meiden"}: ${esc(bad.map(t => t[1]).join(", "))}.</p>
          <button type="button" class="btn btn-sm btn-secondary" data-prg-apply>Als „vertrage ich nicht“ übernehmen</button>` : ""}
        ${ok.length ? `<button type="button" class="btn btn-sm btn-outline" data-prg-apply-ok style="margin-top:var(--s2)">Vertragenes als „vertrage ich“ übernehmen</button>` : ""}
        ${!bad.length && ok.length ? `<p class="hint">Alles gut vertragen – du kannst die Empfindlichkeit für ${esc(CATS[def.cat])} unter „Ich“ auf „leicht“ stellen.</p>` : ""}</section>`;
    }
    const ask = prg.phase === 1 && prg.askBetter;
    html = `<div class="prog-head"><span class="prog-steps" aria-hidden="true">${def.phases.map((_, i) => `<i class="${i < prg.phase ? "on" : ""}"></i>`).join("")}</span>
        <p class="meta">${esc(def.n)} · Phase ${prg.phase} von 3 · Tag ${day}${multi() ? " · " + esc(personName()) : ""}</p><h3 class="h2">${esc(ph.n)} <span class="meta">(${esc(ph.dur)})</span></h3><p>${esc(ph.d)}</p></div>
      ${testHtml}${summary}
      ${ask ? `<div class="dlg"><b>Geht es dir deutlich besser als vor dem Start?</b><div class="quick" style="margin-top:var(--s2)"><button type="button" class="btn btn-sm btn-primary" data-better="yes">Ja, deutlich</button><button type="button" class="btn btn-sm btn-outline" data-better="no">Nein</button></div><div id="betterNo"></div></div>` : ""}
      <div class="sheet-actions">
        ${prg.phase < 3 && !ask ? `<button type="button" class="btn btn-primary btn-block" data-prg-next>${prg.phase === 1 ? "Weiter zur Testphase" : "Weiter zur Dauerphase"}</button>${ph.min && day < ph.min ? `<p class="hint" style="text-align:center">Empfohlen sind mindestens ${ph.min} Tage – du bist bei Tag ${day}.</p>` : ""}` : ""}
        ${prg.phase > 1 ? `<button type="button" class="btn btn-outline btn-block" data-prg-back>Eine Phase zurück</button>` : ""}
        <button type="button" class="btn btn-danger btn-block" data-prg-end>Programm beenden</button>
      </div>`;
  }
  inn.innerHTML = html;
  openSheet("Ernährungsprogramm", {type:"program"});
  const upd = () => { saveSettings(); refreshAll(); openProgramSheet(); };
  inn.onchange = ev => { if (ev.target.closest("[data-pre]")){ const all = [...inn.querySelectorAll("[data-pre]")].every(c => c.checked); const g = inn.querySelector("[data-prg-go]"); if (g) g.disabled = !all; } };
  inn.onclick = ev => {
    const pick = ev.target.closest("[data-prg-pick]"); if (pick){ openProgramSheet(pick.dataset.prgPick); return; }
    if (ev.target.closest("[data-prg-list]")){ openProgramSheet(); return; }
    const go = ev.target.closest("[data-prg-go]");
    if (go && !go.disabled){ settings.programs[people.active] = {type: go.dataset.prgGo, start: Date.now(), phaseStart: Date.now(), phase: 1, tests: {}, phaseLog: [{phase:1, ts: Date.now()}]};
      upd(); toast(PROGRAMS[go.dataset.prgGo].n + " gestartet"); return; }
    const p = myProgram(); if (!p) return;
    if (ev.target.closest("[data-prg-next]")){ if (p.phase === 1){ p.askBetter = true; openProgramSheet(); return; } p.phase = 3; p.phaseStart = Date.now(); (p.phaseLog = p.phaseLog || []).push({phase:3, ts: Date.now()}); upd(); return; }
    const better = ev.target.closest("[data-better]");
    if (better){
      if (better.dataset.better === "yes"){ p.askBetter = false; p.phase = 2; p.phaseStart = Date.now(); (p.phaseLog = p.phaseLog || []).push({phase:2, ts: Date.now()}); upd(); }
      else $("#betterNo").innerHTML = `<div class="note warn">Dann ist ${esc(PROGRAMS[p.type].n.toLowerCase())}e Kost vermutlich nicht der Schlüssel. Testen lohnt sich so nicht – lass die Beschwerden ärztlich abklären und sprich über andere Ursachen.</div><button type="button" class="btn-link sm" data-better-continue>Trotzdem weiter zur Testphase</button>`;
      return;
    }
    if (ev.target.closest("[data-better-continue]")){ p.askBetter = false; p.phase = 2; p.phaseStart = Date.now(); upd(); return; }
    if (ev.target.closest("[data-prg-back]")){ p.askBetter = false; p.phase = Math.max(1, p.phase - 1); p.phaseStart = Date.now(); (p.phaseLog = p.phaseLog || []).push({phase:p.phase, ts: Date.now()}); upd(); return; }
    const end = ev.target.closest("[data-prg-end]");
    if (end){ if (end.dataset.c){ delete settings.programs[people.active]; saveSettings(); closeSheet(); refreshAll(); toast("Programm beendet"); } else { end.dataset.c = "1"; end.classList.add("armed"); end.textContent = "Wirklich beenden? Nochmal tippen"; } return; }
    const ts = ev.target.closest("[data-test-start]");
    if (ts){ p.tests[ts.dataset.testStart] = {k: ts.dataset.testStart, state: "running", start: Date.now()}; upd(); return; }
    const tr = ev.target.closest("[data-test-res]");
    if (tr){ const t = p.tests[tr.dataset.k]; if (t){ t.state = tr.dataset.testRes; t.end = Date.now(); upd(); } return; }
    const tz = ev.target.closest("[data-test-reset]");
    if (tz){ delete p.tests[tz.dataset.testReset]; upd(); return; }
    const ap = ev.target.closest("[data-prg-apply],[data-prg-apply-ok]");
    if (ap){ const want = ap.hasAttribute("data-prg-apply") ? "bad" : "ok", val = want === "bad" ? "bad" : "ok";
      PROGRAMS[p.type].tests.filter(t => ((p.tests[t[0]] || {}).state) === want).forEach(t => (t[4] || []).forEach(k => profile.mine[k] = val));
      saveProfile(); refreshAll(); toast("Unter „Meine Zutaten“ übernommen"); }
  };
}

/* ================= Allergiekarte ================= */
const CARD_LANGS = {de:"Deutsch", en:"English", it:"Italiano", es:"Español", fr:"Français", nl:"Nederlands"};
const CARD_TXT = {
  de:{t:"Bitte beachten: Lebensmittelallergie / -unverträglichkeit", n:"Name", ha:"Allergie – bitte strikt vermeiden, auch Spuren:", hi:"Unverträglichkeit – bitte möglichst weglassen:", a:"Bitte bereiten Sie mein Essen ohne diese Zutaten zu – auch nicht in Soßen, Brühen, Dressings oder im Frittierfett.", s:"Schon kleinste Mengen und Spuren können bei mir eine schwere allergische Reaktion auslösen. Bitte achten Sie auf saubere Utensilien und eine separate Fritteuse.", c:"Ich habe Zöliakie. Schon Spuren von Gluten machen mich krank – bitte getrennte Bretter, Töpfe und Frittierfett verwenden und kein Nudelwasser oder Mehl zum Binden.", e:"Ich habe ein Notfallset dabei. Im Notfall bitte sofort den Notruf 112 wählen.", u:"Wenn Sie unsicher sind, sagen Sie es mir bitte – ich wähle dann gern etwas anderes.", d:"Vielen Dank!"},
  en:{t:"Please note: food allergy / intolerance", n:"Name", ha:"Allergy – please avoid strictly, including traces:", hi:"Intolerance – please leave out if possible:", a:"Please prepare my meal without these ingredients – including in sauces, stocks, dressings and frying oil.", s:"Even tiny amounts and traces can cause a severe allergic reaction. Please use clean utensils and a separate fryer.", c:"I have coeliac disease. Even traces of gluten make me ill – please use separate boards, pans and frying oil, and no pasta water or flour for thickening.", e:"I carry an emergency kit. In an emergency, please call 112 immediately.", u:"If you are unsure, please tell me – I'm happy to choose something else.", d:"Thank you very much!"},
  it:{t:"Attenzione: allergia / intolleranza alimentare", n:"Nome", ha:"Allergia – da evitare rigorosamente, anche in tracce:", hi:"Intolleranza – se possibile, da evitare:", a:"Per favore preparate il mio piatto senza questi ingredienti – nemmeno nelle salse, nei brodi, nei condimenti né nell'olio di frittura.", s:"Anche piccolissime quantità e tracce possono provocarmi una grave reazione allergica. Per favore usate utensili puliti e una friggitrice separata.", c:"Sono celiaco/a. Anche tracce di glutine mi fanno stare male – per favore usate taglieri, pentole e olio di frittura separati, niente acqua della pasta né farina per addensare.", e:"Porto con me un kit di emergenza. In caso di emergenza chiamate subito il 112.", u:"Se non siete sicuri, ditemelo per favore – sceglierò volentieri qualcos'altro.", d:"Grazie mille!"},
  es:{t:"Atención: alergia / intolerancia alimentaria", n:"Nombre", ha:"Alergia – evitar estrictamente, incluso trazas:", hi:"Intolerancia – por favor, evitar si es posible:", a:"Por favor, preparen mi comida sin estos ingredientes, ni siquiera en salsas, caldos o aliños, ni en el aceite de freír.", s:"Incluso cantidades mínimas y trazas pueden provocarme una reacción alérgica grave. Por favor, usen utensilios limpios y una freidora aparte.", c:"Soy celíaco/a. Incluso trazas de gluten me hacen daño: por favor, usen tablas, ollas y aceite de freír aparte, y nada de agua de cocer pasta ni harina para espesar.", e:"Llevo un kit de emergencia. En caso de emergencia, llamen inmediatamente al 112.", u:"Si no están seguros, díganmelo por favor; con gusto elegiré otra cosa.", d:"¡Muchas gracias!"},
  fr:{t:"Attention : allergie / intolérance alimentaire", n:"Nom", ha:"Allergie – à éviter strictement, même à l'état de traces :", hi:"Intolérance – à éviter si possible :", a:"Merci de préparer mon plat sans ces ingrédients – ni dans les sauces, les bouillons ou les vinaigrettes, ni dans l'huile de friture.", s:"Même d'infimes quantités ou des traces peuvent provoquer chez moi une réaction allergique grave. Merci d'utiliser des ustensiles propres et une friteuse séparée.", c:"Je suis cœliaque. Même des traces de gluten me rendent malade – merci d'utiliser des planches, des casseroles et une huile de friture séparées, sans eau de cuisson des pâtes ni farine pour lier.", e:"J'ai sur moi une trousse d'urgence. En cas d'urgence, appelez immédiatement le 112.", u:"Si vous avez un doute, dites-le-moi s'il vous plaît – je choisirai volontiers autre chose.", d:"Merci beaucoup !"},
  nl:{t:"Let op: voedselallergie / -intolerantie", n:"Naam", ha:"Allergie – strikt vermijden, ook sporen:", hi:"Intolerantie – graag zo veel mogelijk weglaten:", a:"Bereid mijn maaltijd alstublieft zonder deze ingrediënten – ook niet in sauzen, bouillons, dressings of frituurolie.", s:"Zelfs zeer kleine hoeveelheden en sporen kunnen bij mij een ernstige allergische reactie veroorzaken. Gebruik alstublieft schoon keukengerei en een aparte frituur.", c:"Ik heb coeliakie. Zelfs sporen van gluten maken me ziek – gebruik alstublieft aparte snijplanken, pannen en frituurolie, en geen pastawater of bloem om te binden.", e:"Ik heb een noodset bij me. Bel in een noodgeval direct 112.", u:"Als u twijfelt, laat het me dan weten – ik kies graag iets anders.", d:"Hartelijk dank!"}
};
const CARD_CAT = {
  h:{de:"Histamin (z. B. gereifter Käse, Salami, Tomaten, Spinat, Essig, Wein, Thunfisch)", en:"histamine (e.g. aged cheese, salami, tomatoes, spinach, vinegar, wine, tuna)", it:"istamina (ad es. formaggi stagionati, salame, pomodori, spinaci, aceto, vino, tonno)", es:"histamina (p. ej. queso curado, salami, tomate, espinacas, vinagre, vino, atún)", fr:"histamine (p. ex. fromages affinés, saucisson, tomates, épinards, vinaigre, vin, thon)", nl:"histamine (bijv. oude of belegen kaas, salami, tomaten, spinazie, azijn, wijn, tonijn)"},
  f:{de:"Fruktose (z. B. Apfel, Birne, Honig, Fruchtsaft, Sorbit)", en:"fructose (e.g. apple, pear, honey, fruit juice, sorbitol)", it:"fruttosio (ad es. mela, pera, miele, succo di frutta, sorbitolo)", es:"fructosa (p. ej. manzana, pera, miel, zumo de fruta, sorbitol)", fr:"fructose (p. ex. pomme, poire, miel, jus de fruits, sorbitol)", nl:"fructose (bijv. appel, peer, honing, vruchtensap, sorbitol)"},
  s:{de:"Sorbit (E420, z. B. in zuckerfreien Süßwaren, Steinobst)", en:"sorbitol (E420, e.g. in sugar-free sweets, stone fruit)", it:"sorbitolo (E420, ad es. nei dolci senza zucchero, frutta con nocciolo)", es:"sorbitol (E420, p. ej. en dulces sin azúcar, fruta de hueso)", fr:"sorbitol (E420, p. ex. confiseries sans sucre, fruits à noyau)", nl:"sorbitol (E420, bijv. in suikervrij snoep, steenvruchten)"},
  l:{de:"Laktose (Milchzucker: Milch, Sahne, Joghurt, Quark, Frischkäse)", en:"lactose (milk sugar: milk, cream, yoghurt, soft cheese)", it:"lattosio (latte, panna, yogurt, formaggi freschi)", es:"lactosa (leche, nata, yogur, queso fresco)", fr:"lactose (lait, crème, yaourt, fromage frais)", nl:"lactose (melk, room, yoghurt, verse kaas)"},
  g:{de:"Gluten (Weizen, Dinkel, Roggen, Gerste – auch Paniermehl, gebundene Soßen, Bier)", en:"gluten (wheat, spelt, rye, barley – also breadcrumbs, thickened sauces, beer)", it:"glutine (frumento, farro, segale, orzo – anche pangrattato, salse addensate, birra)", es:"gluten (trigo, espelta, centeno, cebada – también pan rallado, salsas espesadas, cerveza)", fr:"gluten (blé, épeautre, seigle, orge – aussi chapelure, sauces liées, bière)", nl:"gluten (tarwe, spelt, rogge, gerst – ook paneermeel, gebonden sauzen, bier)"},
  g3:{de:"Gluten (Weizen, Dinkel, Roggen, Gerste, nicht glutenfreier Hafer – auch Paniermehl, gebundene Soßen, Bier)", en:"gluten (wheat, spelt, rye, barley, non-gluten-free oats – also breadcrumbs, thickened sauces, beer)", it:"glutine (frumento, farro, segale, orzo, avena non certificata – anche pangrattato, salse addensate, birra)", es:"gluten (trigo, espelta, centeno, cebada, avena no certificada – también pan rallado, salsas espesadas, cerveza)", fr:"gluten (blé, épeautre, seigle, orge, avoine non certifiée – aussi chapelure, sauces liées, bière)", nl:"gluten (tarwe, spelt, rogge, gerst, niet-glutenvrije haver – ook paneermeel, gebonden sauzen, bier)"},
  o:{de:"FODMAP (v. a. Zwiebel, Knoblauch, Weizen, Hülsenfrüchte, Apfel, Milch/Laktose)", en:"FODMAPs (especially onion, garlic, wheat, legumes, apple, milk/lactose)", it:"FODMAP (soprattutto cipolla, aglio, frumento, legumi, mela, latte/lattosio)", es:"FODMAP (sobre todo cebolla, ajo, trigo, legumbres, manzana, leche/lactosa)", fr:"FODMAP (surtout oignon, ail, blé, légumineuses, pomme, lait/lactose)", nl:"FODMAP's (vooral ui, knoflook, tarwe, peulvruchten, appel, melk/lactose)"},
  t:{de:"Tomate in jeder Form (auch Tomatenmark, Ketchup, Gewürzmischungen)", en:"tomato in any form (incl. tomato paste, ketchup, spice mixes)", it:"pomodoro in qualsiasi forma (anche concentrato, ketchup, miscele di spezie)", es:"tomate en cualquier forma (también concentrado, kétchup, mezclas de especias)", fr:"tomate sous toutes ses formes (aussi concentré, ketchup, mélanges d'épices)", nl:"tomaat in elke vorm (ook tomatenpuree, ketchup, kruidenmengsels)"},
  m:{de:"Milch und Milchprodukte (auch Butter, Käse, laktosefreie Milch)", en:"milk and dairy (incl. butter, cheese, lactose-free milk)", it:"latte e latticini (anche burro, formaggio, latte senza lattosio)", es:"leche y lácteos (también mantequilla, queso, leche sin lactosa)", fr:"lait et produits laitiers (y compris beurre, fromage, lait sans lactose)", nl:"melk en zuivel (ook boter, kaas, lactosevrije melk)"},
  e:{de:"Ei (auch Mayonnaise, Eiernudeln, Panade)", en:"egg (incl. mayonnaise, egg pasta, batter)", it:"uova (anche maionese, pasta all'uovo, pastella)", es:"huevo (también mayonesa, pasta al huevo, rebozados)", fr:"œuf (y compris mayonnaise, pâtes aux œufs, panure)", nl:"ei (ook mayonaise, eiernoedels, beslag)"},
  y:{de:"Soja (auch Sojasauce, Tofu)", en:"soy (incl. soy sauce, tofu)", it:"soia (anche salsa di soia, tofu)", es:"soja (también salsa de soja, tofu)", fr:"soja (y compris sauce soja, tofu)", nl:"soja (ook sojasaus, tofu)"},
  nu:{de:"Schalenfrüchte / Nüsse (Mandel, Haselnuss, Walnuss, Cashew, Pistazie u. a.)", en:"tree nuts (almond, hazelnut, walnut, cashew, pistachio etc.)", it:"frutta a guscio (mandorle, nocciole, noci, anacardi, pistacchi ecc.)", es:"frutos de cáscara (almendra, avellana, nuez, anacardo, pistacho, etc.)", fr:"fruits à coque (amande, noisette, noix, cajou, pistache, etc.)", nl:"schaalvruchten / noten (amandel, hazelnoot, walnoot, cashew, pistache enz.)"},
  p:{de:"Erdnüsse (auch Erdnussöl)", en:"peanuts (incl. peanut oil)", it:"arachidi (anche olio di arachidi)", es:"cacahuetes (también aceite de cacahuete)", fr:"arachides / cacahuètes (y compris huile d'arachide)", nl:"pinda's (ook pindaolie)"},
  c:{de:"Sellerie (auch Selleriesalz, Brühe)", en:"celery (incl. celery salt, stock)", it:"sedano (anche sale al sedano, brodo)", es:"apio (también sal de apio, caldo)", fr:"céleri (y compris sel de céleri, bouillon)", nl:"selderij (ook selderijzout, bouillon)"},
  u:{de:"Senf", en:"mustard", it:"senape", es:"mostaza", fr:"moutarde", nl:"mosterd"},
  z:{de:"Sesam (auch Tahin)", en:"sesame (incl. tahini)", it:"sesamo (anche tahina)", es:"sésamo (también tahini)", fr:"sésame (y compris tahini)", nl:"sesam (ook tahin)"},
  i:{de:"Fisch (auch Fischsauce)", en:"fish (incl. fish sauce)", it:"pesce (anche salsa di pesce)", es:"pescado (también salsa de pescado)", fr:"poisson (y compris sauce de poisson)", nl:"vis (ook vissaus)"},
  kr:{de:"Krebstiere (Garnelen, Krabben, Hummer)", en:"crustaceans (shrimp, prawns, crab, lobster)", it:"crostacei (gamberi, granchi, aragosta)", es:"crustáceos (gambas, cangrejo, langosta)", fr:"crustacés (crevettes, crabe, homard)", nl:"schaaldieren (garnalen, krab, kreeft)"},
  w:{de:"Weichtiere (Muscheln, Tintenfisch, Schnecken)", en:"molluscs (mussels, clams, squid, octopus, snails)", it:"molluschi (cozze, vongole, calamari, polpo, lumache)", es:"moluscos (mejillones, almejas, calamar, pulpo, caracoles)", fr:"mollusques (moules, palourdes, calmar, poulpe, escargots)", nl:"weekdieren (mosselen, inktvis, slakken)"},
  v:{de:"Lupine (Lupinenmehl)", en:"lupin (lupin flour)", it:"lupini (farina di lupini)", es:"altramuz (harina de altramuz)", fr:"lupin (farine de lupin)", nl:"lupine (lupinemeel)"},
  wa:{de:"Weizen in jeder Form (auch Dinkel, Hartweizen, Weizenstärke, Paniermehl, Couscous)", en:"wheat in any form (incl. spelt, durum wheat, wheat starch, breadcrumbs, couscous)", it:"frumento in qualsiasi forma (anche farro, grano duro, amido di frumento, pangrattato, cuscus)", es:"trigo en cualquier forma (también espelta, trigo duro, almidón de trigo, pan rallado, cuscús)", fr:"blé sous toutes ses formes (y compris épeautre, blé dur, amidon de blé, chapelure, couscous)", nl:"tarwe in elke vorm (ook spelt, durumtarwe, tarwezetmeel, paneermeel, couscous)"},
  q:{de:"Sulfite (Schwefel, z. B. in Wein, Trockenobst)", en:"sulphites (e.g. in wine, dried fruit)", it:"solfiti (ad es. nel vino, frutta secca)", es:"sulfitos (p. ej. en el vino, fruta seca)", fr:"sulfites (p. ex. dans le vin, fruits secs)", nl:"sulfieten (bijv. in wijn, gedroogd fruit)"}
};
function cardHtml(){
  const lang = settings.cardLang || "en", T = CARD_TXT[lang], cats = activeCats();
  const celiac = profile.on.g && profile.sens.g === 3;
  const all = cats.filter(c => CAT[c].grp === "all"), intol = cats.filter(c => CAT[c].grp !== "all" && !(c === "g" && celiac));
  const em = me().emergency || {};
  const li = c => `<li>${esc((CARD_CAT[c === "g" && celiac ? "g3" : c] || {})[lang] || CATS[c])}</li>`;
  const strictList = all.concat(celiac ? ["g"] : []);
  return `<div class="chipbar" role="group" aria-label="Sprache" style="margin-bottom:var(--s3)">${Object.entries(CARD_LANGS).map(([k, n]) => `<button type="button" aria-pressed="${k===lang}" data-lang="${k}">${n}</button>`).join("")}</div>
    ${cats.length ? `<div class="acard" lang="${lang}"><p class="acard-t">${SVG.warn}${esc(T.t)}</p>
      ${people.list.length > 1 || personName() !== "Ich" ? `<p class="who">${esc(T.n)}: <b>${esc(personName())}</b></p>` : ""}
      ${strictList.length ? `<h4>${esc(T.ha)}</h4><ul>${strictList.map(li).join("")}</ul>${celiac ? `<p>${esc(T.c)}</p>` : ""}${all.length ? `<p class="acard-s">${esc(T.s)}</p>` : ""}` : ""}
      ${intol.length ? `<h4>${esc(T.hi)}</h4><ul>${intol.map(li).join("")}</ul>` : ""}
      <p>${esc(T.a)}</p>${all.length && (em.pens || []).length ? `<p><b>${esc(T.e)}</b></p>` : ""}<p>${esc(T.u)}</p><p><b>${esc(T.d)}</b></p></div>
      <p class="fine">Tipp: Bildschirmhelligkeit hochdrehen und das Handy der Bedienung zeigen.</p>`
    : `<div class="empty">${SVG.user}<b>Noch kein Profil aktiv</b>Wähle unter „Ich“ aus, was du nicht verträgst – dann erscheint es hier.</div>`}`;
}

/* ================= Notfall (Tab) ================= */
const PEN_WARN_DAYS = 60;
function penWarnings(person){
  if (!F("emergency")) return [];
  const em = (person || me()).emergency || {}, now = new Date();
  return (em.pens || []).filter(p => p.exp).map(p => {
    const [y, m] = p.exp.split("-").map(Number), end = new Date(y, m, 0, 23, 59);
    return {label: p.label || "Adrenalin-Pen", days: Math.ceil((end - now) / 864e5)};
  }).filter(x => x.days <= PEN_WARN_DAYS);
}
const dayWord = n => n === 1 ? "1 Tag" : n + " Tagen";
const penTxt = x => esc(x.label) + (x.days < 0 ? " ist abgelaufen" : " läuft in " + dayWord(x.days) + " ab");
const PLAN_DEFAULT = [
  "Anzeichen einer schweren Reaktion: Atemnot, Heiserkeit, Schwellung von Zunge oder Hals, Schwindel, Kreislaufprobleme, Erbrechen nach Kontakt mit dem Allergen, Benommenheit.",
  "Adrenalin-Autoinjektor sofort in den äußeren Oberschenkel – auch durch die Kleidung. Ein abgelaufener Pen ist im Notfall besser als keiner.",
  "Notruf 112 wählen und „Anaphylaxie“ sagen.",
  "Nicht aufstehen oder herumlaufen. Bei Atemnot aufrecht sitzen, bei Schwindel hinlegen und Beine hochlagern. Bewusstlos: stabile Seitenlage. Keine normale Atmung: Wiederbelebung.",
  "Bessert sich nichts, nach 5–15 Minuten den zweiten Pen geben, falls vorhanden.",
  "Antihistaminikum und Kortison wie verordnet zusätzlich – sie ersetzen kein Adrenalin.",
  "Auch wenn es besser wird: immer ins Krankenhaus. Die Reaktion kann wiederkommen."
];
function renderSos(){
  const el = $("#sosBody"); if (!el) return;
  let h = "";
  if (F("emergency")){
    const em = me().emergency || {}, pens = em.pens || [], warn = penWarnings();
    const allergies = activeCats().filter(c => CAT[c].grp === "all" || (c === "g" && profile.sens.g === 3));
    h += `<div class="sos-call"><a class="btn btn-danger btn-lg" href="tel:112">Notruf 112</a>${em.contactPhone ? `<a class="btn btn-secondary btn-lg" href="tel:${esc(em.contactPhone.replace(/[^\d+]/g, ""))}">${esc(em.contactName || "Kontakt")}</a>` : ""}</div>
      <p class="fine" style="margin-top:var(--s1)">112 gilt in der ganzen EU.${em.contactPhone ? " " + esc(em.contactName || "Notfallkontakt") + ": " + esc(em.contactPhone) : ""}</p>
      <section class="card"><div class="sos-who"><span class="meta">Notfallinfo</span><b>${esc(personName())}</b><span>${allergies.length ? "Allergie: " + esc(allergies.map(c => c === "g" ? "Zöliakie" : CATS[c]).join(", ")) : "Keine Allergie im Profil"}</span>${em.meds ? `<span>Medikamente: ${esc(em.meds)}</span>` : ""}</div></section>
      ${warn.length ? `<div class="feedback fb-${warn.some(x => x.days < 0) ? "err" : "warn"}">${fbHtml(warn.map(penTxt).join(" · "), "Rechtzeitig ein neues Rezept besorgen.", "", SVG.warn)}</div>` : ""}
      ${allergies.length && pens.length < 2 ? `<div class="note">Empfehlung: immer 2 Adrenalin-Pens dabeihaben.</div>` : ""}
      ${profile.on.wa ? `<div class="note">Weizenallergie mit Reaktion nur bei Anstrengung (WDEIA)? Dann nach Weizen einige Stunden (oft 4–6) keinen Sport, keinen Alkohol und keine Schmerzmittel wie Ibuprofen oder ASS – genaue Regeln mit deiner Ärztin oder deinem Arzt absprechen.</div>` : ""}
      <section class="card"><h2 class="h2">Notfallplan</h2><ol class="steps">${(em.plan ? em.plan.split(/\n+/).filter(Boolean) : PLAN_DEFAULT).map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        ${em.plan ? "" : `<p class="hint">Allgemeiner Ablauf nach den Leitlinien – maßgeblich ist der Notfallplan deiner Ärztin oder deines Arztes. Du kannst ihn unten eintragen.</p>`}</section>
      ${pens.length ? `<section class="card"><h2 class="h2">Adrenalin-Pens</h2><ul class="list">${pens.map(p => `<li class="ing"><div class="ing-line"><span class="ing-name">${esc(p.label || "Adrenalin-Pen")}</span><span class="meta">gültig bis ${esc(p.exp ? p.exp.split("-").reverse().join("/") : "–")}</span></div></li>`).join("")}</ul></section>` : ""}
      <button type="button" class="btn btn-outline btn-block" data-fx="emEdit">Notfallangaben bearbeiten</button>`;
  }
  if (F("card")){
    h += F("emergency") ? `<h2 class="section-title" style="margin-top:var(--s5)">Allergiekarte</h2><button type="button" class="card row-btn" data-fx="card" style="width:100%"><span class="ico">${SVG.card}</span><span class="txt"><b>Allergiekarte zeigen</b><small>Für Restaurant und Urlaub – in 6 Sprachen</small></span>${SVG.chev}</button>`
      : `<div id="cardInline">${cardHtml()}</div>`;
  }
  el.innerHTML = h;
}
function openCardSheet(){
  $("#sheetIn").innerHTML = cardHtml();
  openSheet("Allergiekarte", {type:"card"});
  $("#sheetIn").onclick = ev => { const l = ev.target.closest("[data-lang]"); if (l){ settings.cardLang = l.dataset.lang; saveSettings(); openCardSheet(); } };
}
function openEmergencyEdit(){
  const inn = $("#sheetIn"), em = me().emergency || {}, pens = em.pens || [];
  inn.innerHTML = `<form id="emForm" action="#">
    ${multi() ? `<p class="hint" style="margin-top:0">Angaben für <b>${esc(personName())}</b>.</p>` : ""}
    <label class="label" for="emCN" style="margin-top:0">Notfallkontakt – Name</label><input class="input" id="emCN" type="text" autocomplete="off" value="${esc(em.contactName || "")}">
    <label class="label" for="emCP">Telefonnummer</label><input class="input" id="emCP" type="tel" autocomplete="off" value="${esc(em.contactPhone || "")}">
    <label class="label">Adrenalin-Pens <span class="opt">(Ablaufmonat steht auf dem Pen)</span></label>
    <div id="emPens">${(pens.length ? pens : [{}]).map((p, i) => `<div class="pen-row"><input class="input" type="text" placeholder="z. B. Pen Handtasche" data-pen-l="${i}" value="${esc(p.label || "")}" aria-label="Bezeichnung"><input class="input" type="month" data-pen-e="${i}" value="${esc(p.exp || "")}" aria-label="Ablaufmonat"></div>`).join("")}</div>
    <button type="button" class="btn-link sm" data-em-addpen>+ weiteren Pen hinzufügen</button>
    <label class="label" for="emMeds">Notfallmedikamente <span class="opt">(optional)</span></label><input class="input" id="emMeds" type="text" autocomplete="off" value="${esc(em.meds || "")}">
    <label class="label" for="emPlan">Eigener Notfallplan <span class="opt">(ein Schritt pro Zeile, optional)</span></label><textarea class="input" id="emPlan" rows="5">${esc(em.plan || "")}</textarea>
    <div class="sheet-actions"><button type="submit" class="btn btn-primary btn-block">Speichern</button></div></form>`;
  openSheet("Notfallangaben", {type:"emergency"});
  $("#emForm").onsubmit = ev => {
    ev.preventDefault();
    const pens2 = [...inn.querySelectorAll("[data-pen-l]")].map(l => ({label: l.value.trim(), exp: (inn.querySelector(`[data-pen-e="${l.dataset.penL}"]`) || {}).value || ""})).filter(p => p.label || p.exp);
    me().emergency = {contactName: $("#emCN").value.trim(), contactPhone: $("#emCP").value.trim(), pens: pens2, meds: $("#emMeds").value.trim(), plan: $("#emPlan").value.trim()};
    syncPerson(); closeSheet(); refreshAll(); toast("Notfallangaben gespeichert");
  };
  inn.onclick = ev => {
    if (ev.target.closest("[data-em-addpen]")){ const box = $("#emPens"), i = box.children.length;
      box.insertAdjacentHTML("beforeend", `<div class="pen-row"><input class="input" type="text" placeholder="Bezeichnung" data-pen-l="${i}" aria-label="Bezeichnung"><input class="input" type="month" data-pen-e="${i}" aria-label="Ablaufmonat"></div>`); }
  };
}

/* ================= Personen verwalten ================= */
function openPeopleSheet(){
  const inn = $("#sheetIn");
  inn.innerHTML = `<p class="hint" style="margin-top:0">Jede Person hat ihr eigenes Profil, Tagebuch, Programm und ihre Notfallangaben. Bei jedem Ergebnis siehst du, für wen das Produkt passt.</p>
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
    if (d){ if (d.dataset.c){ const id = d.dataset.personDel; people.list = people.list.filter(x => x.id !== id); history = history.filter(h => (h.who || "main") !== id); delete settings.programs[id]; saveHistory(); saveSettings();
        if (people.active === id) switchPerson("main"); else syncPerson(); openPeopleSheet(); toast("Profil gelöscht"); }
      else { d.dataset.c = "1"; d.classList.add("armed"); d.setAttribute("aria-label", "Wirklich löschen? Nochmal tippen"); toast("Nochmal tippen zum Löschen – Tagebuch dieser Person wird mitgelöscht"); } }
  };
}

/* ================= Funktionen verwalten ================= */
function featureListHtml(sel, rec, only){
  return FEATURES.filter(f => !only || only(f)).map(f => {
    const on = sel.has(f.k), dep = f.needs && !sel.has(f.needs);
    return `<li class="cat-row"><label class="cat-toggle"><span class="txt"><b>${esc(f.n)}${rec && rec.has(f.k) ? ` <span class="tag-rec">empfohlen</span>` : ""}</b><small>${esc(f.d)} · erscheint unter „${esc(f.where)}“${dep ? ` · braucht „${esc(FEAT[f.needs].n)}“` : ""}</small></span><span class="sw"><input type="checkbox" role="switch" data-feat="${f.k}"${on ? " checked" : ""}><span></span></span></label></li>`;
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
    if (F("family")) pc.innerHTML = `<div class="group-hd"><h2 class="h2">Profil von ${esc(personName())}</h2><span class="count">${people.list.length} Person${people.list.length > 1 ? "en" : ""}</span></div>
      <p class="hint" style="margin-top:2px">Alle Einstellungen auf dieser Seite gelten für das aktive Profil.</p>
      <button type="button" class="btn btn-secondary btn-block" data-fx="people" style="margin-top:var(--s2)">Profil wechseln oder hinzufügen</button>`;
  }
}
function setFeature(k, on){
  settings.features[k] = on;
  if (on && FEAT[k].needs) settings.features[FEAT[k].needs] = true;
  if (!on) FEATURES.filter(f => f.needs === k).forEach(f => settings.features[f.k] = false);
  saveSettings(); refreshAll();
}

/* ================= Navigation & Aufbau nach Funktionen ================= */
const EAT_SECTIONS = [["foods","Lebensmittel","foods"],["recipes","Rezepte","recipes"],["fav","Favoriten","lists"],["shop","Einkauf","lists"]];
let eatSection = "foods";
function eatAvail(){ return EAT_SECTIONS.filter(s => F(s[2])); }
function renderEat(){
  const av = eatAvail(); if (!av.length) return;
  if (!av.some(s => s[0] === eatSection)) eatSection = av[0][0];
  const open = lists.shop.filter(x => !x.done).length;
  $("#eatSeg").hidden = av.length < 2;
  $("#eatSeg").innerHTML = av.map(s => `<button type="button" role="tab" aria-selected="${s[0] === eatSection}" aria-pressed="${s[0] === eatSection}" data-eat-sec="${s[0]}">${s[1]}${s[0] === "shop" && open ? ` (${open})` : ""}</button>`).join("");
  EAT_SECTIONS.forEach(s => { const p = $("#eat-" + s[0]); if (p) p.hidden = s[0] !== eatSection; });
  if (eatSection === "fav") renderFav();
  if (eatSection === "shop") renderShop();
}
function renderShell(){
  /* Tabs */
  const eat = eatAvail();
  TITLES.eat = eat.length === 1 ? eat[0][1] : "Essen";
  $("#tlEat").textContent = eat.length === 1 && eat[0][0] === "shop" ? "Einkauf" : TITLES.eat;
  TITLES.sos = F("emergency") ? "Notfall" : "Allergiekarte";
  $("#tlSos").textContent = F("emergency") ? "Notfall" : "Karte";
  const vis = {check:true, eat: eat.length > 0, diary: F("diary"), sos: F("emergency") || F("card"), prof:true};
  Object.entries(vis).forEach(([v, on]) => { const b = $(`.tabbar [data-v="${v}"]`); if (b) b.hidden = !on; });
  const cur = ($$(".view.on")[0] || {}).id;
  if (cur && !vis[cur.slice(2)]) goView("check");
  if (cur === "v-eat") $("#viewTitle").textContent = TITLES.eat;
  if (cur === "v-sos"){ $("#viewTitle").textContent = TITLES.sos; renderSos(); }
  if (cur === "v-eat") renderEat();
  const mi = $("#menuItem"); if (mi) mi.hidden = !F("menu");
  const open = openRatings().length, nd = $("#numDiary"); if (nd){ nd.hidden = !open || !F("diary"); nd.textContent = open; }
  renderThemeCard();
  renderDataCard();
  /* Hinweise als Punkte am Tab statt Karten auf „Prüfen“ */
  $("#dotSos").hidden = !penWarnings().length;
  $("#dotMe").hidden = !settings.newHint;
  /* Tagebuch: Programm oben */
  const pt = $("#progTop"); if (pt) pt.innerHTML = F("diary") ? programCardHtml() : "";
  /* Ich: Hinweis auf neue Funktionen */
  const it = $("#ichTop");
  if (it) it.innerHTML = settings.newHint ? `<div class="feedback newhint">${fbHtml("Neu: weitere Funktionen", "Beschwerden-Tagebuch, Arztbericht, Allergiekarte, Familienprofile und mehr – such dir unten unter „Funktionen“ aus, was du brauchst.", `<button type="button" class="btn btn-sm btn-primary" data-fx="toFeatures">Ansehen</button><button type="button" class="btn btn-sm btn-quiet" data-fx="dismissNew">Ausblenden</button>`)}</div>` : "";
}

/* Zentrale Klick-Behandlung für data-fx außerhalb von Ergebnissen */
function globalFx(ev){
  const b = ev.target.closest("[data-fx]"); if (!b) return false;
  const a = b.dataset.fx;
  const map = {backup: makeBackup, restore: () => $("#backupFile").click(), card: openCardSheet, program: () => openProgramSheet(), emEdit: openEmergencyEdit,
    symptom: openSymptomSheet, free: openFreeSheet, report: openReportSheet, people: openPeopleSheet,
    toFeatures: () => { settings.newHint = false; saveSettings(); renderShell(); const c = $("#featCard"); if (c) c.scrollIntoView({behavior:"smooth", block:"start"}); },
    dismissNew: () => { settings.newHint = false; saveSettings(); renderShell(); }};
  if (map[a]){ map[a](); return true; }
  return false;
}
document.addEventListener("click", ev => {
  if (ev.target.closest("#sheetIn")) return;
  const es = ev.target.closest("[data-eat-sec]"); if (es){ eatSection = es.dataset.eatSec; renderEat(); return; }
  const l = ev.target.closest("#cardInline [data-lang]"); if (l){ settings.cardLang = l.dataset.lang; saveSettings(); renderSos(); return; }
  if (ev.target.closest("#progTop, #analysisTools, #analysis, #peopleCard, #ichTop, #sosBody, #dataCard")) globalFx(ev);
});
document.addEventListener("change", ev => { const t = ev.target.closest("[data-feat]"); if (t && t.closest("#featCard")) setFeature(t.dataset.feat, t.checked); });

/* ================= Offene Bewertungen (Erinnerung) ================= */
function openRatings(){
  const now = Date.now(), derived = new Set(analysisEntries().filter(x => x.derived).map(x => x.id));
  return myEntries().filter(h => h.src !== "symptom" && isEaten(h) && !h.reaction && !derived.has(h.id) && h.ignoreRating !== true)
    .filter(h => { const t = mealTime(h); return now - t >= 3*3600e3 && now - t <= 3*864e5; });
}
function openRatingsHtml(){
  const l = openRatings(); if (!l.length) return "";
  return `<section class="card open-rate"><div class="card-hd"><h2 class="h2">Wie hast du es vertragen?</h2><span class="meta">${l.length} offen</span></div>
    <p class="hint" style="margin:0 0 var(--s2)">Ein Tipp genügt – je mehr Bewertungen, desto besser die Auswertung.</p>
    <ul class="list">${l.slice(0, 5).map(h => `<li class="ing"><div class="ing-line"><span class="ing-name">${esc(h.name)}</span><span class="meta">${dayLabel(mealTime(h))}, ${fmtTime(mealTime(h))}</span></div>${reactHtml(h)}<button type="button" class="btn-link sm" data-skip-rate="${h.id}">Weiß ich nicht mehr</button></li>`).join("")}</ul></section>`;
}
document.addEventListener("click", ev => {
  const sk = ev.target.closest("[data-skip-rate]");
  if (sk){ const h = history.find(x => x.id === sk.dataset.skipRate); if (h){ h.ignoreRating = true; saveHistory(); renderDiary(); renderShell(); } return; }
  if (ev.target.closest("#analysisTools [data-react]")) handleActions(ev, () => { renderDiary(); renderShell(); });
});

/* ================= Austauschvorschläge & Rezept-Anpassung ================= */
function swapFor(name, cats){
  if (!cats.length) return null;
  const n = norm(name);
  for (const s of SUBS){
    if (!s.re.test(n)) continue;
    if (cats.every(c => s.for[c])) return [...new Set(cats.map(c => s.for[c]))].join(" / ");
  }
  return null;
}
/* Kernwort einer Zutat (z. B. „birne“), an dem der Austausch hängt */
function swapCore(name){
  const n = norm(name);
  for (const s of SUBS){ const m = n.match(s.re); if (!m) continue;
    const w = (m[0].match(/[a-z]+/g) || []).sort((a, b) => b.length - a.length)[0] || "";
    return w.replace(/(en|e|s)$/, "");
  }
  return "";
}
function swapRe(name){ const n = norm(name); const s = SUBS.find(x => x.re.test(n)); return s ? s.re : null; }
/* „Variante“ = gleiche Zutat in verträglicher Form (laktosefreie Milch, Haferflocken glutenfrei …) */
const isVariant = (to, core) => /glutenfrei|laktosefrei|variante/.test(norm(to)) || (core && norm(to).includes(core));
const fold = s => norm(s).replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
const TITLE_STOP = new Set(["mit","und","aus","dem","der","ohne","selbst","gemacht","glutenfrei","mild","ofen","bowl","salat","suppe","pfanne"]);
/* Hängt der Rezeptname an dieser Zutat – und fehlt sie nach dem Austausch? */
function titleBreaks(title, from, label, core){
  const fr = fold(from), lb = fold(label), c = fold(core), re = swapRe(from);
  /* Kernzutaten, die ein Gericht ausmachen, auch wenn sie nicht im Namen stehen */
  const must = (RECIPE_CORE[title] || []);
  if (must.some(m => norm(from).includes(m)) && !must.some(m => norm(label).includes(m))) return true;
  const fw = fr.match(/[a-z]{4,}/g) || [];
  return (fold(title).match(/[a-z]{4,}/g) || []).filter(w => !TITLE_STOP.has(w)).some(w => {
    const rel = fr.includes(w) || (re && re.test(w)) || (c.length >= 4 && w.includes(c)) || fw.some(x => { let i = 0; while (i < x.length && x[i] === w[i]) i++; return i >= 5; });
    return rel && !lb.includes(w);
  });
}
function adaptRecipe(r, ev){
  const swaps = [];
  const items = recipeRaw(r).items.map((it, k) => {
    const i = ev.items[k], bad = ev.cats.filter(c => i.lvl[c] > 0);
    if (!bad.length && i.mine !== "bad") return it;
    const to = swapFor(it.n, bad.length ? bad : []);
    if (!to) { swaps.push(null); return it; }
    const core = swapCore(it.n);
    const sw = {k, from: it.n.replace(/\s*\([^)]*\)/g, ""), to, core, variant: isVariant(to, core), drop: /^weglassen/i.test(to)};
    /* Zutat steckt im Rezeptnamen → kein „Birnen-Porridge ohne Birne“ */
    if (titleBreaks(r.t, it.n, sw.drop ? "" : swapLabel(sw, r.z[k]), core)) { swaps.push(null); return it; }
    swaps.push(sw);
    return sw.drop ? {n:"", s:it.s} : {n: to.split(" / ")[0].split(" oder ")[0], s: it.s};
  });
  if (!swaps.length || swaps.includes(null)) return null;
  const ev2 = evaluate({mode:"recipe", items: items.filter(x => x.n)}, P());
  return ev2.total === 0 ? {swaps} : null;
}
/* Angepasste Zutat, wie sie in der Liste steht */
function swapLabel(sw, z){
  const base = z.replace(/^~\s*/, "");
  if (/^glutenfreie Variante/i.test(sw.to)) return base.replace(/\s*\((weizen|dinkel)[^)]*\)/i, "").replace(/(Weizen|Dinkel)-?\s*/g, "").replace(/(^|\s)([a-zäöü])(?=[a-zäöü]{3,})/, (m, p, c) => p + c.toUpperCase()) + " (glutenfrei" + (/weizenst/i.test(sw.to) ? ", ohne Weizenstärke" : "") + ")";
  const amt = (base.match(AMOUNT_RE) || [""])[0];
  if (sw.variant) return amt + sw.to;
  /* Gewichts-/Volumenangaben lassen sich übernehmen, Stückzahlen nicht */
  return (/^[\d.,½¼¾\s–-]+(g|kg|ml|l)\s/i.test(amt) && !/\s(oder|und)\s|,/.test(sw.to) ? amt : "") + sw.to;
}
/* Kurzform für den Fließtext der Zubereitung */
function swapShort(to){
  if (/\S-\s+oder\s/.test(to)) return to.split(" / ")[0];
  return to.split(" / ")[0].split(" oder ")[0].replace(/\s*\(.*$/, "").replace(/frische Kräuter$/, "frischen Kräutern");
}
/* Zubereitung an den Austausch anpassen */
function adaptSteps(steps, swaps){
  return steps.map(s0 => {
    let s = esc(s0);
    for (const sw of swaps){
      if (!sw.core || (!sw.drop && (/^glutenfreie Variante/i.test(sw.to) || norm(sw.to).includes(sw.core)))) continue;
      const re = new RegExp("[A-Za-zÄÖÜäöüß-]+", "g");
      const hit = w => norm(w).includes(sw.core) || (w.length >= 4 && sw.core.endsWith(norm(w)));
      if (sw.drop){
        s = s.replace(/(,\s*|\s+und\s+)([A-Za-zÄÖÜäöüß-]+)/g, (m, sep, w) => hit(w) ? "" : m)
             .replace(/([A-Za-zÄÖÜäöüß-]+)(,\s*|\s+und\s+)/g, (m, w) => hit(w) ? "" : m)
             .replace(/\b[Mm]it\s+([A-Za-zÄÖÜäöüß-]+)\s+(belegen|bestreuen|servieren)/g, (m, w, v) => hit(w) ? "" : m);
        s = s.replace(re, w => hit(w) ? `<s>${w}</s>` : w).replace(/\s{2,}/g, " ").replace(/\s+\./g, ".").replace(/\.\s*,/g, ".").trim();
        if (/^[a-zäöü]/.test(s)) s = s[0].toUpperCase() + s.slice(1);
      } else {
        const short = esc(swapShort(sw.to));
        s = s.replace(re, w => hit(w) ? `<b>${short}</b>` : w);
      }
    }
    return s;
  }).filter(s => s.replace(/<[^>]+>/g, "").trim().length > 1);
}
function subsHtml(name, lv, cats){
  const bad = cats.filter(c => lv[c] > 0); if (!bad.length) return "";
  const n = norm(name), list = [];
  for (const s of SUBS){ if (!s.re.test(n)) continue; for (const c of bad) if (s.for[c] && !list.some(x => x.t === s.for[c])) list.push({c, t: s.for[c]}); }
  if (!list.length) return "";
  return `<section class="block"><h3 class="block-title">Besser verträglich</h3><ul class="subs">${list.map(x => `<li>${badge(x.c, 0)} ${esc(x.t)}</li>`).join("")}</ul></section>`;
}

/* ================= Scanner: Taschenlampe & Zoom ================= */
let camTrack = null, torchOn = false;
function camExtras(stream){
  const el = $("#camTools"); if (!el || !stream) return;
  camTrack = stream.getVideoTracks()[0]; torchOn = false;
  const caps = camTrack && camTrack.getCapabilities ? camTrack.getCapabilities() : {};
  let h = "";
  if (caps.torch) h += `<button type="button" class="btn btn-sm btn-outline" id="torchBtn" aria-pressed="false">Taschenlampe</button>`;
  if (caps.zoom && caps.zoom.max > caps.zoom.min) h += `<label class="sr-only" for="zoomIn">Zoom</label><input type="range" id="zoomIn" min="${caps.zoom.min}" max="${Math.min(caps.zoom.max, 5)}" step="${caps.zoom.step || 0.1}" value="${caps.zoom.min}">`;
  el.innerHTML = h; el.hidden = !h;
  const tb = $("#torchBtn"); if (tb) tb.onclick = async () => { try{ torchOn = !torchOn; await camTrack.applyConstraints({advanced:[{torch: torchOn}]}); tb.setAttribute("aria-pressed", torchOn); tb.classList.toggle("btn-primary", torchOn); }catch(e){ toast("Taschenlampe wird hier nicht unterstützt"); } };
  const zi = $("#zoomIn"); if (zi) zi.oninput = () => { camTrack.applyConstraints({advanced:[{zoom: +zi.value}]}).catch(() => {}); };
}
function camExtrasOff(){ const el = $("#camTools"); if (el){ el.hidden = true; el.innerHTML = ""; } camTrack = null; }

/* ================= Speisekarte fotografieren ================= */
function rateMenuLine(line){
  const t = rateText(line, {}), n = norm(line), res = Object.assign({}, t.res), why = {};
  for (const c of KEYS){ res[c] = res[c] || 0; why[c] = t.why[c].slice(); }
  for (const r of MENU_RULES){ if (!r.re.test(n)) continue; for (const c of KEYS) if (r[c] != null && r[c] > res[c]){ res[c] = r[c]; if (r.why && !why[c].includes(r.why)) why[c].push(r.why); } }
  return {res, why};
}
$("#menuBtn") && $("#menuBtn").addEventListener("click", () => $("#menuPhoto").click());
$("#menuPhoto").addEventListener("change", async ev => {
  const file = ev.target.files && ev.target.files[0]; ev.target.value = ""; if (!file) return;
  const inn = $("#sheetIn");
  inn.innerHTML = `<div id="menuOut">${loadingHtml("Lade Texterkennung (beim ersten Mal einige MB)…")}</div>`;
  openSheet("Speisekarte", {type:"menu"});
  try{
    const w = await getOcrWorker(m => { const o = $("#menuOut"); if (o && m && m.status === "recognizing text") o.innerHTML = loadingHtml("Lese Speisekarte… " + Math.round((m.progress || 0) * 100) + " %"); });
    const {data} = await w.recognize(await prepForOcr(file));
    const lines = String(data && data.text || "").split(/\n+/).map(l => l.replace(/[.·…_]{2,}.*$/, "").replace(/\s*\d+[.,]\d{2}\s*€?\s*$/, "").trim()).filter(l => l.length >= 4 && /[a-zäöü]{3}/i.test(l));
    const cats = activeCats();
    const rows = lines.map(l => { const r = rateMenuLine(l); const lvl = Math.max(0, ...cats.map(c => finalLevel(c, r.res[c], false, P().sens[c]))); return {l, r, lvl, bad: cats.filter(c => finalLevel(c, r.res[c], false, P().sens[c]) > 0)}; });
    const crit = rows.filter(x => x.lvl > 0).length;
    $("#menuOut").innerHTML = !rows.length ? fbHtml("Kein Text erkannt", "Fotografiere die Karte gerade, nah und bei gutem Licht.") :
      `<div class="feedback fb-warn">${fbHtml(crit ? crit + " Gericht" + (crit > 1 ? "e" : "") + " mit möglichen Problemzutaten" : "Keine offensichtlichen Problemzutaten erkannt", "Nur ein grober Hinweis: Speisekarten nennen nie alle Zutaten. Frag im Zweifel nach" + (F("card") ? " – am besten mit deiner Allergiekarte." : "."), F("card") ? `<button type="button" class="btn btn-sm btn-secondary" data-menu-card>Allergiekarte zeigen</button>` : "", SVG.warn)}</div>
       <div class="card flush" style="margin-top:var(--s3)">${rows.sort((a, b) => b.lvl - a.lvl).map(x => `<div class="menu-line">${st(x.lvl)}<div class="txt"><b>${esc(x.l)}</b>${x.bad.length ? `<div class="meta">${x.bad.map(c => esc(CATS[c]) + ": " + esc((x.r.why[c] || []).join(", ") || "möglich")).join(" · ")}</div>` : ""}</div></div>`).join("")}</div>`;
  }catch(e){ $("#menuOut").innerHTML = fbHtml("Texterkennung nicht möglich", "Bist du online? Beim ersten Mal muss die Texterkennung geladen werden.", "", SVG.warn); }
  inn.onclick = e2 => { if (e2.target.closest("[data-menu-card]")) openCardSheet(); };
});

/* ================= Laktose: Menge & Laktase-Vorschlag ================= */
/* Laktase-Bedarf je g Laktose: Laborwert ~200 FCC; im Alltag braucht es meist mehr. Startwerte je Empfindlichkeit. */
const LAC_PER_G = {1: 250, 2: 500, 3: 1000};
const deNum = (x, d = 1) => Number(x).toLocaleString("de-DE", {maximumFractionDigits: d});
function lacPerG(){ return +settings.lac.f || LAC_PER_G[P().sens.l || 2]; }
function lacBlock(raw){
  if (!P().on.l || settings.lac.show === false) return "";
  const est = estimateLactose(raw); if (!est) return "";
  let amt, lvl;
  if (est.src === "lf"){ amt = "unter 0,1 g pro 100 g"; lvl = "laktosefrei gekennzeichnet"; }
  else if (est.src === "label"){ amt = deNum(est.hi) + " g pro 100 g"; lvl = "Angabe des Herstellers"; }
  else if (est.hi < 0.1){ amt = "praktisch keine"; lvl = "gereift oder ohne Milchzucker"; }
  else { amt = "ca. " + deNum(est.est) + " g pro 100 g"; lvl = est.rough ? "grob geschätzt – Mengenanteile fehlen in der Zutatenliste" : "geschätzt aus der Zutatenliste"; }
  const g = est.est;
  let pill = "";
  if (settings.lac.pill && g >= 0.1 && est.src !== "lf"){
    const fcc = Math.max(100, Math.round(g * lacPerG() / 100) * 100), st = +settings.lac.fcc || 4500;
    const tabs = Math.max(0.5, Math.ceil(fcc / st * 2) / 2);
    const tTxt = tabs === 0.5 ? "½ Tablette" : (tabs % 1 ? deNum(Math.floor(tabs), 0) + "½" : deNum(tabs, 0)) + (tabs > 1 ? " Tabletten" : " Tablette");
    pill = `<div class="lac-pill"><b>≈ ${deNum(fcc, 0)} FCC pro 100 g</b> · etwa ${tTxt} à ${deNum(st, 0)} FCC</div>
      <p class="hint" style="margin-top:4px">Grober Startwert (${deNum(lacPerG(), 0)} FCC je g Laktose). Der Bedarf ist individuell – nimm Laktase zum ersten Bissen und passe die Menge nach deiner Erfahrung an.</p>`;
  }
  return `<section class="block lac"><h3 class="block-title">Laktose</h3><p class="lac-amt"><b>${amt}</b> <span class="meta">· ${lvl}</span></p>${g >= 0.1 && g <= 1 && est.src !== "lf" ? `<p class="hint">Wenig – kleine Mengen vertragen viele mit Laktoseintoleranz.</p>` : ""}${pill}</section>`;
}
function lacOptsHtml(){
  const s = settings.lac, auto = LAC_PER_G[profile.sens.l || 2];
  return `<div class="lac-opts">
    <label class="lac-row"><span>Laktosemenge im Ergebnis zeigen</span><span class="sw"><input type="checkbox" role="switch" data-lac="show"${s.show !== false ? " checked" : ""}><span></span></span></label>
    <label class="lac-row"><span>Vorschlag für Laktase-Tabletten</span><span class="sw"><input type="checkbox" role="switch" data-lac="pill"${s.pill ? " checked" : ""}><span></span></span></label>
    ${s.pill ? `<label class="lac-row"><span>Stärke deiner Tablette</span><span class="lac-num"><input class="input" type="number" inputmode="numeric" min="500" step="500" data-lac-num="fcc" value="${+s.fcc || 4500}"> FCC</span></label>
    <label class="lac-row"><span>FCC je g Laktose</span><select class="input" data-lac-num="f"><option value="0"${!+s.f ? " selected" : ""}>Automatisch (${deNum(auto, 0)})</option>${[250, 500, 1000, 1500].map(v => `<option value="${v}"${+s.f === v ? " selected" : ""}>${deNum(v, 0)}</option>`).join("")}</select></label>
    <p class="hint">Automatisch richtet sich nach deiner Empfindlichkeit. Laborwert: rund 200 FCC bauen 1 g Laktose ab, im Alltag braucht es meist mehr.</p>` : ""}
  </div>`;
}
document.addEventListener("change", ev => {
  const t = ev.target.closest("[data-lac],[data-lac-num]"); if (!t) return;
  if (t.dataset.lac) settings.lac[t.dataset.lac] = t.checked;
  else settings.lac[t.dataset.lacNum] = Math.max(0, +t.value || 0);
  saveSettings(); renderProfile();
  const sel = t.dataset.lac ? `[data-lac="${t.dataset.lac}"]` : `[data-lac-num="${t.dataset.lacNum}"]`;
  const n = document.querySelector(sel); if (n) n.focus({preventScroll: true});
});

/* ================= Darstellung (hell/dunkel) ================= */
const THEMES = {auto:"Automatisch", light:"Hell", dark:"Dunkel"};
function applyTheme(){
  const t = settings.theme === "light" || settings.theme === "dark" ? settings.theme : "auto";
  const root = document.documentElement;
  if (t === "auto") delete root.dataset.theme; else root.dataset.theme = t;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => {
    m.content = t === "auto" ? (i === 0 ? "#f4f1ea" : "#161814") : (t === "dark" ? "#161814" : "#f4f1ea");
  });
}
function renderThemeCard(){
  const el = $("#themeCard"); if (!el) return;
  const cur = THEMES[settings.theme] ? settings.theme : "auto";
  el.innerHTML = `<h2 class="h2">Darstellung</h2>
    <p class="hint" style="margin:2px 0 var(--s3)">${cur === "auto" ? "Folgt der Einstellung deines iPhones." : "Gilt nur für diese App."}</p>
    <div class="seg" role="radiogroup" aria-label="Darstellung">${Object.entries(THEMES).map(([k, v]) =>
      `<button type="button" role="radio" aria-checked="${cur === k}" data-theme-set="${k}">${v}</button>`).join("")}</div>`;
}
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-theme-set]"); if (!b) return;
  settings.theme = b.dataset.themeSet; saveSettings(); applyTheme(); renderThemeCard();
});

/* ================= Datensicherung ================= */
function renderDataCard(){
  const el = $("#dataCard"); if (!el) return;
  const last = settings.lastBackup;
  const n = history.filter(h => h.src === "symptom" || isEaten(h)).length;
  el.innerHTML = `<h2 class="h2">Daten sichern</h2>
    <p class="hint" style="margin-top:2px">Alles liegt nur auf diesem Gerät. Sichere es regelmäßig – z. B. in „Dateien“ oder per AirDrop aufs neue Handy.${n ? ` Tagebuch: ${n} Einträge.` : ""}</p>
    ${last ? `<p class="meta">Letzte Sicherung: ${new Date(last).toLocaleDateString("de-DE")}</p>` : (n >= 10 ? `<div class="note warn">Noch keine Sicherung – bei ${n} Einträgen empfehlenswert.</div>` : "")}
    <div class="quick" style="margin-top:var(--s2)"><button type="button" class="btn btn-secondary" data-fx="backup">Sicherung erstellen</button><button type="button" class="btn btn-outline" data-fx="restore">Sicherung laden</button></div>
    ${APP_CONFIG.links.privacy || APP_CONFIG.links.imprint ? `<p class="fine">${APP_CONFIG.links.imprint ? `<a href="${esc(APP_CONFIG.links.imprint)}">Impressum</a>` : ""}${APP_CONFIG.links.privacy && APP_CONFIG.links.imprint ? " · " : ""}${APP_CONFIG.links.privacy ? `<a href="${esc(APP_CONFIG.links.privacy)}">Datenschutz</a>` : ""}</p>` : ""}`;
}
function makeBackup(){
  syncPerson();
  const data = {app: APP_CONFIG.name, kind: "vertraeglich-backup", version: 1, created: new Date().toISOString(),
    data: {vt_profile: LS.get("vt_profile"), vt_history: LS.get("vt_history"), vt_people: LS.get("vt_people"), vt_settings: LS.get("vt_settings"), vt_lists: LS.get("vt_lists")}};
  settings.lastBackup = Date.now(); saveSettings(); data.data.vt_settings = LS.get("vt_settings");
  shareFile(JSON.stringify(data), "vertraeglich-sicherung-" + new Date().toISOString().slice(0, 10) + ".json", "application/json");
  renderDataCard();
}
$("#backupFile").addEventListener("change", async ev => {
  const f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if (!f) return;
  try{
    const j = JSON.parse(await f.text());
    if (!j || j.kind !== "vertraeglich-backup" || !j.data) throw new Error("format");
    const n = ((j.data.vt_history || {}).items || []).length;
    const inn = $("#sheetIn");
    inn.innerHTML = `<p style="margin-top:0">Sicherung vom <b>${new Date(j.created).toLocaleString("de-DE")}</b> mit ${n} Einträgen.</p>
      <div class="note warn">Die aktuellen Daten auf diesem Gerät werden dabei ersetzt.</div>
      <div class="sheet-actions"><button type="button" class="btn btn-primary btn-block" id="restoreGo">Wiederherstellen</button></div>`;
    openSheet("Sicherung laden", {type:"restore"});
    inn.onclick = e2 => { if (!e2.target.closest("#restoreGo")) return;
      Object.entries(j.data).forEach(([k, v]) => { if (v != null) LS.set(k, v); });
      toast("Wiederhergestellt – App wird neu geladen"); setTimeout(() => location.reload(), 800); };
  }catch(e){ toast("Das ist keine gültige Sicherungsdatei"); }
});

/* ================= Offline (Service Worker) ================= */
if ("serviceWorker" in navigator && location.protocol === "https:"){
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}

/* ================= Start ================= */
load(); loadPeople(); loadSettings(); applyTheme(); wireLists();
renderCats(); renderMeals(); refreshAll();
if (!hasStoredProfile && !history.length) showOnb(false);
