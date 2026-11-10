"use strict";
/* Verträglich – Bewertungslogik (ohne DOM, testbar)
   raw = {mode:"label"|"recipe"|"food", items:[{n, s?:klein, x?:{h,f,g,l} feste Werte, fix?:true}], spuren?, gf?, lf?} */

/* Kategorien: grp "int" = Unverträglichkeit, "all" = Allergie (14 EU-Hauptallergene).
   short = Kürzel für kompakte Anzeigen; any = jede Menge zählt (keine Abwertung kleiner Mengen); trace = Spurenhinweise zählen */
const CAT_DEF = [
  {k:"h", n:"Histamin",       short:"H",  grp:"int", desc:"Histaminreiches und Histaminliberatoren"},
  {k:"f", n:"Fructose",       short:"F",  grp:"int", desc:"Fruktose, Fruchtzucker-Sirupe, Sorbit und Co."},
  {k:"s", n:"Sorbit",         short:"So", grp:"int", desc:"Sorbit (E420) und sorbitreiches Obst"},
  {k:"l", n:"Laktose",        short:"L",  grp:"int", desc:"Milchzucker in Milch, Molke, Sahne, Frischmilchprodukten"},
  {k:"g", n:"Gluten",         short:"G",  grp:"int", desc:"Zöliakie oder Gluten-/Weizensensitivität: Weizen, Dinkel, Roggen, Gerste und Co.", any:true, trace:true},
  {k:"o", n:"FODMAP",         short:"FM", grp:"int", desc:"Für Reizdarm (Low-FODMAP): Fruktane, GOS, Laktose, Fruktose, Polyole"},
  {k:"t", n:"Tomate",         short:"T",  grp:"int", desc:"Tomate in jeder Form – auch als Pulver, Mark, Soße oder Gewürz", any:true},
  {k:"wa", n:"Weizenallergie", short:"Wz", grp:"all", desc:"Weizen und Verwandte (Dinkel, Hartweizen, Emmer …) in jeder Form – auch glutenfreie Weizenstärke"},
  {k:"m", n:"Milcheiweiß",    short:"Mi", grp:"all", desc:"Kuhmilchallergie – auch laktosefreie Milchprodukte, Butter, Käse"},
  {k:"e", n:"Ei",             short:"Ei", grp:"all", desc:"Hühnerei in jeder Form, auch Mayonnaise und Eiernudeln"},
  {k:"y", n:"Soja",           short:"Sj", grp:"all", desc:"Soja, Tofu, Sojasauce, Sojalecithin"},
  {k:"nu", n:"Schalenfrüchte", short:"Nu", grp:"all", desc:"Mandel, Haselnuss, Walnuss, Cashew, Pistazie und Co."},
  {k:"p", n:"Erdnuss",        short:"Er", grp:"all", desc:"Erdnüsse und Erdnussöl/-mus"},
  {k:"c", n:"Sellerie",       short:"Se", grp:"all", desc:"Knollen-, Stangensellerie, Selleriesalz"},
  {k:"u", n:"Senf",           short:"Sf", grp:"all", desc:"Senf und Senfsaat"},
  {k:"z", n:"Sesam",          short:"Ss", grp:"all", desc:"Sesam, Tahin"},
  {k:"i", n:"Fisch",          short:"Fi", grp:"all", desc:"Alle Fischarten, Fischsauce"},
  {k:"kr", n:"Krebstiere",     short:"Kr", grp:"all", desc:"Garnelen, Krabben, Hummer, Krebse"},
  {k:"w", n:"Weichtiere",     short:"We", grp:"all", desc:"Muscheln, Tintenfisch, Schnecken"},
  {k:"v", n:"Lupine",         short:"Lu", grp:"all", desc:"Lupinenmehl und -eiweiß"},
  {k:"q", n:"Sulfite",        short:"Su", grp:"all", desc:"Schwefeldioxid/Sulfite (E220–E228), z. B. in Wein und Trockenobst"},
];
for (const d of CAT_DEF) if (d.grp === "all"){ d.any = true; d.trace = true; }
const KEYS = CAT_DEF.map(d => d.k);
const CATS = Object.fromEntries(CAT_DEF.map(d => [d.k, d.n]));
const CAT = Object.fromEntries(CAT_DEF.map(d => [d.k, d]));
/* Bei diesen Kategorien zählt jede Menge – keine Abwertung kleiner Mengen */
const ANY_AMOUNT = Object.fromEntries(CAT_DEF.filter(d => d.any).map(d => [d.k, true]));
const LABEL = ["Verträglich","Vorsicht","Meiden"];
/* Empfindlichkeit: [Schwelle rot, Schwelle gelb] auf den gewichteten Wert */
const SENS_T = {1:[2,1.5], 2:[2,1], 3:[1,0.5]};

