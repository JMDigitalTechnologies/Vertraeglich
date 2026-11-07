"use strict";
/* Verträglich – Oberfläche */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const LS = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ toast("Speichern nicht möglich – Speicher voll?"); } }
};
let toastT;
function toast(m){ const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600); }
const fmtDate = ts => new Date(ts).toLocaleString("de-DE", {day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit"});
const REACT = {good:"👍 Gut", unsure:"🤷 Weiß nicht", bad:"👎 Schlecht"};
const SRC = {barcode:"Barcode", foto:"Foto", text:"Text", food:"Lebensmittel", recipe:"Rezept"};
const MEALS = {alle:"Alle", fruehstueck:"Frühstück", mittag:"Mittagessen", abend:"Abendessen", snack:"Snack"};
const SENS_TXT = {
  h:{1:"Nur klare Problemzutaten zählen", 2:"Standard", 3:"Auch „Vorsicht“-Zutaten und kleine Mengen meiden"},
  f:{1:"Nur klare Problemzutaten zählen", 2:"Standard", 3:"Auch „Vorsicht“-Zutaten und kleine Mengen meiden"},
  l:{1:"Nur klare Problemzutaten zählen", 2:"Standard", 3:"Auch „Vorsicht“-Zutaten und kleine Mengen meiden"},
  g:{1:"Glutensensitivität – Hafer und Spuren ok", 2:"Standard", 3:"Zöliakie – auch Spuren und Hafer meiden"},
  t:{1:"Nur eindeutige Tomaten-Zutaten zählen", 2:"Standard – Gewürzmischungen als Vorsicht", 3:"Auch Gewürz- und Gemüsemischungen meiden (könnten Tomate enthalten)"}
};
const CAT_DESC = {h:"Histaminreiches und Histaminliberatoren", f:"Fruktose, Sorbit und andere Zuckeralkohole", g:"Weizen, Dinkel, Roggen, Gerste und Co.", l:"Milch, Molke, Sahne, frische Milchprodukte", t:"Tomate in jeder Form – auch als Pulver, Mark, Soße oder Gewürz"};

/* ---------- Zustand ---------- */
let profile = {on:{h:true,f:true,g:true,l:false,t:false}, sens:{h:2,f:2,g:2,l:2,t:2}, mine:{}};
let history = [];

function load(){
  const p = LS.get("vt_profile");
  if (p){
    if (p.on) profile = {on:Object.assign(profile.on, p.on), sens:Object.assign(profile.sens, p.sens||{}), mine:p.mine||{}};
    else { profile.on = {h:!!p.h, f:!!p.f, g:!!p.g, l:false, t:false}; profile.sens.g = p.gs ? 3 : 2; } // Version 1
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
function saveProfile(){ LS.set("vt_profile", profile); }
function saveHistory(){ history = history.slice(0, 300); LS.set("vt_history", {items: history}); }
const activeCats = () => KEYS.filter(c => profile.on[c]);

function addEntry(name, raw, src, code){
  const e = {id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), ts: Date.now(), name, src, code: code||null, raw, reaction: null};
  history.unshift(e); saveHistory();
  return e;
}
function refreshAll(){ renderSub(); renderFoods(); renderRecipes(); renderDiary(); renderProfile(); if (currentResult) showResult(currentResult, $("#result")); }

/* ---------- Ergebnis-Anzeige ---------- */
let currentResult = null;
function reactHtml(e){
  return `<div class="react">${Object.keys(REACT).map(k => `<button type="button" class="${k}${e.reaction===k?" on":""}" data-react="${k}" data-id="${e.id}">${REACT[k]}</button>`).join("")}</div>`;
}
function mkHtml(i){
  if (!i.key || i.fix) return "";
  return `<div class="mk"><button type="button" class="ok${i.mine==="ok"?" on":""}" data-mk="ok" data-key="${esc(i.key)}" data-name="${esc(i.name)}">vertrage ich</button><button type="button" class="bad${i.mine==="bad"?" on":""}" data-mk="bad" data-key="${esc(i.key)}" data-name="${esc(i.name)}">vertrage ich nicht</button></div>`;
}
function metaTxt(i){
  const m = [];
  if (i.pos) m.push("Position " + i.pos);
  if (i.pct != null) m.push(String(i.pct).replace(".", ",") + " %");
  if (i.small) m.push("geringe Menge – zählt weniger" );
  return m.length ? `<div class="meta">${m.join(" · ")}</div>` : "";
}
function showResult(e, el){
  const ev = evaluate(e.raw, profile), cats = ev.cats;
  const relevant = i => i.mine === "bad" || i.mine === "ok" || cats.some(c => i.lvl[c] > 0 || i.r[c] > 0);
  const flagged = ev.items.filter(relevant).sort((a,b) => Math.max(0,...cats.map(c=>b.lvl[c])) - Math.max(0,...cats.map(c=>a.lvl[c])));
  const chips = cats.map(c => `<span class="chip"><i class="c${ev.cat[c]}"></i>${CATS[c]}: ${LABEL[ev.cat[c]]}</span>`).join("") +
    (ev.personal ? `<span class="chip"><i class="c2"></i>Persönlich: Meiden</span>` : "");
  const ingHtml = i => {
    let lines = cats.filter(c => i.r[c] > 0).map(c =>
      `<div class="why"><span class="chip" style="padding:2px 8px;font-size:12px"><i class="c${i.lvl[c]}"></i>${CATS[c]}</span> ${esc(i.why[c] || LABEL[i.r[c]])}</div>`).join("");
    if (i.mine === "bad") lines += `<div class="why"><span class="chip" style="padding:2px 8px;font-size:12px"><i class="c2"></i>Persönlich</span> Von dir als „vertrage ich nicht“ markiert</div>`;
    if (i.mine === "ok") lines += `<div class="why"><span class="chip" style="padding:2px 8px;font-size:12px"><i class="c0"></i>Persönlich</span> Von dir als „vertrage ich“ markiert</div>`;
    return `<div class="ing"><b>${esc(i.name)}</b>${metaTxt(i)}${lines}${mkHtml(i)}</div>`;
  };
  el.innerHTML = `
  <div class="card">
    <div class="verdict v${ev.total}"><div class="dot">${["✓","!","✕"][ev.total]}</div><div><h3>${LABEL[ev.total]}</h3><p>${esc(reasonText(ev))}</p></div></div>
    <div class="chips">${chips}</div>
    <p class="small muted" style="margin:12px 0 0"><b style="color:var(--ink)">${esc(e.name)}</b> · ${SRC[e.src]||""} · ${fmtDate(e.ts)}</p>
    <p class="small" style="margin:14px 0 0;font-weight:600">Schon gegessen? Wie hast du es vertragen?</p>
    ${reactHtml(e)}
  </div>
  ${flagged.length ? `<div class="card"><h2>Auffällige Zutaten</h2>${flagged.map(ingHtml).join("")}</div>` : ""}
  <div class="card"><details><summary>Alle ${ev.items.length} Zutaten anzeigen</summary><div style="margin-top:8px">${ev.items.map(i =>
    `<div class="ing">${esc(i.name)} ${cats.map(c => `<i class="c${i.lvl[c]}" style="display:inline-block;width:9px;height:9px;border-radius:50%;margin-left:3px" title="${CATS[c]}"></i>`).join("")}${metaTxt(i)}${mkHtml(i)}</div>`).join("")}</div></details>
  <p class="small muted" style="margin:10px 0 0">Zutaten ohne Treffer in der Regelliste gelten als unproblematisch. Zutaten stehen nach Menge sortiert – weiter hinten und unter 2 % zählen sie weniger (außer bei Gluten und Tomate).</p></div>`;
  el.onclick = ev2 => handleActions(ev2, () => showResult(e, el));
}
function handleActions(ev, rerender){
  const b = ev.target.closest("[data-react],[data-mk]"); if (!b) return;
  if (b.dataset.react){
    const e = history.find(x => x.id === b.dataset.id); if (!e) return;
    e.reaction = e.reaction === b.dataset.react ? null : b.dataset.react;
    saveHistory(); if (e.reaction) toast("Im Tagebuch gespeichert: " + REACT[e.reaction]);
  } else {
    const k = b.dataset.key, v = b.dataset.mk;
    if (profile.mine[k] === v) delete profile.mine[k]; else profile.mine[k] = v;
    saveProfile();
    toast(profile.mine[k] ? `„${b.dataset.name.slice(0,40)}“: ${v === "ok" ? "vertrage ich" : "vertrage ich nicht"}` : "Markierung entfernt");
  }
  rerender(); renderDiary(); renderRecipes(); renderProfile();
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
$("#ocrBtn").addEventListener("click", () => $("#photoOcr").click());
$("#photoOcr").addEventListener("change", async e => {
  const file = e.target.files && e.target.files[0]; e.target.value = "";
  if (!file) return;
  const btn = $("#ocrBtn"), prog = $("#ocrProg"), err = $("#photoErr"); err.style.display = "none";
  const pv = $("#preview"); pv.src = URL.createObjectURL(file); pv.style.display = "block";
  btn.disabled = true; const old = btn.innerHTML; btn.innerHTML = '<div class="spin"></div> Text wird erkannt…';
  prog.style.display = "block"; prog.textContent = ocrWorker ? "Erkenne Text…" : "Lade Texterkennung (beim ersten Mal einige MB)…";
  try{
    const w = await getOcrWorker(m => {
      if (m && m.status === "recognizing text") prog.textContent = "Erkenne Text… " + Math.round((m.progress||0)*100) + " %";
      else if (m && m.status && /load/i.test(m.status)) prog.textContent = "Lade Texterkennung… " + Math.round((m.progress||0)*100) + " %";
    });
    const {data} = await w.recognize(await prepForOcr(file));
    const text = cleanOcrText(data && data.text);
    if (text.length < 8){ err.textContent = "Es wurde kaum Text erkannt. Fotografiere die Zutatenliste möglichst gerade, nah und mit gutem Licht."; err.style.display = "block"; prog.style.display = "none"; return; }
    $("#txt").value = text;
    prog.innerHTML = "Text erkannt – bitte kurz auf Lesefehler prüfen (z. B. „Sorbit“, „Weizen“) und dann <b>Prüfen</b> tippen.";
    $("#txt").scrollIntoView({behavior:"smooth", block:"center"});
    $("#txt").classList.add("hl"); setTimeout(() => $("#txt").classList.remove("hl"), 2500);
  }catch(x){
    ocrWorker = null;
    err.textContent = "Die Texterkennung konnte nicht starten (Internetverbindung?). Alternativ: Text per Live Text kopieren und unten einfügen.";
    err.style.display = "block"; prog.style.display = "none";
  }finally{ btn.disabled = false; btn.innerHTML = old; }
});

/* ---------- Barcode + Open Food Facts ---------- */
/* Erkennung: natives BarcodeDetector (falls vorhanden), sonst ZXing-C++ als WebAssembly */
const BD_SRC = "https://fastly.jsdelivr.net/npm/barcode-detector@2/dist/es/pure.min.js";
const FORMATS = ["ean_13","ean_8","upc_a","upc_e"];
let detector = null, stream = null, scanning = false, scanTimer = null;
window.info = info;
function info(html){ const el = $("#scanInfo"); if (!html){ el.style.display = "none"; return; } el.innerHTML = html; el.style.display = "block"; }
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
async function startScan(){
  info(""); $("#result").innerHTML = ""; currentResult = null;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    info("Dieser Browser erlaubt keinen Kamerazugriff. Nutze „Barcode fotografieren“ oder tippe die Nummer ein."); return;
  }
  $("#scanWrap").style.display = "block"; $("#scanBtn").style.display = "none";
  scanStatus("Kamera wird gestartet…");
  const video = $("#video");
  try{
    stream = await navigator.mediaDevices.getUserMedia({audio:false, video:{facingMode:{ideal:"environment"}, width:{ideal:1280}, height:{ideal:720}}});
    video.srcObject = stream;
    await video.play();
  }catch(e){
    await stopScan();
    const n = e && e.name;
    info(n === "NotAllowedError"
      ? "Kein Kamerazugriff erlaubt. iPhone: Einstellungen → Apps → Safari → Kamera auf „Erlauben“ stellen, dann die Seite neu laden. Alternativ „Barcode fotografieren“."
      : "Die Kamera konnte nicht gestartet werden (" + esc(n || "Fehler") + "). Nutze „Barcode fotografieren“ oder tippe die Nummer ein.");
    return;
  }
  scanStatus("Scanner wird geladen…");
  let det;
  try{ det = await getDetector(); }
  catch(e){ await stopScan(); info("Die Barcode-Erkennung konnte nicht geladen werden (Internetverbindung?). Tippe die Nummer ein."); return; }
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
  scanning = false; clearTimeout(scanTimer);
  if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; }
  const v = $("#video"); if (v) v.srcObject = null;
  $("#scanWrap").style.display = "none"; $("#scanBtn").style.display = "";
}
$("#scanBtn").addEventListener("click", startScan);
$("#scanStop").addEventListener("click", stopScan);

/* Fallback: Barcode fotografieren */
$("#bcPhotoBtn").addEventListener("click", () => $("#bcPhoto").click());
$("#bcPhoto").addEventListener("change", async e => {
  const file = e.target.files && e.target.files[0]; e.target.value = "";
  if (!file) return;
  await stopScan();
  info('<div class="row" style="justify-content:flex-start;gap:10px"><div class="spin" style="flex:none"></div><span>Barcode wird gelesen…</span></div>');
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
    else info("Auf dem Foto wurde kein Barcode erkannt. Fotografiere ihn gerade, scharf und formatfüllend – oder tippe die Nummer ein.");
  }catch(x){ info("Die Barcode-Erkennung konnte nicht geladen werden (Internetverbindung?). Tippe die Nummer ein."); }
});
$("#eanBtn").addEventListener("click", () => {
  const v = $("#eanIn").value.trim();
  if (!v){ $("#eanIn").focus(); return; }
  if (/^[\d\s-]+$/.test(v)){
    const c = v.replace(/\D/g,"");
    if (c.length >= 8) lookup(c); else info("Bitte die komplette Nummer unter dem Barcode eingeben (8–13 Ziffern).");
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
async function searchProducts(q, where){
  $("#result").innerHTML = ""; currentResult = null;
  /* Ausgabe dort, wo gesucht wurde: oben im Hinweisfeld oder unten im Ergebnisbereich */
  const info = where === "bottom"
    ? (html => { $("#scanInfo").style.display = "none"; $("#result").innerHTML = html ? `<div class="card" id="searchCard"><div class="note" style="margin:0;background:none;padding:0">${html}</div></div>` : ""; })
    : window.info;
  info('<div class="row" style="justify-content:flex-start;gap:10px"><div class="spin" style="flex:none"></div><span>Suche „' + esc(q) + '“ bei Open Food Facts…</span></div>');
  let list;
  try{ list = await offSearch(q); }
  catch(e){ info("Die Suche hat nicht geklappt – Open Food Facts ist gerade nicht erreichbar oder überlastet. Versuch es gleich noch einmal oder scanne den Barcode.<br><span class=\"meta\">Details: " + esc(e.message) + "</span>"); return; }
  const de = x => (x.countries_tags || []).includes("en:germany") ? 0 : 1;
  list.sort((a, b) => de(a) - de(b));
  if (!list.length){ info("Kein Produkt zu „" + esc(q) + "“ gefunden. Versuch es mit Marke und Produkt (z. B. „Ferrero Nutella“), scanne den Barcode oder fotografiere die Zutatenliste."); return; }
  info(`<b style="color:var(--ink)">${list.length} Treffer – Produkt antippen:</b>` + list.slice(0, 15).map(x => {
    const name = nameOf(x), brand = brandOf(x).trim();
    const ing = x.ingredients_text_de ?? x.ingredients_text;
    const hasIng = ing === undefined ? true : !!String(ing || "").trim();
    return `<div class="food" data-code="${esc(x.code)}" style="cursor:pointer"><div class="n" style="color:var(--ink)">${esc(name)}<small>${esc([brand, x.quantity].filter(Boolean).join(" · "))}${hasIng ? "" : " · keine Zutaten hinterlegt"}</small></div><span class="muted">›</span></div>`;
  }).join(""));
}
$("#scanInfo").addEventListener("click", e => { const r = e.target.closest("[data-code]"); if (r) lookup(r.dataset.code); });
$("#result").addEventListener("click", e => { const r = e.target.closest("#searchCard [data-code]"); if (r){ e.stopPropagation(); lookup(r.dataset.code); } }, true);
$("#eanIn").addEventListener("keydown", e => { if (e.key === "Enter") $("#eanBtn").click(); });

const OFF_FIELDS = "product_name,product_name_de,generic_name_de,brands,ingredients_text_de,ingredients_text,allergens_tags,traces_tags,labels_tags";
async function lookup(code){
  try{ if (navigator.vibrate) navigator.vibrate(60); }catch(e){}
  $("#eanIn").value = code;
  info('<div class="row" style="justify-content:flex-start;gap:10px"><div class="spin" style="flex:none"></div><span>Suche Produkt ' + esc(code) + ' …</span></div>');
  let j;
  try{
    const r = await fetch("https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json?lc=de&fields=" + OFF_FIELDS);
    j = await r.json();
  }catch(e){ info("Keine Verbindung zu Open Food Facts. Bist du online?"); return; }
  if (!j || j.status !== 1 || !j.product){
    info("Produkt <b>" + esc(code) + "</b> ist nicht in Open Food Facts. Fotografiere stattdessen die Zutatenliste. " +
      '<a href="https://world.openfoodfacts.org/cgi/product.pl?type=add&code=' + esc(code) + '">Produkt bei Open Food Facts eintragen</a>');
    return;
  }
  const p = j.product;
  const name = [p.brands && p.brands.split(",")[0].trim(), p.product_name_de || p.product_name || p.generic_name_de].filter(Boolean).join(" – ") || ("Produkt " + code);
  const txt = (p.ingredients_text_de || p.ingredients_text || "").replace(/_/g, "");
  const labels = p.labels_tags || [], allergens = p.allergens_tags || [], traces = p.traces_tags || [];
  const gf = labels.some(l => /no-gluten|gluten-free|glutenfrei/.test(l));
  const lf = labels.some(l => /no-lactose|lactose-free|laktosefrei/.test(l));
  if (!txt.trim() && !allergens.length){
    info("<b>" + esc(name) + "</b> ist bekannt, aber ohne Zutatenliste. Fotografiere die Zutatenliste, um sie zu prüfen.");
    return;
  }
  const {parts, spuren} = splitIngredients(txt);
  const items = parts.map(n => ({n}));
  const probe = evaluate({mode:"label", items}, {on:{h:1,f:1,g:1,l:1,t:1}, sens:{}, mine:{}});
  if (allergens.includes("en:gluten") && !gf && !probe.items.some(i => i.r.g >= 2)) items.push({n:"Allergenkennzeichnung: Gluten", fix:true});
  if (!txt.trim() && allergens.includes("en:milk") && !lf) items.push({n:"Allergenkennzeichnung: Milch", fix:true, x:{h:0,f:0,g:0,l:1}, note:"Enthält Milch – Laktosegehalt unbekannt"});
  let tr = spuren;
  if (!tr && traces.includes("en:gluten")) tr = "Kann Spuren von Gluten enthalten";
  info(txt.trim() ? "" : "Für dieses Produkt ist nur die Allergenkennzeichnung hinterlegt, keine vollständige Zutatenliste – Histamin und Fructose sind deshalb nicht bewertbar.");
  const e = addEntry(name, {mode:"label", items, spuren: tr, gf, lf}, "barcode", code);
  currentResult = e; showResult(e, $("#result")); renderDiary();
  $("#result").scrollIntoView({behavior:"smooth", block:"start"});
}

$("#txtBtn").addEventListener("click", () => {
  $("#ocrProg").style.display = "none";
  const t = $("#txt").value.trim();
  if (!t){
    const name = $("#txtName").value.trim();
    if (name) searchProducts(name, "bottom");
    else $("#txt").focus();
    return;
  }
  const {parts, spuren} = splitIngredients(t);
  if (!parts.length) return;
  const gf = /glutenfrei/i.test($("#txtName").value), lf = /laktosefrei/i.test($("#txtName").value);
  const e = addEntry($("#txtName").value.trim() || "Eigene Eingabe", {mode:"label", items: parts.map(n => ({n})), spuren, gf, lf}, "text");
  currentResult = e; showResult(e, $("#result")); renderDiary();
  $("#result").scrollIntoView({behavior:"smooth", block:"start"});
});

/* ---------- Lebensmittel ---------- */
let foodCat = "Alle";
function dotsHtml(r, cats){
  return `<div class="dots">${cats.map(c => `<span class="c${r[c]}" title="${CATS[c]}: ${LABEL[r[c]]}">${CATS[c][0]}</span>`).join("")}</div>`;
}
function foodLevels(f){ const lv = {}; for (const c of KEYS) lv[c] = finalLevel(c, f[c], false, profile.sens[c]); const k = ingKey(f.n); if (profile.mine[k] === "ok") KEYS.forEach(c => lv[c] = 0); return lv; }
function renderCats(){
  const ks = ["Alle", ...new Set(FOODS.map(f => f.k))];
  $("#cats").innerHTML = ks.map(k => `<button class="${k===foodCat?"on":""}" data-k="${esc(k)}">${esc(k)}</button>`).join("");
}
$("#cats").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; foodCat = b.dataset.k; renderCats(); renderFoods(); });
$("#q").addEventListener("input", () => renderFoods());
function renderFoods(){
  const q = norm($("#q").value.trim()), cats = activeCats();
  const list = FOODS.map((f, idx) => ({f, idx, lv: foodLevels(f)}))
    .filter(({f}) => (foodCat === "Alle" || f.k === foodCat) && (!q || norm(f.n).includes(q) || norm(f.note).includes(q)));
  const worst = x => (profile.mine[ingKey(x.f.n)] === "bad") ? 3 : cats.length ? Math.max(...cats.map(c => x.lv[c])) : 0;
  const rank = x => !q ? 0 : norm(x.f.n).startsWith(q) ? 0 : norm(x.f.n).split(/[^a-z]+/).some(w => w.startsWith(q)) ? 1 : 2;
  list.sort((a,b) => rank(a) - rank(b) || worst(a) - worst(b) || a.f.n.localeCompare(b.f.n, "de"));
  $("#foodList").innerHTML = list.length
    ? list.map(({f, idx, lv}) => `<div class="food" data-i="${idx}" style="cursor:pointer"><div class="n">${esc(f.n)}${profile.mine[ingKey(f.n)] ? ` <span class="flag" style="color:${profile.mine[ingKey(f.n)]==="ok"?"var(--ok)":"var(--bad)"}">${profile.mine[ingKey(f.n)]==="ok"?"✓ vertrage ich":"✕ vertrage ich nicht"}</span>` : ""}${f.note ? `<small>${esc(f.note)}</small>` : ""}</div>${dotsHtml(lv, cats)}</div>`).join("")
    : `<p class="muted" style="margin:0">Kein Treffer in der Liste. Prüfe Produkte über Barcode oder Zutatenliste.</p>`;
}
$("#foodList").addEventListener("click", e => {
  const row = e.target.closest(".food"); if (!row) return;
  const f = FOODS[+row.dataset.i]; if (f) openFoodSheet(f);
});
function openFoodSheet(f){
  const lv = foodLevels(f), key = ingKey(f.n);
  const inn = $("#sheetIn");
  inn.innerHTML = `<div class="row" style="justify-content:flex-end"><button class="ghost" id="shClose" style="flex:none">Fertig</button></div>
  <div class="card"><h2>${esc(f.n)}</h2><p class="small muted" style="margin:0">${esc(f.k)}${f.note ? " · " + esc(f.note) : ""}</p>
  <div class="chips">${KEYS.map(c => `<span class="chip" style="${profile.on[c] ? "" : "opacity:.55"}"><i class="c${lv[c]}"></i>${CATS[c]}: ${LABEL[lv[c]]}</span>`).join("")}</div>
  <div class="mk" style="margin-top:12px">${["ok","bad"].map(v => `<button type="button" class="${v}${profile.mine[key]===v?" on":""}" data-mk="${v}" data-key="${esc(key)}" data-name="${esc(f.n)}">${v==="ok"?"vertrage ich":"vertrage ich nicht"}</button>`).join("")}</div></div>
  <div class="card"><h2>Heute gegessen?</h2><p class="small muted" style="margin:0">Trag ein, wie du es vertragen hast – das fließt in die Analyse im Tagebuch ein.</p>
  <div class="react">${Object.keys(REACT).map(k => `<button type="button" class="${k}" data-fr="${k}">${REACT[k]}</button>`).join("")}</div></div>`;
  openSheet();
  inn.onclick = ev => {
    const fr = ev.target.closest("[data-fr]");
    if (fr){
      const e = addEntry(f.n, {mode:"food", items:[{n:f.n, x:{h:f.h,f:f.f,g:f.g,l:f.l,t:f.t}, note:f.note}]}, "food");
      e.reaction = fr.dataset.fr; saveHistory(); renderDiary(); closeSheet(); toast("Im Tagebuch gespeichert: " + REACT[e.reaction]); return;
    }
    if (ev.target.closest("#shClose")){ closeSheet(); return; }
    handleActions(ev, () => { openFoodSheet(f); renderFoods(); });
  };
}

/* ---------- Rezepte ---------- */
let meal = "alle";
const recipeEntry = {};
function renderMeals(){ $("#meals").innerHTML = Object.keys(MEALS).map(k => `<button class="${k===meal?"on":""}" data-m="${k}">${MEALS[k]}</button>`).join(""); }
$("#meals").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; meal = b.dataset.m; renderMeals(); renderRecipes(); });
$("#showWarn").addEventListener("change", () => renderRecipes());
function renderRecipes(){
  const open = new Set([...document.querySelectorAll("#recipeList details[open]")].map(d => d.dataset.i));
  const showWarn = $("#showWarn").checked;
  const all = RECIPES.map((r, i) => ({r, i, ev: evaluate(recipeRaw(r), profile)})).filter(x => meal === "alle" || x.r.m.includes(meal));
  const shown = all.filter(x => x.ev.total === 0 || (showWarn && x.ev.total === 1)).sort((a,b) => a.ev.total - b.ev.total);
  const hidden = all.length - shown.length;
  const html = shown.map(({r, i, ev}) => {
    const items = ev.items;
    const zl = r.z.map((z, k) => { const it = items[k]; const lv = Math.max(0, ...ev.cats.map(c => it.lvl[c]));
      return `<li>${esc(z.replace(/^~\s*/, ""))}${lv ? ` <span class="flag" style="color:${lv===2?"var(--bad)":"var(--warn)"}">● ${esc(ev.cats.filter(c => it.lvl[c] === lv).map(c => CATS[c]).join(", "))}</span>` : ""}</li>`; }).join("");
    const last = recipeEntry[i] && history.find(h => h.id === recipeEntry[i]);
    return `<div class="rcp"><div class="hd"><i class="c${ev.total}"></i><div style="flex:1"><b>${esc(r.t)}</b><span class="meta">${r.m.map(m => MEALS[m]).join(" · ")} · ${r.min} Min.${ev.total ? " · " + esc(reasonText(ev)) : ""}</span></div></div>
      <details data-i="${i}"${open.has(String(i)) ? " open" : ""}><summary>Zutaten &amp; Zubereitung</summary><ul>${zl}</ul><ol>${r.s.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
      <p class="small" style="margin:12px 0 0;font-weight:600">Nachgekocht? Wie hast du es vertragen?</p>
      <div class="react">${Object.keys(REACT).map(k => `<button type="button" class="${k}${last && last.reaction===k?" on":""}" data-rr="${k}" data-ri="${i}">${REACT[k]}</button>`).join("")}</div></details></div>`;
  }).join("");
  $("#recipeList").innerHTML = (html || `<p class="muted" style="margin:0">Keine passenden Rezepte für diese Auswahl.</p>`) +
    (hidden ? `<p class="small muted" style="margin:12px 0 0">${hidden} Rezept${hidden>1?"e":""} ausgeblendet, weil sie nicht zu deinem Profil passen${showWarn ? "" : " oder Vorsicht-Zutaten enthalten"}.</p>` : "");
}
$("#recipeList").addEventListener("click", ev => {
  const b = ev.target.closest("[data-rr]"); if (!b) return;
  const i = +b.dataset.ri, r = RECIPES[i];
  let e = recipeEntry[i] && history.find(h => h.id === recipeEntry[i]);
  if (!e){ e = addEntry(r.t, recipeRaw(r), "recipe"); recipeEntry[i] = e.id; }
  e.reaction = e.reaction === b.dataset.rr ? null : b.dataset.rr;
  saveHistory(); renderRecipes(); renderDiary();
  if (e.reaction) toast("Im Tagebuch gespeichert: " + REACT[e.reaction]);
});

