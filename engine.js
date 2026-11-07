"use strict";
/* Verträglich – Bewertungslogik (ohne DOM, testbar)
   raw = {mode:"label"|"recipe"|"food", items:[{n, s?:klein, x?:{h,f,g,l} feste Werte, fix?:true}], spuren?, gf?, lf?} */

const KEYS = ["h","f","g","l"];
const CATS = {h:"Histamin", f:"Fructose", g:"Gluten", l:"Laktose"};
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
  const res = {h:null,f:null,g:null,l:null}, why = {h:[],f:[],g:[],l:[]}, ov = {h:null,f:null,g:null,l:null}, ovWhy = {h:[],f:[],g:[],l:[]};
  for (const r of RULES){
    if (!r.re.test(n)) continue;
    for (const c of KEYS){
      if (r[c] == null) continue;
      if (r.o){ ov[c] = ov[c] == null ? r[c] : Math.min(ov[c], r[c]); if (r.why) ovWhy[c].push(r.why); }
      else { res[c] = Math.max(res[c] ?? 0, r[c]); if (r[c] > 0 && r.why && !why[c].includes(r.why)) why[c].push(r.why); }
    }
  }
  for (const c of KEYS) if (ov[c] != null){ res[c] = ov[c]; why[c] = ovWhy[c]; }
  if (ctx && ctx.gf && res.g != null){ res.g = 0; why.g = []; }
  if (ctx && ctx.lf && res.l != null){ res.l = 0; why.l = []; }
  return {res, why};
}

/* gewichteter Wert: kleine Menge zählt eine halbe Stufe weniger – außer bei Gluten (da zählt jede Menge) */
function weighted(c, raw, small){ return (small && c !== "g") ? Math.max(0, raw - 0.5) : raw; }
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
  if (raw.spuren && !ctx.gf){
    const t = rateText(raw.spuren, {});
    if ((t.res.g ?? 0) >= 1){
      const r = {h:0,f:0,g:1,l:0}, lvl = {};
      for (const c of KEYS) lvl[c] = finalLevel(c, r[c], false, profile.sens[c]);
      items.push({name: String(raw.spuren).trim(), key: "", r, lvl, why:{h:"",f:"",g:"Spuren von glutenhaltigem Getreide",l:""}, small:false, pos:null, pct:null, mine:null, trace:true, fix:true});
    }
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
  for (const ch of t){
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth = Math.max(0, depth-1);
    if ((ch === "," || ch === ";") && depth === 0){ parts.push(cur); cur = ""; } else cur += ch;
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
  const evs = rated.map(e => ({e, ev: evaluate(e.raw, profile), bad: e.reaction === "bad" ? 1 : 0}));
  for (const c of KEYS){
    let wE = 0, bE = 0, wU = 0, bU = 0;
    for (const {ev, bad} of evs){ const x = ev.expo[c]; wE += x; bE += x * bad; wU += 1 - x; bU += (1 - x) * bad; }
    const enough = rated.length >= 5 && wE >= 2 && wU >= 1;
    const rE = wE ? bE / wE : 0, rU = wU ? bU / wU : 0, diff = rE - rU;
    let verdict = "data";
    if (enough) verdict = (diff >= 0.4 && rE >= 0.5) ? "strong" : (diff >= 0.2 && rE >= 0.35) ? "possible" : "none";
    out.cats[c] = {verdict, rE, rU, diff, wE, wU,
      exposedBad: Math.round(bE), exposedN: evs.filter(x => x.ev.expo[c] >= 0.5).length};
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

if (typeof module !== "undefined") module.exports = {KEYS, CATS, LABEL, norm, ingKey, parsePct, rateText, finalLevel, evaluate, reasonText, splitIngredients, recipeItem, recipeRaw, analyze};