const norm = s => String(s||"").toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss");

function ingKey(name){
  return norm(name).replace(/\([^)]*\)|\[[^\]]*\]/g," ").replace(/[\d.,]+\s*%?/g," ")
    .replace(/[^a-z]+/g," ").trim().replace(/\s+/g," ");
}
function parsePct(name){
  const m = String(name).match(/(\d+(?:[.,]\d+)?)\s?%/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

function rateText(name, ctx){
  const n = norm(name);
  const res = {}, why = {}, ov = {}, ovWhy = {};
  for (const c of KEYS){ res[c] = null; why[c] = []; ov[c] = null; ovWhy[c] = []; }
  for (const r of RULES){
    if (!r.re.test(n)) continue;
    for (const c of KEYS){
      if (r[c] == null) continue;
      if (r.ov){ ov[c] = ov[c] == null ? r[c] : Math.min(ov[c], r[c]); if (r.why) ovWhy[c].push(r.why); }
      else { res[c] = Math.max(res[c] ?? 0, r[c]); if (r[c] > 0 && r.why && !why[c].includes(r.why)) why[c].push(r.why); }
    }
  }
  for (const c of KEYS) if (ov[c] != null){ res[c] = ov[c]; why[c] = ovWhy[c]; }
  /* FODMAP umfasst Laktose, Fruktose-Überschuss und Polyole */
  if (ov.o == null){
    for (const c of ["l","f","s"]){
      if ((res[c] ?? 0) > (res.o ?? 0)){ res.o = res[c]; why.o = why.o.concat(why[c]); }
    }
  }
  if (ctx && ctx.gf && res.g != null){ res.g = 0; why.g = []; }
  if (ctx && ctx.lf && res.l != null){ res.l = 0; why.l = []; }
  return {res, why};
}

/* gewichteter Wert: kleine Menge zählt eine halbe Stufe weniger – außer bei Gluten und Tomate (da zählt jede Menge) */
function weighted(c, raw, small){ return (small && !ANY_AMOUNT[c]) ? Math.max(0, raw - 0.5) : raw; }
function finalLevel(c, raw, small, sens){
  const T = SENS_T[sens || 2] || SENS_T[2], s = weighted(c, raw, small);
  return s >= T[0] ? 2 : s >= T[1] ? 1 : 0;
}

function evaluate(raw, profile){
  const ctx = {gf: !!raw.gf, lf: !!raw.lf};
  const act = KEYS.filter(c => profile.on[c]);
  const mineMap = profile.mine || {};
  const labelCount = raw.items.filter(i => !i.fix).length;
  let pos = 0;
  const items = raw.items.map(it => {
    let r = {}, why = {};
    if (it.x){ for (const c of KEYS){ r[c] = it.x[c] || 0; why[c] = it.note || ""; } }
    else { const t = rateText(it.n, ctx); for (const c of KEYS){ r[c] = t.res[c] ?? 0; why[c] = t.why[c].join(" · "); } }
    let small = false, p = null, pc = null;
    if (raw.mode === "label" && !it.fix){
      pos++; p = pos; pc = parsePct(it.n);
      small = pc != null ? pc < 2 : (labelCount >= 6 && pos > Math.max(5, Math.ceil(labelCount * 0.6)));
    } else if (raw.mode === "recipe") small = !!it.s;
    const key = ingKey(it.n), mine = mineMap[key] || null;
    const lvl = {};
    for (const c of KEYS) lvl[c] = mine === "ok" ? 0 : finalLevel(c, r[c], small, profile.sens[c]);
    return {name: it.n, key, r, lvl, why, small, pos: p, pct: pc, mine, fix: !!it.fix};
  });
  if (raw.spuren){
    const t = rateText(raw.spuren, {});
    const r = {}, lvl = {}, why = {};
    let any = false;
    for (const c of KEYS){
      const hit = CAT[c].trace && (t.res[c] ?? 0) >= 1 && !(c === "g" && ctx.gf);
      r[c] = hit ? 1 : 0; why[c] = hit ? "Spurenhinweis: " + CATS[c] : ""; if (hit) any = true;
      lvl[c] = finalLevel(c, r[c], false, profile.sens[c]);
    }
    if (any) items.push({name: String(raw.spuren).trim(), key: "", r, lvl, why, small:false, pos:null, pct:null, mine:null, trace:true, fix:true});
  }
  const cat = {};
  for (const c of act) cat[c] = items.reduce((m, i) => Math.max(m, i.lvl[c]), 0);
  const personal = items.some(i => i.mine === "bad");
  const total = Math.max(0, ...act.map(c => cat[c]), personal ? 2 : 0);
  /* Begründung */
  const drivers = [];
  if (total > 0){
    for (const i of items){
      const cs = act.filter(c => i.lvl[c] === total);
      const parts = [];
      if (i.mine === "bad" && total === 2) parts.push("deine Markierung");
      if (cs.length) parts.push(cs.map(c => CATS[c]).join(", "));
      if (parts.length) drivers.push({i, txt: parts.join(", ") + (i.pos ? ", Position " + i.pos : "") + (i.small ? ", geringe Menge" : "")});
    }
  }
  /* Belastung für die Analyse – unabhängig vom Profil, ohne persönliche Markierungen */
  const expo = {};
  for (const c of KEYS) expo[c] = items.reduce((m, i) => Math.max(m, weighted(c, i.r[c], i.small)), 0) / 2;
  return {items, cat, total, cats: act, personal, drivers, expo};
}

function reasonText(ev){
  if (!ev.cats.length && !ev.personal) return "Kein Profil aktiv – wähle im Profil deine Unverträglichkeiten.";
  if (ev.total === 0) return "Keine problematischen Zutaten für dein Profil gefunden.";
  const d = ev.drivers.slice(0, 3).map(x => x.i.name.replace(/\s+/g," ").slice(0, 60) + " (" + x.txt + ")");
  const more = ev.drivers.length > 3 ? " und " + (ev.drivers.length - 3) + " weitere" : "";
  return (ev.total === 2 ? "Rot wegen " : "Gelb wegen ") + d.join(", ") + more + ".";
}

/* ---------- Zutatenlisten zerlegen ---------- */
function splitIngredients(text){
  let t = String(text||"").replace(/\s+/g," ").trim().replace(/^(zutaten|ingredients)\s*:?\s*/i,"");
  let spuren = null;
  const m = t.match(/(kann\s+(auch\s+)?spuren|spuren\s+von|enth(ä|ae)lt\s+spuren|may contain|kann .{0,40}enthalten\.?$)[\s\S]*$/i);
  if (m){ spuren = m[0]; t = t.slice(0, m.index); }
  const parts = []; let depth = 0, cur = "";
  for (let k = 0; k < t.length; k++){
    const ch = t[k];
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth = Math.max(0, depth-1);
    const decimal = ch === "," && /\d/.test(t[k-1] || "") && /\d/.test(t[k+1] || "");
    if ((ch === "," || ch === ";") && depth === 0 && !decimal){ parts.push(cur); cur = ""; } else cur += ch;
  }
  parts.push(cur);
  return {parts: parts.map(p => p.trim().replace(/[.\s]+$/,"")).filter(p => p.length > 1), spuren};
}

/* Rezeptzutat "~1 TL Zimt" → {n:"Zimt", s:true} */
const AMOUNT_RE = /^([\d.,\/½¼¾]+(\s*[-–]\s*[\d.,]+)?\s*)?(g|kg|ml|l|el|tl|stk\.?|stück|prise|prisen|bund|dose|dosen|handvoll|scheiben?|zehen?|becher|packung|msp\.?)?\s+/i;
function recipeItem(z){
  let s = z.startsWith("~"); let n = z.replace(/^~\s*/, "");
  if (/^[\d.,½¼¾\s]*(tl|prise|msp)\b/i.test(n)) s = true;
  n = n.replace(AMOUNT_RE, "");
  return {n, s};
}
function recipeRaw(r){ return {mode:"recipe", items: r.z.map(recipeItem)}; }

/* ---------- Analyse aus dem Tagebuch ---------- */
function analyze(entries, profile){
  const rated = entries.filter(e => e.reaction === "good" || e.reaction === "bad");
  const unsure = entries.filter(e => e.reaction === "unsure").length;
  const out = {n: rated.length, unsure, bad: rated.filter(e => e.reaction === "bad").length, cats:{}, suspects:[], safe:[]};
  /* w = Gewicht eines Eintrags (aus Beschwerden abgeleitete Bewertungen zählen weniger) */
  const evs = rated.map(e => ({e, ev: evaluate(e.raw, profile), bad: e.reaction === "bad" ? 1 : 0, w: e.w ?? 1}));
  const model = detectPatterns(evs.map(({ev, bad, w}) => ({expo: ev.expo, bad, w})));
  out.model = Object.keys(model).length > 0;
  for (const c of KEYS){
    let wE = 0, bE = 0, wU = 0, bU = 0;
    for (const {ev, bad, w} of evs){ const x = ev.expo[c] * w, y = (1 - ev.expo[c]) * w; wE += x; bE += x * bad; wU += y; bU += y * bad; }
    const enough = rated.length >= 5 && wE >= 2 && wU >= 1;
    const rE = wE ? bE / wE : 0, rU = wU ? bU / wU : 0, diff = rE - rU;
    const m = model[c], conf = m ? m.conf : 0;
    let verdict = "data";
    /* Urteil: Modell-Sicherheit plus der direkte Vergleich müssen in dieselbe Richtung zeigen */
    if (enough) verdict = (conf >= 0.8 && diff >= 0.3 && rE >= 0.45) ? "strong"
      : (conf >= 0.7 && diff >= 0.2 && rE >= 0.35) ? "possible"
      : (wE >= 3 && (diff <= 0.1 || rE <= 0.25)) ? "none" : "unclear";
    out.cats[c] = {verdict, conf, or: m ? m.or : 1, rE, rU, diff, wE, wU,
      exposedBad: Math.round(bE), exposedN: evs.filter(x => x.ev.expo[c] >= 0.5).length};
  }
  /* Kategorien, die in deinen Daten fast immer zusammen auftreten (z. B. Laktose + Milcheiweiß), lassen sich nicht trennen → als Gruppe zeigen */
  const flagged = KEYS.filter(c => ["strong","possible"].includes(out.cats[c].verdict)).sort((a, b) => out.cats[b].conf - out.cats[a].conf);
  const corr = (a, b) => { const xa = evs.map(x => x.ev.expo[a]), xb = evs.map(x => x.ev.expo[b]), n = xa.length;
    const ma = xa.reduce((s, v) => s + v, 0) / n, mb = xb.reduce((s, v) => s + v, 0) / n;
    let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++){ sab += (xa[i] - ma) * (xb[i] - mb); saa += (xa[i] - ma) ** 2; sbb += (xb[i] - mb) ** 2; }
    return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0; };
  out.groups = [];
  for (const c of flagged){
    const g = out.groups.find(G => corr(G[0], c) >= 0.7);
    if (g) g.push(c); else out.groups.push([c]);
  }
  /* Zutaten-Statistik */
  const stat = {};
  for (const {e, ev, bad} of evs){
    const seen = new Set();
    for (const i of ev.items){
      if (!i.key || i.key.length < 3 || seen.has(i.key)) continue; seen.add(i.key);
      const s = stat[i.key] || (stat[i.key] = {key: i.key, name: i.name.replace(/\s*\([^)]*\)/g,"").trim(), bad:0, good:0});
      bad ? s.bad++ : s.good++;
    }
  }
  const all = Object.values(stat);
  out.suspects = all.filter(s => s.bad >= 2 && s.bad / (s.bad + s.good) >= 0.75).sort((a,b) => b.bad - a.bad || a.good - b.good).slice(0, 8);
  out.safe = all.filter(s => s.good >= 3 && s.bad === 0).sort((a,b) => b.good - a.good).slice(0, 8);
  return out;
}