/* ---------- Tagebuch + Analyse ---------- */
const VERD = {strong:["Starker Hinweis","p-strong"], possible:["Möglicher Hinweis","p-possible"], none:["Kein Hinweis","p-none"], data:["Zu wenig Daten","p-data"]};
function renderDiary(){
  const a = analyze(history, profile);
  let h = `<h2>Analyse</h2>`;
  if (a.n < 5){
    h += `<p class="small muted" style="margin:0">Bewerte mindestens 5 gegessene Produkte, Lebensmittel oder Rezepte mit <b>👍 Gut</b> oder <b>👎 Schlecht</b> (bisher ${a.n}). Je mehr Einträge, desto aussagekräftiger – ideal sind 20 und mehr, darunter auch gut vertragene Sachen.</p>
      <p class="small muted" style="margin:8px 0 0">So geht’s: Produkt prüfen oder Rezept wählen → nach dem Essen „Wie hast du es vertragen?“ antippen.</p>`;
  } else {
    h += `<p class="small muted" style="margin:0 0 6px">Ausgewertet: ${a.n} Einträge (${a.bad} schlecht vertragen)${a.unsure ? `, ${a.unsure} × „weiß nicht“ nicht berücksichtigt` : ""}.</p>`;
    for (const c of KEYS){
      const x = a.cats[c], [vt, vc] = VERD[x.verdict];
      const pE = Math.round(x.rE * 100), pU = Math.round(x.rU * 100);
      h += `<div class="acat"><div class="hd"><b>${CATS[c]}</b><span class="pill ${vc}">${vt}</span></div>`;
      if (x.verdict === "data") h += `<div class="meta">Zu wenige Einträge mit und ohne ${CATS[c]}-Zutaten, um zu vergleichen.</div>`;
      else h += `<div class="meta">Mit ${CATS[c]}-Zutaten: ${pE} % schlecht vertragen · ohne: ${pU} %</div>
        <div class="bar"><i style="width:${pE}%;background:var(--bad)"></i></div><div class="bar"><i style="width:${pU}%;background:var(--unk)"></i></div>`;
      if ((x.verdict === "strong" || x.verdict === "possible") && !profile.on[c]) h += `<button type="button" data-act="${c}" style="margin-top:8px;padding:8px 12px;font-size:14px">${CATS[c]} im Profil aktivieren</button>`;
      if (c === "g" && (x.verdict === "strong" || x.verdict === "possible")) h += `<div class="note">Wichtig: Lass eine Zöliakie ärztlich abklären, <b>bevor</b> du dauerhaft auf Gluten verzichtest – sonst ist der Bluttest nicht mehr aussagekräftig.</div>`;
      if ((c === "f" || c === "l") && x.verdict === "strong") h += `<div class="note">Ein H2-Atemtest beim Arzt kann eine ${c === "f" ? "Fruktose" : "Laktose"}-Unverträglichkeit sicher bestätigen.</div>`;
      h += `</div>`;
    }
    if (a.suspects.length) h += `<h2 style="margin-top:14px">Verdächtige Zutaten</h2><p class="small muted" style="margin:0 0 4px">Tauchen vor allem bei schlecht Vertragenem auf.</p>` +
      a.suspects.map(s => `<div class="mine"><span>${esc(s.name)} <span class="meta">· ${s.bad}× schlecht, ${s.good}× gut</span></span>${profile.mine[s.key] === "bad" ? '<span class="meta">markiert</span>' : `<button type="button" data-mk="bad" data-key="${esc(s.key)}" data-name="${esc(s.name)}" style="padding:6px 10px;font-size:13px">vertrage ich nicht</button>`}</div>`).join("");
    if (a.safe.length) h += `<h2 style="margin-top:14px">Gut vertragen</h2>` +
      a.safe.map(s => `<div class="mine"><span>${esc(s.name)} <span class="meta">· ${s.good}× gut</span></span>${profile.mine[s.key] === "ok" ? '<span class="meta">markiert</span>' : `<button type="button" data-mk="ok" data-key="${esc(s.key)}" data-name="${esc(s.name)}" style="padding:6px 10px;font-size:13px">vertrage ich</button>`}</div>`).join("");
    h += `<p class="small muted" style="margin:12px 0 0">Die Analyse vergleicht, wie oft du Essen mit und ohne bestimmte Zutaten schlecht vertragen hast. Sie ist ein Hinweis, keine Diagnose – sprich Auffälligkeiten mit deiner Ärztin oder deinem Arzt ab.</p>`;
  }
  $("#analysis").innerHTML = h;

  const el = $("#histList");
  if (!history.length){ el.innerHTML = '<h2>Tagebuch</h2><p class="muted" style="margin:0">Noch keine Einträge. Geprüfte Produkte und bewertete Lebensmittel oder Rezepte erscheinen hier.</p>'; return; }
  el.innerHTML = '<h2>Tagebuch</h2>' + history.map(h => {
    const ev = evaluate(h.raw, profile);
    return `<div class="hist" data-id="${h.id}"><i class="c${ev.total}"></i><div class="n"><b>${esc(h.name)}</b><small>${fmtDate(h.ts)} · ${SRC[h.src]||""}${h.reaction ? " · " + REACT[h.reaction] : " · noch nicht bewertet"}</small></div><span class="muted">›</span></div>`;
  }).join("");
}
$("#analysis").addEventListener("click", ev => {
  const act = ev.target.closest("[data-act]");
  if (act){ profile.on[act.dataset.act] = true; saveProfile(); toast(CATS[act.dataset.act] + " im Profil aktiviert"); refreshAll(); return; }
  handleActions(ev, () => {});
});
$("#histList").addEventListener("click", e => {
  const row = e.target.closest(".hist"); if (!row) return;
  const h = history.find(x => x.id === row.dataset.id); if (!h) return;
  openEntrySheet(h);
});
function openEntrySheet(h){
  const inn = $("#sheetIn");
  inn.innerHTML = `<div class="row" style="justify-content:space-between"><button class="ghost" id="shDel" style="flex:none;color:var(--bad)">Löschen</button><button class="ghost" id="shClose" style="flex:none">Fertig</button></div><div id="shRes"></div>`;
  showResult(h, $("#shRes"));
  openSheet();
  inn.onclick = null;
  $("#shClose").onclick = closeSheet;
  $("#shDel").onclick = () => {
    const b = $("#shDel");
    if (b.dataset.c){ history = history.filter(x => x.id !== h.id); saveHistory(); renderDiary(); closeSheet(); }
    else { b.dataset.c = "1"; b.textContent = "Wirklich löschen?"; }
  };
}
function openSheet(){ $("#sheet").classList.add("on"); }
function closeSheet(){ $("#sheet").classList.remove("on"); renderDiary(); renderFoods(); renderRecipes(); renderProfile(); }
$("#sheet").addEventListener("click", e => { if (e.target.id === "sheet") closeSheet(); });

