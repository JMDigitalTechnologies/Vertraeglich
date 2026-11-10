/* Regeltests: node tests/rules.test.js
   Jede Zeile: Zutatenliste, Profil (Kategorie[:Stufe]), erwartete Ampel (G/Y/R) */
"use strict";
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = {console}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8") + "\n" +
  fs.readFileSync(path.join(root, "engine.js"), "utf8").replace(/if \(typeof module !== "undefined"\)[\s\S]*$/, "") +
  "\nthis.E = {evaluate, splitIngredients, recipeRaw, RECIPES, KEYS, FOODS, estimateLactose, analyze};", ctx);
const E = ctx.E;
function prof(spec){
  const on = {}, sens = {};
  for (const k of E.KEYS){ on[k] = false; sens[k] = 2; }
  for (const part of spec.split(",")){ const [k, s] = part.trim().split(":"); on[k] = true; if (s) sens[k] = +s; }
  return {on, sens, mine: {}};
}
const CASES = [
  // Gluten / Weizen
  ["Weizenmehl, Wasser, Salz", "g", "R"],
  ["Roggenmehl, Wasser, Salz", "wa", "G"],
  ["Roggenmehl, Wasser, Salz", "g:3", "R"],
  ["Maismehl, glutenfreie Weizenstärke, Zucker", "wa", "R"],
  ["Reis, Glukosesirup (aus Weizen), Salz", "g:3", "G"],
  ["Reis, Glukosesirup (aus Weizen), Salz", "wa", "G"],
  ["Haferflocken (glutenfrei), Zucker", "g:3", "G"],
  ["Haferflocken, Zucker", "g:3", "R"],
  ["Reis, Zucker. Kann Spuren von Weizen enthalten.", "g:3", "R"],
  ["Reis, Zucker. Kann Spuren von Weizen enthalten.", "g:1", "G"],
  ["Buchweizenmehl, Wasser", "g:3", "G"],
  ["Buchweizenmehl, Wasser", "wa", "G"],
  ["Sojasauce, Reis", "g", "R"],
  ["Tamari (glutenfrei), Reis", "g:3", "G"],
  ["Gerstenmalzextrakt, Reis", "wa", "G"],
  ["Gerstenmalzextrakt, Reis", "g", "R"],
  // Laktose / Milcheiweiß
  ["Vollmilch, Zucker", "l", "R"],
  ["Laktosefreie Milch, Zucker", "l", "G"],
  ["Laktosefreie Milch, Zucker", "m", "R"],
  ["Butter, Mehl", "l", "G"],
  ["Butter, Reismehl", "m", "R"],
  ["Milchsäure, Reis", "l", "G"],
  ["Milchsäure, Reis", "m", "G"],
  ["Kokosmilch, Reis", "m", "G"],
  ["Kakaobutter, Zucker", "m", "G"],
  ["Erdnussbutter, Reis", "m", "G"],
  ["Parmesan, Reis", "l", "G"],
  // Histamin
  ["Tomatenmark, Wasser", "h", "R"],
  ["Hefeextrakt, Salz", "h", "R"],
  ["Zitronensäure, Wasser", "h", "G"],
  ["Rotwein, Wasser", "h", "R"],
  ["Schweinefleisch, Salz", "h", "G"],
  ["Weinsäure, Zucker", "h", "G"],
  // Fructose / Sorbit / FODMAP
  ["Apfelsaftkonzentrat, Wasser", "f", "R"],
  ["Sorbit, Zucker", "s", "R"],
  ["Sorbit, Zucker", "o", "R"],
  ["Zwiebel, Reis, Salz", "o", "R"],
  ["Reis, Karotte, Salz", "o", "G"],
  // Allergene
  ["Haselnüsse, Zucker", "nu", "R"],
  ["Kokosnuss, Zucker", "nu", "G"],
  ["Muskatnuss, Salz", "nu", "G"],
  ["Erdnüsse, Salz", "p", "R"],
  ["Erdnüsse, Salz", "nu", "G"],
  ["Tintenfischringe, Mehl", "i", "G"],
  ["Tintenfischringe, Mehl", "w", "R"],
  ["Garnelen, Reis", "kr", "R"],
  ["Thunfisch, Öl", "i", "R"],
  ["Eier, Zucker", "e", "R"],
  ["Eigelb, Zucker", "e", "R"],
  ["Reis, Salz, Weißwein", "e", "G"],
  ["Sojalecithin, Kakaobutter", "y", "R"],
  ["Selleriesalz, Wasser", "c", "R"],
  ["Senfsaat, Essig", "u", "R"],
  ["Tahin, Kichererbsen", "z", "R"],
  ["Lupinenmehl, Wasser", "v", "R"],
  ["Getrocknete Aprikosen (geschwefelt)", "q", "R"],
  ["Reis, Zucker. Kann Spuren von Sesam enthalten.", "z:1", "G"],
  ["Reis, Zucker. Kann Spuren von Sesam enthalten.", "z", "Y"],
  ["Reis, Zucker. Kann Spuren von Sesam enthalten.", "z:3", "R"],
  // Tomate
  ["Gewürze, Salz, Kartoffeln", "t", "Y"],
  ["Tomatenpulver 0,5%, Kartoffeln, Salz, Öl, Zucker, Pfeffer", "t", "R"],
  ["Kartoffeln, Salz", "t", "G"],
  // Mengen
  ["Kartoffeln, Sonnenblumenöl, Salz, Zucker, Pfeffer, Knoblauch 1%", "f", "G"],
  ["Kartoffeln, Sonnenblumenöl, Salz, Zucker, Pfeffer, Knoblauch 1%", "f:3", "Y"],
];
let fail = 0;
for (const [txt, spec, want] of CASES){
  const {parts, spuren} = E.splitIngredients(txt);
  const ev = E.evaluate({mode:"label", items: parts.map(n => ({n})), spuren, gf: /^Reis, Glukose/.test(txt) ? false : false}, prof(spec));
  const got = ["G","Y","R"][ev.total];
  if (got !== want){ fail++; console.log(`✕ [${spec}] erwartet ${want}, bekommen ${got}: ${txt}`); }
}
/* Rezepte: jede Zutat muss sich auswerten lassen */
for (const r of E.RECIPES){ const items = E.recipeRaw(r).items; if (items.some(i => !i.n)){ fail++; console.log("✕ Rezept mit leerer Zutat: " + r.t); } }
/* Laktose-Schätzung (g/100 g) */
const LAC_CASES = [
  ["Zucker, Palmöl, Haselnüsse 13%, Magermilchpulver 8,7%, fettarmer Kakao 7,4%", {}, 4.4],
  ["Vollmilch 3,5 % Fett", {}, 4.8],
  ["Weizenmehl, Wasser, Hefe, Salz", {}, null],
  ["laktosefreie Milch 1,5% Fett", {lf:true}, 0.05],
  ["Milch", {lac:4.7}, 4.7],
  ["Milch, Salz, Lab, Käsereikulturen", {sug:0}, 0],
];
for (const [txt, x, want] of LAC_CASES){
  const r = E.estimateLactose(Object.assign({items: E.splitIngredients(txt).parts.map(n => ({n}))}, x));
  const got = r ? r.est : null;
  if (got !== want){ fail++; console.log(`✕ Laktose erwartet ${want}, bekommen ${got}: ${txt}`); }
}
/* Analyse: erkennt Laktose auch ohne Profil, meldet ohne Muster nichts */
{
  const F = n => { const f = E.FOODS.find(x => x.n === n); return {raw:{mode:"food", items:[{n:f.n, x:Object.fromEntries(E.KEYS.map(c => [c, f[c] || 0]))}]}}; };
  const empty = {on:Object.fromEntries(E.KEYS.map(k => [k, false])), sens:{}, mine:{}};
  const bad = ["Milch","Quark","Joghurt natur","Sahne","Frischkäse","Speiseeis (Milch)","Kefir, Buttermilch","Milch"], good = ["Reis","Kartoffel","Banane","Laktosefreie Milch","Hafermilch","Apfel","Gouda alt, Emmentaler, Bergkäse","Süßkartoffel","Tomate","Reisnudeln","Laktosefreier Joghurt","Mandelmilch"];
  const ents = [...bad.map(n => Object.assign(F(n), {reaction:"bad"})), ...good.map(n => Object.assign(F(n), {reaction:"good"}))];
  const a = E.analyze(ents, empty);
  if (a.cats.l.verdict !== "strong"){ fail++; console.log("✕ Analyse erkennt Laktose nicht: " + a.cats.l.verdict); }
  if (["strong","possible"].includes(a.cats.h.verdict)){ fail++; console.log("✕ Analyse meldet Histamin fälschlich"); }
  const calm = E.analyze([...bad, ...good].map((n, i) => Object.assign(F(n), {reaction: i % 3 ? "good" : "bad"})), empty);
  if (calm.groups.length > 1){ fail++; console.log("✕ Analyse meldet Muster bei Zufallsdaten: " + calm.groups.join(" | ")); }
}
/* Rezepte: was in der Zubereitung verwendet wird, steht auch in der Zutatenliste */
const norm = s => String(s||"").toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss");
const STEP_WORDS = ["salz","pfeffer","oel","wasser","zucker","zitronensaft","limettensaft","essig","butter","milch","haferdrink","hafermilch","reismilch","sahne","kraeuter","petersilie","schnittlauch","dill","basilikum","koriander","minze","rosmarin","zimt","muskat","kurkuma","ingwer","honig","ahornsirup","mehl","staerke","backpulver","sesam","kokosmilch","kokosdrink","knoblauch","zwiebel","ei","eier","frischkaese","joghurt","quark","parmesan","feta","mozzarella","kaese","pilze","champignons","fisch","tomaten","wein"];
const stemW = w => w.replace(/(en|n|e|er|s)$/, "");
for (const r of E.RECIPES){
  const zt = norm(r.z.join(" | ")), st = norm(r.s.join(" "));
  const miss = STEP_WORDS.filter(w => new RegExp("(^|[^a-z])" + w + "([^a-z]|$)").test(st) && !zt.includes(stemW(w)));
  if (miss.length){ fail++; console.log("✕ Rezept „" + r.t + "“: in der Zubereitung, aber nicht in den Zutaten: " + miss.join(", ")); }
}
console.log(fail ? `\n${fail} von ${CASES.length} Tests fehlgeschlagen` : `✓ Alle ${CASES.length} Regeltests bestanden, ${E.RECIPES.length} Rezepte geprüft`);
process.exit(fail ? 1 : 0);