/* ---------- Laktosegehalt schätzen (g je 100 g) ----------
   Richtwerte je 100 g Zutat; spezifische Einträge zuerst. Quellen: REWE/LGL/swissmilk-Tabellen, gerundet. */
const LAC_TABLE = [
  [/laktosefrei|lactosefrei|kakaobutter|erdnussbutter|sheabutter|(kokos|mandel|hafer|soja|reis|cashew|erbsen|dinkel|nuss)(milch|drink)|milchsaeure|milchsaurer|milchsaeurebakterien|joghurtkultur/, 0],
  [/(^|[^a-z])(laktose|lactose|milchzucker)([^a-z]|$)/, 100],
  [/molkenpulver|molkepulver|molkenerzeugnis|suessmolke|molkenmineral/, 70],
  [/magermilchpulver|magermilchjoghurtpulver|entrahmtes milchpulver|magermilchkonzentrat/, 51],
  [/vollmilchpulver/, 38],
  [/sahnepulver|rahmpulver/, 20],
  [/milchpulver|trockenmilch|milchtrockenmasse|milcherzeugnis/, 45],
  [/kondensmilch|kondensmilcherzeugnis/, 10],
  [/milchschokolade|vollmilchschokolade|weisse schokolade/, 7],
  [/speiseeis|eiscreme/, 6],
  [/schmelzkaese/, 5],
  [/milcheiweiss|milchprotein|kasein|casein|caseinat/, 1],
  [/(^|[^a-z])molke([^a-z]|$)/, 4.7],
  [/buttermilch/, 4],
  [/kefir|dickmilch|sauermilch/, 4],
  [/joghurt|yoghurt/, 3.5],
  [/quark|topfen/, 3.5],
  [/huettenkaese|koerniger frischkaese/, 2.5],
  [/frischkaese|mascarpone|ricotta/, 3],
  [/mozzarella/, 1],
  [/feta|hirtenkaese|halloumi/, 0.5],
  [/parmesan|grana|pecorino|emmentaler|gouda|edamer|bergkaese|cheddar|tilsiter|gruyere|appenzeller|manchego|hartkaese|schnittkaese/, 0],
  [/camembert|brie|weichkaese/, 0.1],
  [/kaese/, 0.5],
  [/sahne|rahm|creme fraiche|schmand/, 3],
  [/butterreinfett|butterschmalz|ghee/, 0],
  [/butter/, 0.6],
  [/milch/, 4.8]
];
function lacFactor(name){ const n = norm(name); for (const [re, v] of LAC_TABLE) if (re.test(n)) return v; return null; }
/* Liefert {lo, hi, src} in g/100 g oder null, wenn nichts Laktosehaltiges erkennbar ist.
   src: "label" (Herstellerangabe), "lf" (als laktosefrei gekennzeichnet), "calc" (aus Zutaten geschätzt) */