/* ---------- Profil ---------- */
function renderProfile(){
  $("#profCats").innerHTML = `<h2>Meine Unverträglichkeiten</h2>` + KEYS.map(c => `
    <div class="pblock">
      <div class="toggle" style="border:0;padding:0"><div class="t"><b>${CATS[c]}</b><span>${CAT_DESC[c]}</span></div><label class="sw"><input type="checkbox" data-on="${c}"${profile.on[c] ? " checked" : ""}><span></span></label></div>
      ${profile.on[c] ? `<div class="sens">${[1,2,3].map(s => `<button type="button" data-sens="${c}" data-s="${s}" class="${profile.sens[c]===s?"on":""}">${["leicht","mittel","stark"][s-1]}</button>`).join("")}</div><div class="sensHint">${SENS_TXT[c][profile.sens[c]]}</div>` : ""}
    </div>`).join("");
  const m = Object.entries(profile.mine);
  $("#mineList").innerHTML = m.length
    ? m.sort((a,b) => a[0].localeCompare(b[0])).map(([k, v]) => `<div class="mine"><span>${esc(k)}</span><span class="flag" style="color:${v==="ok"?"var(--ok)":"var(--bad)"}">${v==="ok"?"vertrage ich":"vertrage ich nicht"}</span><button type="button" class="ghost" data-del="${esc(k)}" style="flex:none;padding:4px 8px">✕</button></div>`).join("")
    : `<p class="small muted" style="margin:0">Noch keine. Markiere Zutaten in den Ergebnissen oder in der Lebensmittel-Liste.</p>`;
}
$("#profCats").addEventListener("change", e => { const c = e.target.dataset.on; if (!c) return; profile.on[c] = e.target.checked; saveProfile(); refreshAll(); });
$("#profCats").addEventListener("click", e => { const b = e.target.closest("[data-sens]"); if (!b) return; profile.sens[b.dataset.sens] = +b.dataset.s; saveProfile(); refreshAll(); });
$("#mineList").addEventListener("click", e => { const b = e.target.closest("[data-del]"); if (!b) return; delete profile.mine[b.dataset.del]; saveProfile(); refreshAll(); });
function renderSub(){ const a = activeCats(); $("#sub").textContent = a.length ? "Profil: " + a.map(c => CATS[c] + (profile.sens[c] !== 2 ? " (" + ["leicht","","stark"][profile.sens[c]-1] + ")" : "")).join(" · ") : "Kein Profil aktiv – tippe auf Profil"; }

/* ---------- Navigation ---------- */
document.querySelectorAll("nav button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll("nav button").forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("on", v.id === "v-" + b.dataset.v));
  if (b.dataset.v !== "check") stopScan();
  window.scrollTo(0, 0);
}));

load(); renderCats(); renderMeals(); refreshAll();
