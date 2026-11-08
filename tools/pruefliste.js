/* Erzeugt docs/PRUEFLISTE.md – Prüfliste für Ernährungsfachkraft/Allergologie: node tools/pruefliste.js */
"use strict";
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = {console}; vm.createContext(ctx);
vm.runInContext(["data.js", "engine.js"].map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n").replace(/if \(typeof module !== "undefined"\)[\s\S]*$/, "") + "\nthis.D = {RULES, FOODS, CAT_DEF, SUBS};", ctx);
const src = fs.readFileSync(path.join(root, "features.js"), "utf8");
const {RULES, FOODS, CAT_DEF, SUBS} = ctx.D;
const L = ["✓ ok", "! Vorsicht", "✕ meiden"];
let md = `# Prüfliste „Verträglich“\n\nZum fachlichen Abgleich durch eine Ernährungsfachkraft bzw. Allergologie. Bitte in der Spalte „Prüfung“ mit ✔ / Korrektur markieren.\n\nStand: ${new Date().toLocaleDateString("de-DE")}\n\n`;
md += `## 1. Kategorien\n\n| Kürzel | Kategorie | Gruppe | Beschreibung | Prüfung |\n|---|---|---|---|---|\n` + CAT_DEF.map(d => `| ${d.short} | ${d.n} | ${d.grp === "all" ? "Allergie" : "Unverträglichkeit"} | ${d.desc} | |`).join("\n") + "\n\n";
md += `## 2. Zutaten-Regeln (${RULES.length})\n\nWert 0 = ok, 1 = Vorsicht, 2 = meiden. „Ausnahme“ überschreibt andere Treffer.\n\n| Muster | Bewertung | Begründung | Prüfung |\n|---|---|---|---|\n` +
  RULES.map(r => `| \`${String(r.re).replace(/\|/g, "\\|")}\` | ${CAT_DEF.filter(d => r[d.k] != null).map(d => d.short + "=" + r[d.k]).join(", ")}${r.ov ? " (Ausnahme)" : ""} | ${r.why || ""} | |`).join("\n") + "\n\n";
md += `## 3. Lebensmittel-Liste (${FOODS.length})\n\n| Lebensmittel | ${CAT_DEF.map(d => d.short).join(" | ")} | Hinweis | Prüfung |\n|---|${CAT_DEF.map(() => "---").join("|")}|---|---|\n` +
  FOODS.map(f => `| ${f.n} | ${CAT_DEF.map(d => f[d.k] ? f[d.k] : "").join(" | ")} | ${f.note || ""} | |`).join("\n") + "\n\n";
md += `## 4. Austauschvorschläge (${SUBS.length})\n\n| Zutat (Muster) | Vorschläge | Prüfung |\n|---|---|---|\n` + SUBS.map(s => `| \`${String(s.re).replace(/\|/g, "\\|")}\` | ${Object.entries(s.for).map(([k, v]) => (CAT_DEF.find(d => d.k === k) || {}).short + ": " + v).join("; ")} | |`).join("\n") + "\n\n";
const prog = src.slice(src.indexOf("const PROGRAMS"), src.indexOf("const testName"));
const plan = src.slice(src.indexOf("const PLAN_DEFAULT"), src.indexOf("function renderSos"));
md += `## 5. Ernährungsprogramme (Phasen, Dauern, Tests, Hinweise)\n\n\`\`\`js\n${prog.trim()}\n\`\`\`\n\n## 6. Standard-Notfallplan (Anaphylaxie)\n\n\`\`\`js\n${plan.trim()}\n\`\`\`\n\n## 7. Offene fachliche Fragen\n\n- Zeitfenster für die Zuordnung von Beschwerden (schnelle Reaktionen 0–4 h, Verdauung 0,5–12 h)\n- Dauer der Karenzphase bei Fruktosemalabsorption (2–4 Wochen?)\n- Intervall bis zum zweiten Adrenalin-Pen (5–10 oder 5–15 Minuten?)\n- Bewertung von Lebensmitteln mit portionsabhängiger Verträglichkeit (FODMAP)\n`;
fs.writeFileSync(path.join(root, "docs", "PRUEFLISTE.md"), md);
console.log("docs/PRUEFLISTE.md erstellt (" + md.length + " Zeichen)");