function estimateLactose(raw){
  if (!raw) return null;
  if (raw.lf) return {lo:0, hi:0.1, est:0.05, src:"lf"};
  if (raw.lac != null && isFinite(raw.lac)) return {lo:+raw.lac, hi:+raw.lac, est:+raw.lac, src:"label"};
  const items = (raw.items || []).filter(i => !i.fix && i.n);
  let sure = 0, unk = 0, found = false, prevPct = 100;
  const single = items.length === 1;
  /* Käse: Milch + Lab/Kulturen → der Milchzucker ist größtenteils abgebaut oder mit der Molke weg */
  const cheese = items.some(i => /(^|[^a-z])lab([^a-z]|$)|kaesereikultur|reifungskultur|mikrobielles lab/.test(norm(i.n)));
  items.forEach((it, k) => {
    let f = lacFactor(it.n);
    if (cheese && f === 4.8) f = 1;
    /* „3,5 % Fett“ ist kein Mengenanteil */
    const pc = /fett|protein|eiweiss/i.test(norm(it.n)) ? null : parsePct(it.n);
    const pos = k + 1;
    if (f == null){ if (pc != null) prevPct = Math.min(prevPct, pc); return; }
    if (f > 0) found = true;
    if (pc != null){ sure += pc * f / 100; prevPct = Math.min(prevPct, pc); }
    else if (single) sure += f;
    /* Anteil unbekannt: höchstens so viel wie die Zutat davor und 100 % / Position */
    else unk += Math.min(prevPct, 100 / pos) * f / 100;
  });
  if (!found) return items.some(i => lacFactor(i.n) === 0 && /milch|kaese|butter|sahne|rahm/.test(norm(i.n))) ? {lo:0, hi:0, est:0, src:"calc"} : null;
  let hi = sure + unk, est = sure + unk * 0.4;
  /* Laktose ist ein Zucker – mehr als der Zuckergehalt geht nicht */
  if (raw.sug != null && isFinite(raw.sug)){ hi = Math.min(hi, +raw.sug); est = Math.min(est, hi); }
  const r1 = x => Math.round(x * 10) / 10;
  return {lo: r1(Math.min(sure, hi)), hi: r1(hi), est: r1(est), rough: unk > 0.05, src:"calc"};
}


/* ---------- Mustererkennung über alle Kategorien (läuft komplett auf dem Gerät) ----------
   Regularisierte logistische Regression: „schlecht vertragen“ ~ Belastung je Kategorie.
   Sie trennt Kategorien, die oft gemeinsam vorkommen (z. B. Histamin + Fructose), besser als ein reiner Vergleich.
   Bootstrap (Neuziehen der Einträge) liefert, wie sicher ein Zusammenhang ist. */
function fitLogit(X, y, w, lambda){
  const n = X.length, k = X[0] ? X[0].length : 0, b = new Array(k + 1).fill(0);
  for (let it = 0; it < 12; it++){
    const g = new Array(k + 1).fill(0), H = Array.from({length: k + 1}, () => new Array(k + 1).fill(0));
    for (let i = 0; i < n; i++){
      const xi = [1, ...X[i]]; let z = 0; for (let j = 0; j <= k; j++) z += b[j] * xi[j];
      const p = 1 / (1 + Math.exp(-z)), r = w[i] * (y[i] - p), s = w[i] * p * (1 - p);
      for (let j = 0; j <= k; j++){ g[j] += r * xi[j]; for (let m = j; m <= k; m++) H[j][m] += s * xi[j] * xi[m]; }
    }
    for (let j = 0; j <= k; j++){ for (let m = 0; m < j; m++) H[j][m] = H[m][j]; if (j){ g[j] -= lambda * b[j]; H[j][j] += lambda; } else H[0][0] += 1e-6; }
    /* Newton-Schritt: H · d = g (Gauß-Elimination) */
    const A = H.map((row, i) => [...row, g[i]]);
    for (let c = 0; c <= k; c++){
      let piv = c; for (let r = c + 1; r <= k; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      [A[c], A[piv]] = [A[piv], A[c]]; const d = A[c][c] || 1e-9;
      for (let r = 0; r <= k; r++){ if (r === c) continue; const f = A[r][c] / d; if (f) for (let m = c; m <= k + 1; m++) A[r][m] -= f * A[c][m]; }
    }
    let step = 0; for (let j = 0; j <= k; j++){ const d = A[j][k + 1] / (A[j][j] || 1e-9); b[j] += d; step = Math.max(step, Math.abs(d)); }
    if (step < 1e-4) break;
  }
  return b;
}
function detectPatterns(rows){
  /* rows: [{expo:{c:0..1}, bad:0|1, w}] */
  const n = rows.length, res = {};
  const cats = KEYS.filter(c => rows.filter(r => r.expo[c] >= 0.5).length >= 1);
  if (n < 5 || !cats.length) return res;
  const X = rows.map(r => cats.map(c => r.expo[c])), y = rows.map(r => r.bad), w = rows.map(r => r.w);
  const LAMBDA = 1, B = 40, THR = Math.log(2);
  const base = fitLogit(X, y, w, LAMBDA);
  let seed = 2166136261 ^ n; const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 1e6) / 1e6; };
  const hits = new Array(cats.length).fill(0);
  for (let t = 0; t < B; t++){
    const idx = Array.from({length: n}, () => Math.floor(rnd() * n));
    const bb = fitLogit(idx.map(i => X[i]), idx.map(i => y[i]), idx.map(i => w[i]), LAMBDA);
    cats.forEach((c, j) => { if (bb[j + 1] > THR) hits[j]++; });
  }
  cats.forEach((c, j) => { res[c] = {beta: base[j + 1], or: Math.exp(base[j + 1]), conf: hits[j] / B}; });
  return res;
}

/* Neue Kategorien für die Lebensmittel-Liste aus den Regeln ableiten (Spalten der Tabelle haben Vorrang) */
if (typeof FOODS !== "undefined"){
  const EXTRA = {"Zuckerfreier Kaugummi":{s:2, o:2}, "Tofu, Soja":{o:1}, "Sojamilch":{o:1}};
  for (const f of FOODS){
    const t = rateText(f.n, {});
    for (const c of KEYS) if (f[c] === undefined) f[c] = t.res[c] ?? 0;
    Object.assign(f, EXTRA[f.n] || {});
  }
}

if (typeof module !== "undefined") module.exports = {CAT_DEF, CAT, KEYS, CATS, LABEL, norm, ingKey, parsePct, rateText, finalLevel, evaluate, reasonText, splitIngredients, recipeItem, recipeRaw, analyze, estimateLactose, lacFactor, detectPatterns};
