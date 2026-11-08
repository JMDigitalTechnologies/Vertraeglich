"use strict";
/* Verträglich – Daten: Lebensmittel, Zutaten-Regeln, Rezepte
   Bewertung: 0 = verträglich, 1 = Vorsicht, 2 = meiden
   Kategorien: siehe CAT_DEF in engine.js (h Histamin, f Fructose, s Sorbit, l Laktose, g Gluten, o FODMAP, t Tomate,
   m Milcheiweiß, e Ei, y Soja, nu Schalenfrüchte, p Erdnuss, c Sellerie, u Senf, z Sesam, i Fisch, kr Krebstiere, w Weichtiere, v Lupine, q Sulfite) */

/* ---------- Lebensmittel: Name|Kategorie|h|f|g|l|Hinweis ---------- */
const FOOD_RAW = `
Kartoffel|Gemüse|0|0|0|0|
Karotte|Gemüse|0|0|0|0|
Gurke|Gemüse|0|0|0|0|
Zucchini|Gemüse|0|0|0|0|
Kürbis|Gemüse|0|0|0|0|
Paprika|Gemüse|0|0|0|0|
Brokkoli|Gemüse|0|1|0|0|Kann blähen
Blumenkohl|Gemüse|0|1|0|0|Kann blähen
Fenchel|Gemüse|0|0|0|0|
Rote Bete|Gemüse|0|0|0|0|
Süßkartoffel|Gemüse|0|0|0|0|
Mais|Gemüse|0|0|0|0|
Kopfsalat, Eisberg|Gemüse|0|0|0|0|
Feldsalat|Gemüse|0|0|0|0|
Rucola|Gemüse|0|0|0|0|
Spargel|Gemüse|0|1|0|0|Fruktane
Tomate|Gemüse|2|0|0|0|Histaminliberator – auch Tomatenmark, Ketchup, Passata
Spinat|Gemüse|2|0|0|0|Histaminreich
Aubergine|Gemüse|2|0|0|0|Histaminreich
Avocado|Gemüse|2|0|0|0|Histaminreich
Sauerkraut|Gemüse|2|0|0|0|Fermentiert
Oliven|Gemüse|2|0|0|0|Meist fermentiert oder eingelegt
Essiggurken|Gemüse|2|0|0|0|Essig
Pilze, Champignons|Gemüse|1|1|0|0|Nur ganz frisch
Zwiebel|Gemüse|0|1|0|0|Fruktane – kleine Mengen oft ok
Knoblauch|Gemüse|0|1|0|0|Fruktane – kleine Mengen oft ok
Lauch|Gemüse|0|1|0|0|Fruktane
Erbsen|Hülsenfrüchte|1|1|0|0|
Linsen|Hülsenfrüchte|1|1|0|0|
Kichererbsen|Hülsenfrüchte|1|1|0|0|
Kidneybohnen|Hülsenfrüchte|1|1|0|0|
Tofu, Soja|Hülsenfrüchte|1|1|0|0|Individuell sehr verschieden
Erdnüsse|Nüsse & Samen|2|0|0|0|Histaminliberator
Walnuss|Nüsse & Samen|2|0|0|0|
Cashew|Nüsse & Samen|2|0|0|0|
Haselnuss|Nüsse & Samen|1|0|0|0|
Mandel|Nüsse & Samen|1|0|0|0|
Macadamia|Nüsse & Samen|0|0|0|0|
Kürbiskerne|Nüsse & Samen|0|0|0|0|
Sonnenblumenkerne|Nüsse & Samen|1|0|0|0|
Leinsamen|Nüsse & Samen|0|0|0|0|
Chiasamen|Nüsse & Samen|0|0|0|0|
Apfel|Obst|0|2|0|0|Viel Fruktose und Sorbit
Birne|Obst|0|2|0|0|Viel Fruktose und Sorbit
Mango|Obst|0|2|0|0|
Wassermelone|Obst|0|2|0|0|
Kirsche|Obst|0|2|0|0|Sorbit
Pflaume|Obst|1|2|0|0|Sorbit
Trockenobst (Rosinen, Datteln, Feigen)|Obst|1|2|0|0|Sehr fruktosereich
Honigmelone|Obst|0|1|0|0|
Weintrauben|Obst|0|1|0|0|
Pfirsich, Nektarine|Obst|0|1|0|0|
Aprikose|Obst|0|1|0|0|Sorbit
Johannisbeere|Obst|0|1|0|0|
Banane|Obst|1|0|0|0|Sehr reif mehr Histamin
Heidelbeere|Obst|0|0|0|0|
Himbeere|Obst|1|0|0|0|
Rhabarber|Obst|0|0|0|0|
Papaya|Obst|1|0|0|0|
Erdbeere|Obst|2|0|0|0|Histaminliberator
Kiwi|Obst|2|0|0|0|Histaminliberator
Ananas|Obst|2|1|0|0|Histaminliberator
Orange|Obst|2|0|0|0|Zitrusfrucht
Mandarine|Obst|2|0|0|0|Zitrusfrucht
Grapefruit|Obst|2|0|0|0|Zitrusfrucht
Zitrone|Obst|1|0|0|0|Etwas Saft zum Würzen oft ok
Reis|Getreide & Brot|0|0|0|0|
Hirse|Getreide & Brot|0|0|0|0|
Buchweizen|Getreide & Brot|0|0|0|0|Kein Weizen – glutenfrei
Quinoa|Getreide & Brot|0|0|0|0|
Amaranth|Getreide & Brot|0|0|0|0|
Maismehl, Polenta|Getreide & Brot|0|0|0|0|
Reisnudeln|Getreide & Brot|0|0|0|0|
Hafer|Getreide & Brot|0|0|1|0|Nur als „glutenfrei“ gekennzeichnet sicher
Weizen|Getreide & Brot|0|1|2|0|Fruktane
Dinkel|Getreide & Brot|0|1|2|0|
Roggen|Getreide & Brot|0|1|2|0|
Gerste|Getreide & Brot|0|1|2|0|
Bulgur, Couscous|Getreide & Brot|0|1|2|0|Aus Weizen
Nudeln (Weizen)|Getreide & Brot|0|1|2|0|
Weizenbrot, Brötchen|Getreide & Brot|0|1|2|0|
Roggenbrot, Sauerteig|Getreide & Brot|1|1|2|0|
Glutenfreies Brot|Getreide & Brot|0|0|0|0|Zutaten trotzdem prüfen
Paniermehl|Getreide & Brot|0|1|2|0|
Milch|Milchprodukte|0|0|0|2|Etwa 5 g Laktose pro 100 ml
Laktosefreie Milch|Milchprodukte|0|0|0|0|
Butter|Milchprodukte|0|0|0|0|Nur Spuren von Laktose – meist gut verträglich
Ghee, Butterschmalz|Milchprodukte|0|0|0|0|Praktisch laktosefrei
Sahne|Milchprodukte|0|0|0|1|
Quark|Milchprodukte|0|0|0|1|
Frischkäse|Milchprodukte|0|0|0|1|
Mozzarella|Milchprodukte|0|0|0|0|Frisch; wenig Laktose
Mascarpone|Milchprodukte|0|0|0|1|
Hüttenkäse|Milchprodukte|0|0|0|1|
Joghurt natur|Milchprodukte|1|0|0|1|Die Joghurtkulturen helfen beim Laktoseabbau
Laktosefreier Joghurt|Milchprodukte|1|0|0|0|
Kefir, Buttermilch|Milchprodukte|1|0|0|1|
Gouda jung|Milchprodukte|1|0|0|0|
Gouda alt, Emmentaler, Bergkäse|Milchprodukte|2|0|0|0|Gereift: histaminreich, aber laktosefrei
Parmesan|Milchprodukte|2|0|0|0|Gereift: histaminreich, aber laktosefrei
Camembert, Brie|Milchprodukte|2|0|0|0|Gereift
Eier|Fleisch, Fisch & Eier|1|0|0|0|Eiklar ist ein Histaminliberator; durchgegart meist ok
Frisches Fleisch (Rind, Schwein, Geflügel)|Fleisch, Fisch & Eier|0|0|0|0|Frisch kaufen, schnell verarbeiten
Hackfleisch|Fleisch, Fisch & Eier|1|0|0|0|Verdirbt schnell – ganz frisch verarbeiten
Kochschinken|Fleisch, Fisch & Eier|1|0|0|0|
Würstchen|Fleisch, Fisch & Eier|1|0|1|1|Teils Weizen oder Milchzucker
Salami|Fleisch, Fisch & Eier|2|0|0|0|Gereift
Rohschinken (Parma, Serrano)|Fleisch, Fisch & Eier|2|0|0|0|Gereift
Fisch frisch oder TK|Fleisch, Fisch & Eier|0|0|0|0|Nur fangfrisch oder direkt tiefgekühlt
Thunfisch (Dose)|Fleisch, Fisch & Eier|2|0|0|0|
Räucherlachs|Fleisch, Fisch & Eier|2|0|0|0|
Makrele, Hering|Fleisch, Fisch & Eier|2|0|0|0|
Garnelen, Meeresfrüchte|Fleisch, Fisch & Eier|2|0|0|0|
Wasser|Getränke|0|0|0|0|
Kräutertee|Getränke|0|0|0|0|
Schwarzer und grüner Tee|Getränke|1|0|0|0|
Kaffee|Getränke|1|0|0|0|Individuell
Rotwein|Getränke|2|0|0|0|
Weißwein, Sekt|Getränke|2|0|0|0|
Bier|Getränke|2|0|2|0|Gerste
Apfelsaft, Birnensaft|Getränke|0|2|0|0|
Orangensaft|Getränke|2|1|0|0|
Cola, Limonade|Getränke|1|1|0|0|Oft Glukose-Fruktose-Sirup
Energy-Drinks|Getränke|2|1|0|0|
Kombucha|Getränke|2|0|0|0|Fermentiert
Hafermilch|Getränke|0|1|1|0|Nur mit glutenfreiem Hafer sicher
Reismilch|Getränke|0|0|0|0|
Mandelmilch|Getränke|1|0|0|0|
Sojamilch|Getränke|1|1|0|0|
Kokosmilch|Getränke|0|0|0|0|
Haushaltszucker|Süßes|0|1|0|0|In kleinen Mengen meist ok
Traubenzucker|Süßes|0|0|0|0|Kann die Fruktose-Aufnahme verbessern
Ahornsirup|Süßes|0|0|0|0|
Reissirup|Süßes|0|0|0|0|
Honig|Süßes|0|2|0|0|
Agavendicksaft|Süßes|0|2|0|0|
Zartbitterschokolade|Süßes|2|1|0|0|Histaminliberator
Milchschokolade|Süßes|2|1|0|1|
Gummibärchen|Süßes|0|1|0|0|Zutaten prüfen
Zuckerfreier Kaugummi|Süßes|0|2|0|0|Sorbit, Xylit
Speiseeis (Milch)|Süßes|0|1|0|1|
Sojasauce|Würzen|2|0|2|0|Fermentiert, meist mit Weizen – Tamari ist oft glutenfrei
Wein- und Balsamicoessig|Würzen|2|0|0|0|
Branntweinessig|Würzen|1|0|0|0|
Senf|Würzen|1|0|0|0|
Ketchup|Würzen|2|1|0|0|
Hefeextrakt|Würzen|2|0|0|0|
Gemüsebrühe (Fertig)|Würzen|2|1|1|1|Oft Hefeextrakt, Glutamat, Weizen, Milchzucker
Chili, Curry|Würzen|1|0|0|0|
Frische Kräuter|Würzen|0|0|0|0|
Salz, Pfeffer|Würzen|0|0|0|0|
`;
const TOMATO_FOODS = {"Tomate":2, "Ketchup":2, "Gemüsebrühe (Fertig)":1};
const FOODS = FOOD_RAW.trim().split("\n").map(l => {
  const [n,k,h,f,g,lk,note] = l.split("|");
  return {n, k, h:+h, f:+f, g:+g, l:+lk, t: TOMATO_FOODS[n] || 0, note: note || ""};
});

/* ---------- Regeln für Zutatenlisten (auf normalisierten Text: klein, ä→ae, ö→oe, ü→ue, ß→ss) ----------
   ov:true = Ausnahme: überschreibt die Kategorie für diese Zutat (kleinster Ausnahme-Wert gewinnt) */
const RULES = [
  /* --- Ausnahmen --- */
  {re:/glu[ck]osesirup|dextrose|maltodextrin|glu[ck]ose\b|glucose syrup/, g:0, wa:0, ov:true},
  {re:/glu[ck]osesirup(?!.*fru[ck]tose)|dextrose|maltodextrin|glucose syrup/, o:0, ov:true},
  {re:/weizenstaerke|wheat starch/, g:1, o:1, ov:true, why:"Weizenstärke – kann glutenfrei aufbereitet sein, Kennzeichnung prüfen"},
  {re:/buchweizen|buckwheat/, g:0, wa:0, ov:true},
  {re:/buchweizen|buckwheat/, o:0, ov:true},
  {re:/glutenfrei|gluten-free|gluten free|ohne gluten/, g:0, ov:true},
  {re:/laktosefrei|lactose-free|lactose free|ohne laktose/, l:0, ov:true},
  {re:/zitronensaeure|citronensaeure|citric acid|e ?330(?!\d)|ascorbinsaeure|ascorbic|weinsaeure|milchsaeure|lactic acid|e ?270(?!\d)/, h:0, l:0, ov:true},
  {re:/frischkaese|huettenkaese|mozzarella|mascarpone|ricotta|cream cheese/, h:0, ov:true},
  {re:/kakaobutter|cocoa butter/, h:0, ov:true},
  {re:/milchreis|milchsaeurebakterien|milchsaeure/, l:0, ov:true},
  {re:/milchsaeure|lactic acid|milchsaeurebakterien|kakaobutter|cocoa butter|erdnussbutter|sheabutter|kokosmilch|kokosnussmilch|hafermilch|mandelmilch|sojamilch|reismilch|milchreis|e ?270(?!\d)|e ?32[5-7](?!\d)/, m:0, ov:true},
  {re:/kokosnuss|kokos|muskatnuss|muskat|(^|[^a-z])erdnuss/, nu:0, ov:true},
  {re:/tintenfisch/, i:0, ov:true},

  /* --- Weizenallergie (Weizeneiweiß – unabhängig von „glutenfrei“) --- */
  {re:/weizen|dinkel|emmer|einkorn|kamut|khorasan|durum|gruenkern|bulgur|couscous|seitan|griess|triticale|wheat|spelt|paniermehl|semmelbroesel/, wa:2, why:"Weizen bzw. Weizenart – auch als Stärke oder glutenfrei relevant"},
  {re:/gluten(?!frei|-free| free)|glutenhaltiges getreide/, wa:1, why:"Gluten – Getreideart unklar, kann Weizen sein"},

  /* --- Gluten --- */
  {re:/weizen|dinkel|roggen|gerste|emmer|einkorn|kamut|khorasan|gruenkern|triticale|bulgur|couscous|seitan|griess|paniermehl|semmelbroesel|wheat|barley|(^|[^a-z])rye([^a-z]|$)|spelt|durum/, g:2, why:"Glutenhaltiges Getreide"},
  {re:/gerstenmalz|malzextrakt|roestmalz|(^|[^a-z])malz([^a-z]|$)|malt extract|barley malt|(^|[^a-z])malt([^a-z]|$)/, g:2, why:"Malz aus Gerste – glutenhaltig"},
  {re:/gluten(?!frei|-free| free)/, g:2, why:"Enthält Gluten"},
  {re:/hafer|(^|[^a-z])oats?([^a-z]|$)|oatmeal/, g:1, why:"Hafer – nur als glutenfrei gekennzeichnet sicher"},
  {re:/(^|[^a-z])bier|(^|[^a-z])beer/, g:2, h:2, why:"Bier – Gerste, histaminreich"},

  /* --- Laktose --- */
  {re:/laktose|lactose|milchzucker/, l:2, why:"Laktose (Milchzucker)"},
  {re:/milchpulver|magermilchpulver|vollmilchpulver|molke|milchserum|kondensmilch|milk powder|skimmed milk|whey|milk solids/, l:2, why:"Milchpulver/Molke – laktosereich"},
  {re:/(^|[^a-z])(voll|mager|frisch|kuh|roh|teilentrahmte |fettarme |haltbare )?milch(?!saeure|eiweiss|protein|fett|saeurebakterien)|(^|[^a-z])milk(?! protein| fat)/, l:2, why:"Milch – laktosereich"},
  {re:/buttermilch|buttermilk/, l:2, why:"Buttermilch"},
  {re:/milcheiweiss|milchprotein|milk protein|kasein|casein/, l:1, why:"Milcheiweiß – kann Laktose-Reste enthalten"},
  {re:/sahne|(^|[^a-z])rahm|schmand|creme fraiche|crème fraîche|(^|[^a-z])cream([^a-z]|$)/, l:1, why:"Sahne/Rahm"},
  {re:/joghurt|jogurt|yogh?urt|kefir|quark|frischkaese|mascarpone|ricotta|huettenkaese|cream cheese/, l:1, why:"Frische Milchprodukte – Laktose"},

  /* --- Fructose --- */
  {re:/fru[ck]tose|fruchtzucker/, f:2, why:"Fruktose"},
  {re:/invertzucker|invert sugar/, f:2, why:"Invertzucker – zur Hälfte Fruktose"},
  {re:/honig|honey/, f:2, why:"Honig – sehr fruktosereich"},
  {re:/agave/, f:2, why:"Agavendicksaft – sehr fruktosereich"},
  {re:/dicksaft|fruchtsuesse/, f:2, why:"Fruchtdicksaft – fruktosereich"},
  {re:/sorbit|e ?420(?!\d)/, f:2, why:"Sorbit – verschlechtert die Fruktose-Aufnahme"},
  {re:/xylit|e ?967(?!\d)/, f:2, why:"Xylit (Zuckeralkohol)"},
  {re:/mannit|e ?421(?!\d)/, f:2, why:"Mannit (Zuckeralkohol)"},
  {re:/maltit|e ?965(?!\d)/, f:2, why:"Maltit (Zuckeralkohol)"},
  {re:/isomalt|e ?953(?!\d)/, f:2, why:"Isomalt (Zuckeralkohol)"},
  {re:/lactit|lactitol|e ?966(?!\d)/, f:2, why:"Lactit (Zuckeralkohol)"},
  {re:/erythrit|e ?968(?!\d)/, f:1, why:"Erythrit – meist besser verträglich als andere Zuckeralkohole"},
  {re:/inulin|oligofru[ck]tose|fructooligo|chicoree|chicory/, f:1, why:"Fruktane"},
  {re:/apfel|aepfel|birne|mango|pflaume|dattel|feige|rosine|trockenobst|trockenfruecht|(^|[^a-z])apples?([^a-z]|$)|(^|[^a-z])pears?([^a-z]|$)|raisin|(^|[^a-z])dates?([^a-z]|$)/, f:2, why:"Fruktosereiches Obst"},
  {re:/fruchtsaft|saftkonzentrat|fruchtpulver|fruchtzubereitung|fruit juice|juice concentrate/, f:1, why:"Fruchtsaft/-zubereitung – oft fruktosereich"},
  {re:/zwiebel|knoblauch|lauch|onion|garlic/, f:1, why:"Fruktane – kleine Mengen oft ok"},

  /* --- Sorbit --- */
  {re:/sorbit|e ?420(?!\d)/, s:2, why:"Sorbit (E420)"},
  {re:/pflaume|zwetschge|kirsche|kirschen|aprikose|marille|pfirsich|nektarine|(^|[^a-z])apfel|aepfel|birne|trockenpflaume|dattel|(^|[^a-z])prunes?/, s:2, why:"Sorbitreiches Obst"},
  {re:/kaugummi|chewing gum|zuckerfrei|ohne zucker|sugar free/, s:1, o:1, why:"Zuckerfrei – oft mit Zuckeraustauschstoffen"},

  /* --- FODMAP (zusätzlich zu Laktose, Fruktose, Sorbit, die automatisch einfließen) --- */
  {re:/weizen|roggen|gerste|wheat|barley|(^|[^a-z])rye([^a-z]|$)|bulgur|couscous|griess|paniermehl|semmelbroesel/, o:2, why:"Fruktane aus Weizen, Roggen oder Gerste"},
  {re:/dinkel|spelt/, o:1, why:"Dinkel – weniger Fruktane als Weizen"},
  {re:/zwiebel|knoblauch|schalotte|onion|garlic|shallot/, o:2, why:"Fruktane aus Zwiebel/Knoblauch"},
  {re:/lauch|porree|leek/, o:1, why:"Lauch – Fruktane"},
  {re:/inulin|oligofru[ck]tose|fructooligo|chicoree|chicory|topinambur/, o:2, why:"Fruktane (Inulin, Oligofruktose)"},
  {re:/bohne|kichererbse|linse|erbse(?!n?protein)|sojabohne|(^|[^a-z])beans?([^a-z]|$)|chickpea|lentil/, o:2, why:"Hülsenfrüchte – Galakto-Oligosaccharide"},
  {re:/pilz|champignon|mushroom|blumenkohl|cauliflower|spargel|asparagus/, o:2, why:"Polyole (Mannit)"},
  {re:/avocado|suesskartoffel|sellerie|celery/, o:1, why:"Polyole in größeren Mengen"},
  {re:/cashew|pistazie|pistachio/, o:2, why:"Cashew/Pistazie – GOS und Fruktane"},
  {re:/wassermelone|mango|(^|[^a-z])apfel|aepfel|birne|kirsche|pflaume|nektarine|pfirsich|trockenobst|rosine|dattel|feige/, o:2, why:"Fruktose- oder polyolreiches Obst"},
  {re:/mannit|xylit|maltit|isomalt|lactit|e ?42[01](?!\d)|e ?96[5-7](?!\d)|e ?953(?!\d)/, o:2, why:"Polyole (Zuckeraustauschstoffe)"},

  /* --- Milcheiweiß (Kuhmilchallergie) --- */
  {re:/(^|[^a-z])(voll|mager|frisch|kuh|roh|teilentrahmte |fettarme |haltbare |laktosefreie )?milch|(^|[^a-z])milk|milchpulver|molke|whey|kondensmilch|buttermilch|sahne|(^|[^a-z])rahm|schmand|creme fraiche|(^|[^a-z])cream([^a-z]|$)|joghurt|jogurt|yogh?urt|kefir|quark|kaese|cheese|mozzarella|mascarpone|ricotta|parmesan|feta|(^|[^a-z])butter|butterreinfett|butterschmalz|ghee|kasein|casein|laktose|lactose|milchzucker|milcheiweiss|milchprotein|lactoglobulin|lactalbumin/, m:2, why:"Enthält Milch(-eiweiß)"},

  /* --- Ei --- */
  {re:/(^|[^a-z])ei(er|ern)?([^a-z]|$)|vollei|eigelb|eidotter|eiklar|eiweisspulver|huehnerei|eipulver|trockenei|flüssigei|fluessigei|eiernudel|mayonnaise|mayo\b|(^|[^a-z])eggs?([^a-z]|$)|egg yolk|egg white|albumin|lysozym|e ?1105(?!\d)/, e:2, why:"Enthält Ei"},

  /* --- Soja --- */
  {re:/soja|(^|[^a-z])soy|tofu|tempeh|miso|edamame|tamari|shoyu/, y:2, why:"Enthält Soja"},
  {re:/lecithin|e ?322(?!\d)/, y:1, why:"Lecithin – oft aus Soja, Herkunft prüfen"},

  /* --- Schalenfrüchte --- */
  {re:/mandel|haselnuss|haselnuesse|walnuss|walnuesse|cashew|pekan|paranuss|paranuesse|pistazie|macadamia|queenslandnuss|(^|[^a-z])(nuss|nuesse|nussmus|nusspaste)([^a-z]|$)|nougat|nugat|marzipan|krokant|praline|tree nuts?|hazelnut|almond|walnut|pecan|pistachio|brazil nut/, nu:2, why:"Enthält Schalenfrüchte (Nüsse)"},

  /* --- Erdnuss --- */
  {re:/erdnuss|erdnuesse|peanut|arachis/, p:2, why:"Enthält Erdnuss"},

  /* --- Sellerie --- */
  {re:/sellerie|celery|celeriac/, c:2, why:"Enthält Sellerie"},

  /* --- Senf --- */
  {re:/senf|mustard/, u:2, why:"Enthält Senf"},

  /* --- Sesam --- */
  {re:/sesam|tahin|tahini|sesame/, z:2, why:"Enthält Sesam"},

  /* --- Fisch --- */
  {re:/fisch|lachs|thunfisch|kabeljau|dorsch|seelachs|forelle|hering|makrele|sardine|sardelle|anchovi|scholle|zander|pangasius|tilapia|rotbarsch|(^|[^a-z])fish|salmon|(^|[^a-z])tuna|(^|[^a-z])cod([^a-z]|$)|anchov|fischsauce|fish sauce/, i:2, why:"Enthält Fisch"},

  /* --- Krebstiere --- */
  {re:/garnele|shrimp|prawn|krabbe|(^|[^a-z])krebs|flusskrebs|hummer|languste|langustine|scampi|crustacea|crab|lobster|krebstier/, kr:2, why:"Enthält Krebstiere"},

  /* --- Weichtiere --- */
  {re:/muschel|tintenfisch|kalmar|calamar|oktopus|krake|schnecke|auster|mollus|weichtier|squid|mussel|oyster|clam|scallop/, w:2, why:"Enthält Weichtiere"},
  {re:/meeresfrue|seafood/, kr:1, w:1, why:"Meeresfrüchte – Krebs- oder Weichtiere möglich"},

  /* --- Lupine --- */
  {re:/lupin/, v:2, why:"Enthält Lupine"},

  /* --- Sulfite --- */
  {re:/sulfit|sulphite|sulfite|schwefeldioxid|disulfit|geschwefelt|e ?22[0-8](?!\d)/, q:2, why:"Enthält Sulfite"},
  {re:/(^|[^a-z])(rot|weiss|dessert|koch)?wein(?!stein|saeure)|(^|[^a-z])wine|sekt|trockenobst|trockenfruecht|rosine/, q:1, why:"Enthält häufig Sulfite"},

  /* --- Tomate (in jeder Form, auch als Gewürz) --- */
  {re:/tomat|ketchup|catsup|passata|pizzasauce|pizzasosse|pizzawuerze|bolognese|arrabbiata|napoli|gazpacho|(^|[^a-z])sugo|chutney/, t:2, why:"Tomate (auch als Pulver, Mark, Soße oder Gewürz)"},
  {re:/(^|[^a-z])gewuerze?([^a-z]|$)|gewuerzmischung|gewuerzzubereitung|wuerzmischung|gemuesepulver|gemueseextrakt|gemuesebruehe|bruehe|bouillon|(^|[^a-z])salsa|grillsauce|barbecue|bbq|(^|[^a-z])curry([^a-z]|$)|(^|[^a-z])spices?([^a-z]|$)|seasoning/, t:1, why:"Gewürz-/Gemüsemischung – enthält häufig Tomate"},

  /* --- Histamin --- */
  {re:/hefeextrakt|hefe-extrakt|yeast extract|speisewuerze|(^|[^a-z])wuerze([^a-z]|$)/, h:2, why:"Hefeextrakt/Würze – histaminreich"},
  {re:/soja ?sauce|sojasosse|soja-sosse|shoyu|tamari|soy sauce/, h:2, why:"Sojasauce – fermentiert"},
  {re:/soja ?sauce|sojasosse|soja-sosse|shoyu|soy sauce/, g:2, why:"Sojasauce – meist mit Weizen gebraut (Tamari ist oft glutenfrei)"},
  {re:/tomat/, h:2, why:"Tomate – Histaminliberator"},
  {re:/spinat|spinach/, h:2, why:"Spinat – histaminreich"},
  {re:/aubergine|eggplant/, h:2, why:"Aubergine – histaminreich"},
  {re:/avocado/, h:2, why:"Avocado – histaminreich"},
  {re:/sauerkraut|kimchi|miso|tempeh|kombucha|fermentiert|fermented/, h:2, why:"Fermentiert – histaminreich"},
  {re:/parmesan|emmentaler|bergkaese|cheddar|gruyere|grana padano|pecorino|hartkaese|reifekaese|camembert|(^|[^a-z])brie([^a-z]|$)|gorgonzola|roquefort|blauschimmel/, h:2, why:"Gereifter Käse – histaminreich"},
  {re:/kaese|cheese/, h:1, why:"Käse – je nach Reifegrad"},
  {re:/(^|[^a-z])(rot|weiss|dessert|koch)?wein(?!stein|saeure)|(^|[^a-z])wine/, h:2, why:"Wein – histaminreich"},
  {re:/sekt|branntwein|likoer|spirituose|alkohol|alcohol|(^|[^a-z])rum([^a-z]|$)|ethanol/, h:2, why:"Alkohol – hemmt den Histaminabbau"},
  {re:/balsamico|weinessig|wine vinegar/, h:2, why:"Wein-/Balsamicoessig – histaminreich"},
  {re:/essig|vinegar/, h:1, why:"Essig"},
  {re:/salami|rohschinken|parmaschinken|serrano|chorizo|rohwurst|landjaeger|pepperoni/, h:2, why:"Gereifte Wurst – histaminreich"},
  {re:/thunfisch|makrele|sardine|sardelle|anchovi|hering|fischsauce|(^|[^a-z])thun([^a-z]|$)|(^|[^a-z])tuna|mackerel|anchov|fish sauce/, h:2, why:"Fisch – oft histaminreich"},
  {re:/garnele|shrimp|prawn|krabbe|meeresfrue|muschel|tintenfisch|krebs|seafood/, h:2, why:"Meeresfrüchte – histaminreich"},
  {re:/geraeuchert|raeucher|smoked/, h:1, why:"Geräuchert"},
  {re:/kakao|schoko|cacao|cocoa|chocolate/, h:2, why:"Kakao – Histaminliberator"},
  {re:/erdbeer|strawberr/, h:2, why:"Erdbeere – Histaminliberator"},
  {re:/himbeer|raspberr/, h:1, why:"Himbeere"},
  {re:/orange|zitrus|grapefruit|mandarin|limette|pomelo|citrus|(^|[^a-z])lime/, h:2, why:"Zitrusfrucht – Histaminliberator"},
  {re:/zitronensaft|zitrone(?!nsaeure)|zitronenschale|lemon/, h:1, why:"Zitrone"},
  {re:/ananas|pineapple/, h:2, f:1, why:"Ananas – Histaminliberator"},
  {re:/kiwi/, h:2, why:"Kiwi – Histaminliberator"},
  {re:/papaya/, h:1, why:"Papaya"},
  {re:/banane|banana/, h:1, why:"Banane"},
  {re:/erdnuss|walnuss|cashew|pekannuss|peanut|walnut|pecan/, h:2, why:"Nüsse – Histaminliberator"},
  {re:/haselnuss|mandel|hazelnut|almond/, h:1, why:"Nüsse"},
  {re:/glutamat|glutamate|e ?62[0-5](?!\d)|geschmacksverstaerker|flavou?r enhancer/, h:1, why:"Glutamat – kann Beschwerden verstärken"},
  {re:/benzoe|benzoat|benzoate|e ?21[0-3](?!\d)/, h:1, why:"Benzoat (Konservierungsstoff)"},
  {re:/sulfit|sulphite|sulfite|schwefeldioxid|disulfit|e ?22[0-8](?!\d)/, h:1, why:"Sulfit (Konservierungsstoff)"},
  {re:/tartrazin|azorubin|cochenillerot|gelborange|allurarot|e ?1(02|10|22|24|29)(?!\d)/, h:1, why:"Azofarbstoff"},
  {re:/eiklar|huehnereiweiss|eiweisspulver|egg white/, h:1, why:"Eiklar – Histaminliberator"},
  {re:/(^|[^a-z])ei(er|ern)?([^a-z]|$)|vollei|huehnerei(?!weiss)|(^|[^a-z])eggs?([^a-z]|$)/, h:1, why:"Ei – Eiklar ist ein Histaminliberator, durchgegart meist ok"},
  {re:/weizenkeim|wheat germ/, h:2, why:"Weizenkeime – histaminreich"},
  {re:/bohne|linse|kichererbse|(^|[^a-z])beans?([^a-z]|$)|lentil|chickpea/, h:1, f:1, why:"Hülsenfrüchte"},
  {re:/chili|curry|cayenne/, h:1, why:"Scharfe Gewürze"},
  {re:/pilz|champignon|mushroom/, h:1, why:"Pilze"},
  {re:/hackfleisch|rinderhack|schweinehack|(^|[^a-z])hack([^a-z]|$)|gehacktes|minced/, h:1, why:"Hackfleisch – verdirbt schnell, ganz frisch verarbeiten"},
];

/* ---------- Rezepte ----------
   m: Mahlzeiten (fruehstueck, mittag, abend, snack); z: Zutaten – "~" am Anfang = kleine Menge */
const RECIPES = [
  {t:"Overnight Oats mit Heidelbeeren", m:["fruehstueck"], min:5, z:["50 g Haferflocken (glutenfrei)","150 ml laktosefreie Milch","100 g Heidelbeeren","1 EL Chiasamen","~1 TL Ahornsirup"],
   s:["Haferflocken, Milch und Chiasamen in einem Glas verrühren.","Über Nacht in den Kühlschrank stellen.","Morgens mit Heidelbeeren und Ahornsirup toppen."]},
  {t:"Rührei mit Schnittlauch auf Reiswaffeln", m:["fruehstueck"], min:10, z:["2 Eier","1 TL Butter","~Schnittlauch","3 Reiswaffeln","~Salz, Pfeffer"],
   s:["Eier verquirlen und salzen.","In Butter bei mittlerer Hitze stocken lassen – gut durchgaren.","Auf Reiswaffeln geben, mit Schnittlauch bestreuen."]},
  {t:"Hirsebrei mit Apfel und Zimt", m:["fruehstueck"], min:15, z:["60 g Hirseflocken","200 ml Milch","1 Apfel","~1 TL Zimt"],
   s:["Milch erhitzen, Hirseflocken einrühren und 5 Minuten quellen lassen.","Apfel reiben und unterheben.","Mit Zimt bestreuen."]},
  {t:"Joghurt-Bowl mit Himbeeren und Kürbiskernen", m:["fruehstueck","snack"], min:5, z:["200 g Naturjoghurt","100 g Himbeeren","2 EL Kürbiskerne","~1 TL Ahornsirup"],
   s:["Joghurt in eine Schale geben.","Himbeeren und Kürbiskerne darauf verteilen, mit Ahornsirup beträufeln."]},
  {t:"Buchweizen-Pfannkuchen mit Heidelbeeren", m:["fruehstueck"], min:20, z:["100 g Buchweizenmehl","1 Ei","150 ml Mineralwasser","100 g Heidelbeeren","1 EL Rapsöl","~1 Prise Salz"],
   s:["Mehl, Ei, Wasser und Salz zu einem glatten Teig verrühren, 10 Minuten quellen lassen.","In Rapsöl kleine Pfannkuchen ausbacken.","Mit Heidelbeeren servieren."]},
  {t:"Dinkelbrot mit Frischkäse und Gurke", m:["fruehstueck","abend"], min:5, z:["2 Scheiben Dinkelvollkornbrot","2 EL Frischkäse","½ Gurke","~Kresse"],
   s:["Brot mit Frischkäse bestreichen.","Mit Gurkenscheiben und Kresse belegen."]},
  {t:"Ofenkartoffeln mit Kräuterquark", m:["mittag","abend"], min:45, z:["800 g Kartoffeln","250 g Magerquark","1 Bund frische Kräuter","2 EL Olivenöl","~Salz","~etwas Wasser"],
   s:["Kartoffeln halbieren, mit Öl und Salz auf ein Blech geben, 35 Minuten bei 200 °C backen.","Quark mit gehackten Kräutern und etwas Wasser glatt rühren.","Zusammen servieren."]},
  {t:"Hähnchen-Reis-Pfanne mit Zucchini und Karotte", m:["mittag","abend"], min:25, z:["150 g Reis","300 g Hähnchenbrust (frisch)","1 Zucchini","2 Karotten","1 EL Rapsöl","~Petersilie","~Salz"],
   s:["Reis nach Packung garen.","Hähnchen in Streifen schneiden und im Öl rundum anbraten.","Gemüse in Würfeln dazugeben, 6–8 Minuten mitbraten.","Reis unterheben, mit Salz und Petersilie abschmecken."]},
  {t:"Spaghetti mit Tomatensoße und Parmesan", m:["mittag","abend"], min:25, z:["250 g Spaghetti (Weizen)","400 g Tomaten (Dose)","1 Zwiebel","1 Knoblauchzehe","30 g Parmesan","~Basilikum","1 EL Olivenöl"],
   s:["Zwiebel und Knoblauch in Öl andünsten, Tomaten dazugeben und 15 Minuten köcheln.","Spaghetti bissfest garen.","Mit Soße, Parmesan und Basilikum servieren."]},
  {t:"Kürbissuppe mit Ingwer und Kokos", m:["mittag","abend"], min:30, z:["800 g Hokkaido-Kürbis","1 Karotte","~1 Stück Ingwer","700 ml Wasser","100 ml Kokosmilch","~Salz","~Kurkuma"],
   s:["Kürbis (mit Schale) und Karotte würfeln, mit Ingwer in Wasser 20 Minuten weich kochen.","Kokosmilch zugeben und fein pürieren.","Mit Salz und Kurkuma abschmecken."]},
  {t:"Quinoa-Salat mit Gurke, Paprika und Feta", m:["mittag"], min:20, z:["150 g Quinoa","1 Gurke","1 Paprika","100 g Feta","~Petersilie","2 EL Olivenöl","~1 TL Zitronensaft"],
   s:["Quinoa gründlich waschen und garen, abkühlen lassen.","Gurke und Paprika würfeln.","Alles mit Öl, Zitronensaft und Petersilie mischen, Feta darüberbröseln."]},
  {t:"Rotes Linsen-Dal mit Reis", m:["mittag","abend"], min:30, z:["150 g rote Linsen","1 Zwiebel","1 Knoblauchzehe","400 ml Kokosmilch","200 ml Wasser","~1 TL Curry","150 g Reis"],
   s:["Zwiebel und Knoblauch andünsten, Curry kurz mitrösten.","Linsen, Kokosmilch und 200 ml Wasser dazu, 15 Minuten köcheln.","Mit Reis servieren."]},
  {t:"Lachs mit Kartoffeln und Brokkoli", m:["mittag","abend"], min:30, z:["2 Lachsfilets (frisch)","600 g Kartoffeln","1 Brokkoli","1 EL Butter","~Dill","~Salz"],
   s:["Kartoffeln kochen.","Brokkoli in Röschen 5 Minuten dämpfen.","Lachs in Butter von jeder Seite 3–4 Minuten braten, mit Dill bestreuen."]},
  {t:"Gefüllte Paprika mit Hackfleisch und Reis", m:["abend"], min:50, z:["4 Paprika","250 g Rinderhackfleisch (frisch)","100 g Reis","1 Zwiebel","400 g passierte Tomaten","50 g Mozzarella"],
   s:["Reis vorgaren. Hack mit Zwiebel anbraten und mit dem Reis mischen.","Paprika aushöhlen und füllen, in eine Form mit den Tomaten setzen.","Mit Mozzarella belegen und 30 Minuten bei 180 °C backen."]},
  {t:"Ofengemüse mit Hähnchen und Joghurt-Dip", m:["abend"], min:40, z:["2 Süßkartoffeln","1 Zucchini","2 Karotten","4 Hähnchenschenkel (frisch)","2 EL Olivenöl","~Rosmarin","150 g laktosefreier Joghurt","~1 Prise Salz"],
   s:["Gemüse in Stücke schneiden, mit Öl und Rosmarin auf ein Blech geben.","Hähnchenschenkel dazulegen und alles 35 Minuten bei 200 °C backen.","Joghurt mit einer Prise Salz als Dip dazu reichen."]},
  {t:"Reisnudeln mit Garnelen und Gemüse", m:["abend"], min:20, z:["200 g Reisnudeln","200 g Garnelen","1 Zucchini","1 Karotte","2 EL Tamari (glutenfrei)","1 EL Rapsöl"],
   s:["Reisnudeln einweichen bzw. garen.","Gemüse in Streifen schneiden und mit den Garnelen im Öl anbraten.","Nudeln und Tamari unterschwenken."]},
  {t:"Kartoffel-Möhren-Stampf mit Spiegelei", m:["mittag","abend"], min:30, z:["600 g Kartoffeln","300 g Möhren","100 ml Milch","1 EL Butter","2 Eier","~Muskat","~Salz"],
   s:["Kartoffeln und Möhren weich kochen.","Mit warmer Milch, Butter, Salz und Muskat stampfen.","Spiegeleier braten und darauf servieren."]},
  {t:"Wraps mit Pute, Salat und Avocado", m:["mittag"], min:15, z:["4 Weizen-Tortillas","200 g Putenbrust (frisch)","1 Avocado","~Salat","½ Gurke","2 EL Frischkäse"],
   s:["Putenbrust in Streifen braten.","Tortillas mit Frischkäse bestreichen, mit Salat, Gurke, Avocado und Pute belegen.","Fest einrollen und halbieren."]},
  {t:"Spargelrisotto", m:["mittag","abend"], min:35, z:["200 g Risottoreis","500 g grüner Spargel","1 Zwiebel","~50 ml Weißwein","800 ml Wasser","30 g Parmesan","1 EL Butter"],
   s:["Zwiebel andünsten, Reis glasig werden lassen, mit Wein ablöschen.","Nach und nach heißes Wasser angießen und rühren.","Spargelstücke nach 10 Minuten zugeben, zum Schluss Butter und Parmesan unterrühren."]},
  {t:"Hirse-Gemüse-Pfanne mit Kräutern", m:["mittag","abend"], min:25, z:["150 g Hirse","300 ml Wasser","1 Zucchini","1 Paprika","2 Karotten","1 EL Olivenöl","~frische Kräuter","~Salz"],
   s:["Hirse heiß abspülen und in der doppelten Menge Wasser 15 Minuten garen.","Gemüse würfeln und im Öl anbraten.","Hirse unterheben, mit Kräutern und Salz abschmecken."]},
  {t:"Reiswaffeln mit Erdnussmus und Banane", m:["snack","fruehstueck"], min:3, z:["2 Reiswaffeln","1 EL Erdnussmus","1 Banane"],
   s:["Reiswaffeln mit Erdnussmus bestreichen.","Mit Bananenscheiben belegen."]},
  {t:"Gemüsesticks mit Hummus", m:["snack"], min:10, z:["200 g Kichererbsen (gegart)","1 EL Tahin","~1 Knoblauchzehe","~1 TL Zitronensaft","~etwas Wasser","2 Karotten","1 Gurke"],
   s:["Kichererbsen mit Tahin, Knoblauch, Zitronensaft und etwas Wasser fein pürieren.","Karotten und Gurke in Sticks schneiden und dazu dippen."]},
  {t:"Heidelbeer-Quark", m:["snack","fruehstueck"], min:5, z:["250 g Magerquark","~etwas Wasser","100 g Heidelbeeren","~1 TL Ahornsirup"],
   s:["Quark mit etwas Wasser cremig rühren.","Heidelbeeren und Ahornsirup unterheben."]},
  {t:"Bananen-Hafer-Kekse", m:["snack"], min:25, z:["2 reife Bananen","100 g Haferflocken (glutenfrei)","~30 g Zartbitter-Schokotropfen"],
   s:["Bananen zerdrücken und mit Haferflocken mischen, Schokotropfen unterheben.","Kleine Häufchen auf ein Blech setzen.","15 Minuten bei 180 °C backen."]},
  {t:"Apfelschnitze mit Mandelmus", m:["snack"], min:3, z:["1 Apfel","1 EL Mandelmus"],
   s:["Apfel in Schnitze schneiden und mit Mandelmus dippen."]},
  {t:"Reis-Porridge mit Kokos und Papaya", m:["fruehstueck"], min:20, z:["80 g Milchreis","300 ml Kokosmilch (Drink)","½ Papaya","~1 TL Ahornsirup"],
   s:["Reis mit dem Kokosmilch-Drink aufkochen und 15 Minuten unter Rühren sanft köcheln.","Mit Papayawürfeln und Ahornsirup servieren."]},
];

/* ---------- Weitere Rezepte ---------- */
RECIPES.push(
  /* Frühstück */
  {t:"Hirse-Porridge mit Birne und Zimt", m:["fruehstueck"], min:15, z:["60 g Hirseflocken","250 ml Hafermilch (glutenfrei)","1 Birne","~1 TL Zimt"], s:["Hirseflocken in der Hafermilch aufkochen und 5 Minuten quellen lassen.","Birne würfeln und unterheben, mit Zimt bestreuen."]},
  {t:"Quinoa-Frühstücksbowl mit Beeren", m:["fruehstueck"], min:20, z:["80 g Quinoa","200 ml Reismilch","100 g Heidelbeeren","50 g Himbeeren","1 EL Kürbiskerne","~1 TL Ahornsirup"], s:["Quinoa waschen und in Reismilch 15 Minuten köcheln.","Mit Beeren, Kürbiskernen und Ahornsirup servieren."]},
  {t:"Buchweizen-Granola", m:["fruehstueck","snack"], min:30, z:["150 g Buchweizen","50 g Kürbiskerne","50 g Sonnenblumenkerne","2 EL Kokosöl","2 EL Ahornsirup","~1 TL Zimt"], s:["Alles vermengen und auf einem Blech verteilen.","Bei 160 °C 20–25 Minuten goldbraun rösten, abkühlen lassen."]},
  {t:"Reiswaffeln mit Frischkäse und Gurke", m:["fruehstueck","snack"], min:5, z:["3 Reiswaffeln","3 EL Frischkäse","½ Gurke","~Schnittlauch"], s:["Reiswaffeln mit Frischkäse bestreichen.","Mit Gurkenscheiben und Schnittlauch belegen."]},
  {t:"Süßkartoffel-Rösti mit Spiegelei", m:["fruehstueck","abend"], min:25, z:["1 Süßkartoffel","1 EL Maisstärke","2 Eier","1 EL Rapsöl","~Salz"], s:["Süßkartoffel grob reiben, mit Maisstärke und Salz mischen.","Kleine Rösti in Öl knusprig braten.","Spiegeleier braten und auf den Rösti servieren."]},
  {t:"Chia-Pudding mit Kokos und Mango", m:["fruehstueck","snack"], min:5, z:["3 EL Chiasamen","200 ml Kokosmilch (Drink)","½ Mango"], s:["Chiasamen mit dem Kokosmilch-Drink verrühren und über Nacht quellen lassen.","Mit Mangowürfeln servieren."]},
  {t:"Dinkel-Vollkornbrötchen mit Ei und Kresse", m:["fruehstueck"], min:10, z:["2 Dinkelvollkornbrötchen","2 Eier","1 TL Butter","~Kresse","~Salz"], s:["Eier 8 Minuten hart kochen und in Scheiben schneiden.","Brötchen mit Butter bestreichen, mit Ei und Kresse belegen."]},
  {t:"Reisflocken-Bananen-Pancakes", m:["fruehstueck"], min:20, z:["1 reife Banane","80 g Reisflocken","100 ml Reismilch","1 EL Rapsöl","100 g Heidelbeeren"], s:["Banane zerdrücken, mit Reisflocken und Reismilch zu einem Teig verrühren.","Kleine Pancakes in Öl ausbacken.","Mit Heidelbeeren servieren."]},
  {t:"Kartoffel-Frittata mit Zucchini", m:["fruehstueck","abend"], min:25, z:["300 g gekochte Kartoffeln","1 Zucchini","4 Eier","1 EL Olivenöl","~frische Kräuter","~Salz"], s:["Kartoffeln und Zucchini in Scheiben in Öl anbraten.","Verquirlte Eier mit Kräutern darübergießen und bei kleiner Hitze stocken lassen."]},
  {t:"Hafer-Apfel-Muffins", m:["fruehstueck","snack"], min:35, z:["150 g Haferflocken","2 Äpfel","2 Eier","100 ml Milch","2 EL Honig","~1 TL Backpulver"], s:["Äpfel reiben und mit allen Zutaten verrühren.","In Muffinförmchen füllen und 20–25 Minuten bei 180 °C backen."]},
  {t:"Sojajoghurt mit Kiwi und Leinsamen", m:["fruehstueck","snack"], min:5, z:["200 g Sojajoghurt","1 Kiwi","1 EL geschroteter Leinsamen"], s:["Kiwi schälen und würfeln.","Mit Joghurt und Leinsamen anrichten."]},
  {t:"Maisgrieß-Brei mit Pflaumen", m:["fruehstueck"], min:15, z:["50 g Maisgrieß","250 ml Milch","3 Pflaumen","~1 TL Zimt"], s:["Maisgrieß in Milch einrühren und 5 Minuten köcheln.","Pflaumen würfeln, kurz mitziehen lassen, mit Zimt servieren."]},
  /* Mittag/Abend */
  {t:"Hähnchen-Gemüse-Curry mit Reis", m:["mittag","abend"], min:30, z:["300 g Hähnchenbrust (frisch)","1 Zucchini","1 Paprika","2 Karotten","400 ml Kokosmilch","~1 TL Kurkuma","~1 Stück Ingwer","150 g Reis"], s:["Reis garen.","Hähnchen anbraten, Gemüse, Ingwer und Kurkuma zugeben.","Mit Kokosmilch 10 Minuten köcheln lassen."]},
  {t:"Ofenlachs mit Fenchel und Kartoffeln", m:["mittag","abend"], min:40, z:["2 Lachsfilets (frisch)","1 Fenchel","600 g Kartoffeln","2 EL Olivenöl","~Dill","~Salz"], s:["Kartoffeln und Fenchel in Spalten schneiden, mit Öl 20 Minuten bei 200 °C backen.","Lachs dazulegen und weitere 12 Minuten garen, mit Dill bestreuen."]},
  {t:"Putengeschnetzeltes mit Reisnudeln", m:["mittag","abend"], min:25, z:["300 g Putenbrust (frisch)","200 g Reisnudeln","1 Paprika","1 Zucchini","2 EL Rapsöl","~frische Petersilie"], s:["Reisnudeln garen.","Pute in Streifen anbraten, Gemüse zugeben und 6 Minuten mitbraten.","Nudeln unterheben, mit Petersilie servieren."]},
  {t:"Kartoffel-Lauch-Suppe", m:["mittag","abend"], min:30, z:["600 g Kartoffeln","1 Stange Lauch","1 l Wasser","100 ml Sahne","~Muskat","~Salz"], s:["Kartoffeln und Lauch schneiden, im Wasser 20 Minuten kochen.","Sahne zugeben, pürieren und abschmecken."]},
  {t:"Möhren-Ingwer-Suppe", m:["mittag","abend"], min:30, z:["600 g Möhren","1 Kartoffel","~1 Stück Ingwer","800 ml Wasser","100 ml Kokosmilch","~Salz"], s:["Gemüse und Ingwer würfeln und 20 Minuten im Wasser kochen.","Kokosmilch zugeben und fein pürieren."]},
  {t:"Hirse-Bratlinge mit Joghurtdip", m:["mittag","abend"], min:35, z:["150 g Hirse","1 Karotte","1 Ei","2 EL Maisstärke","1 EL Rapsöl","150 g laktosefreier Joghurt","~frische Kräuter"], s:["Hirse garen und abkühlen lassen, mit geriebener Karotte, Ei und Stärke mischen.","Kleine Bratlinge formen und in Öl braten.","Joghurt mit Kräutern verrühren und dazu reichen."]},
  {t:"Rindergeschnetzeltes mit Kartoffelstampf", m:["abend"], min:35, z:["300 g Rinderhüfte (frisch)","800 g Kartoffeln","100 ml Milch","1 EL Butter","200 g Champignons","1 EL Rapsöl","~Salz"], s:["Kartoffeln kochen und mit Milch und Butter stampfen.","Rind in Streifen scharf im Öl anbraten, Champignons in Scheiben mitbraten, salzen."]},
  {t:"Gemüse-Reis-Pfanne mit Ei", m:["mittag","abend"], min:20, z:["200 g gekochter Reis","1 Paprika","1 Zucchini","2 Eier","1 EL Rapsöl","~Schnittlauch","~Salz"], s:["Gemüse würfeln und in Öl anbraten.","Reis zugeben, Eier darüber verquirlen und stocken lassen."]},
  {t:"Ofenhähnchen mit Rosmarinkartoffeln", m:["abend"], min:50, z:["4 Hähnchenschenkel (frisch)","800 g Kartoffeln","3 EL Olivenöl","~Rosmarin","~Salz"], s:["Kartoffeln vierteln, mit Öl, Rosmarin und Salz mischen.","Mit den Hähnchenschenkeln 45 Minuten bei 200 °C backen."]},
  {t:"Zucchini-Nudeln mit Hähnchen und Pesto", m:["abend"], min:20, z:["3 Zucchini","250 g Hähnchenbrust (frisch)","1 Bund Basilikum","3 EL Olivenöl","2 EL Pinienkerne","~Salz"], s:["Basilikum, Öl und Pinienkerne zu Pesto mixen.","Hähnchen anbraten, Zucchini spiralisieren und kurz mitbraten.","Mit Pesto mischen."]},
  {t:"Polenta mit Ofengemüse", m:["mittag","abend"], min:35, z:["150 g Polenta","600 ml Wasser","1 Paprika","1 Zucchini","1 Kürbis (klein)","2 EL Olivenöl","~Rosmarin"], s:["Gemüse würfeln und mit Öl 25 Minuten bei 200 °C backen.","Polenta in kochendes Wasser rühren und 10 Minuten quellen lassen."]},
  {t:"Fischfilet in Kräuterkruste mit Reis", m:["mittag","abend"], min:30, z:["2 Kabeljaufilets (frisch)","3 EL Paniermehl","1 EL Butter","~frische Kräuter","150 g Reis","1 Brokkoli"], s:["Reis garen, Brokkoli dämpfen.","Paniermehl mit Kräutern und Butter mischen, auf die Filets drücken.","15 Minuten bei 200 °C backen."]},
  {t:"Spaghetti Bolognese", m:["mittag","abend"], min:40, z:["250 g Spaghetti (Weizen)","300 g Rinderhackfleisch (frisch)","1 Zwiebel","1 Karotte","400 g passierte Tomaten","30 g Parmesan","1 EL Olivenöl"], s:["Zwiebel, Karotte und Hack anbraten.","Tomaten zugeben und 25 Minuten köcheln.","Mit Spaghetti und Parmesan servieren."]},
  {t:"Gnocchi mit Salbeibutter", m:["mittag","abend"], min:15, z:["500 g Gnocchi (Weizen)","2 EL Butter","~Salbei","20 g Parmesan"], s:["Gnocchi nach Packung garen.","In Butter mit Salbei schwenken, mit Parmesan servieren."]},
  {t:"Kürbis-Risotto", m:["mittag","abend"], min:35, z:["200 g Risottoreis","400 g Hokkaido-Kürbis","1 Schalotte","800 ml Wasser","1 EL Butter","30 g Parmesan"], s:["Schalotte und Reis anschwitzen, Kürbiswürfel zugeben.","Nach und nach Wasser angießen und 20 Minuten rühren.","Butter und Parmesan unterrühren."]},
  {t:"Tofu-Gemüse-Pfanne mit Reis", m:["mittag","abend"], min:25, z:["200 g Tofu","1 Paprika","1 Zucchini","1 Karotte","2 EL Sojasauce","1 EL Sesamöl","150 g Reis"], s:["Reis garen, Tofu würfeln und knusprig braten.","Gemüse zugeben und anbraten, mit Sojasauce ablöschen."]},
  {t:"Hähnchen-Wrap mit Salat (glutenfrei)", m:["mittag"], min:15, z:["4 glutenfreie Tortillas","200 g Hähnchenbrust (frisch)","~Salat","1 Gurke","2 EL laktosefreier Joghurt"], s:["Hähnchen in Streifen braten.","Tortillas mit Joghurt bestreichen, belegen und einrollen."]},
  {t:"Linsensalat mit Feta", m:["mittag"], min:25, z:["150 g Linsen (Dose)","1 Paprika","1 Gurke","80 g Feta","2 EL Olivenöl","1 EL Weißweinessig","~Petersilie"], s:["Linsen abspülen, Gemüse würfeln.","Mit Öl, Essig und Petersilie mischen, Feta darüberbröseln."]},
  {t:"Kartoffelsalat mit Gurke (ohne Mayo)", m:["mittag","abend"], min:30, z:["800 g Kartoffeln","1 Gurke","3 EL Rapsöl","2 EL Branntweinessig","~Schnittlauch","~Salz"], s:["Kartoffeln kochen, pellen und in Scheiben schneiden.","Mit Gurke, Öl, Essig, Salz und Schnittlauch marinieren."]},
  {t:"Gefüllte Zucchini mit Reis und Hackfleisch", m:["abend"], min:45, z:["3 Zucchini","200 g Rinderhackfleisch (frisch)","100 g Reis","1 Paprika","50 g Mozzarella"], s:["Reis vorgaren, Zucchini halbieren und aushöhlen.","Hack anbraten, mit Reis, Paprika und Zucchinifleisch mischen.","Einfüllen, mit Mozzarella belegen, 25 Minuten bei 180 °C backen."]},
  {t:"Lachs-Reis-Bowl mit Gurke und Avocado", m:["mittag","abend"], min:25, z:["150 g Reis","2 Lachsfilets (frisch)","1 Gurke","1 Avocado","1 Karotte","2 EL Sojasauce","1 TL Sesam"], s:["Reis garen, Lachs braten.","Gemüse schneiden und alles in Schalen anrichten, mit Sojasauce und Sesam toppen."]},
  {t:"Hähnchen-Reis-Suppe", m:["mittag","abend"], min:35, z:["300 g Hähnchenbrust (frisch)","2 Karotten","1 Stück Sellerie","100 g Reis","1,2 l Wasser","~Petersilie","~Salz"], s:["Hähnchen und Gemüse in Wasser 20 Minuten köcheln, Fleisch herausnehmen und zerpflücken.","Reis zugeben und 15 Minuten garen, Fleisch zurückgeben, mit Petersilie abschmecken."]},
  {t:"Ofen-Süßkartoffeln mit Kräuterquark", m:["mittag","abend"], min:40, z:["2 Süßkartoffeln","250 g Magerquark","~frische Kräuter","1 EL Olivenöl","~Salz"], s:["Süßkartoffeln halbieren, mit Öl 30 Minuten bei 200 °C backen.","Quark mit Kräutern verrühren und dazu servieren."]},
  {t:"Pilzpfanne mit Semmelknödeln", m:["abend"], min:30, z:["4 Semmelknödel (Fertig)","400 g Champignons","1 Zwiebel","100 ml Sahne","1 EL Butter","~Petersilie"], s:["Knödel nach Packung garen.","Zwiebel und Champignons in Butter braten, Sahne angießen und einköcheln, mit Petersilie servieren."]},
  {t:"Hirse-Gemüse-Auflauf", m:["abend"], min:45, z:["150 g Hirse","1 Brokkoli","2 Karotten","2 Eier","200 ml Milch","80 g Gouda (jung)"], s:["Hirse garen, Gemüse in Röschen bzw. Scheiben vorgaren.","In eine Form schichten, Eier mit Milch verquirlt darübergießen, mit geriebenem Gouda bestreuen.","30 Minuten bei 180 °C backen."]},
  {t:"Rote-Bete-Kartoffel-Salat mit Ziegenkäse", m:["mittag"], min:30, z:["400 g Kartoffeln","2 Rote Bete (gekocht)","80 g Ziegenfrischkäse","2 EL Rapsöl","1 EL Branntweinessig","~Feldsalat"], s:["Kartoffeln kochen und würfeln, Rote Bete würfeln.","Mit Öl und Essig marinieren, auf Feldsalat anrichten und Käse darüber zupfen."]},
  {t:"Garnelen-Reisnudel-Salat", m:["mittag"], min:20, z:["150 g Reisnudeln","200 g Garnelen","1 Gurke","1 Karotte","~Koriander","2 EL Limettensaft","1 EL Rapsöl"], s:["Reisnudeln einweichen, Garnelen braten.","Gemüse in Streifen schneiden, alles mit Limette und Öl mischen."]},
  {t:"Thai-Kokossuppe mit Hähnchen", m:["mittag","abend"], min:25, z:["250 g Hähnchenbrust (frisch)","400 ml Kokosmilch","400 ml Wasser","~1 Stück Ingwer","1 Zucchini","2 EL Fischsauce","~Koriander"], s:["Kokosmilch mit Wasser und Ingwer aufkochen.","Hähnchen und Zucchini darin 10 Minuten garen, mit Fischsauce und Koriander abschmecken."]},
  {t:"Schweinefilet mit Möhrengemüse und Reis", m:["abend"], min:35, z:["300 g Schweinefilet (frisch)","500 g Möhren","1 EL Butter","150 g Reis","~Petersilie","~Salz"], s:["Reis garen, Möhren in Scheiben in Butter dünsten.","Filet in Medaillons rundum braten und 5 Minuten ruhen lassen."]},
  {t:"Buchweizen-Galettes mit Ei und Spinat", m:["mittag","abend"], min:30, z:["120 g Buchweizenmehl","250 ml Wasser","3 Eier","200 g Spinat","30 g Bergkäse","1 EL Butter","~1 Prise Salz"], s:["Mehl, Wasser, 1 Ei und Salz verrühren, 15 Minuten quellen lassen.","Dünne Galettes in Butter backen, mit Spinat, Käse und je einem Ei füllen und fertig garen."]},
  {t:"Ofen-Ratatouille mit Reis", m:["mittag","abend"], min:50, z:["1 Aubergine","2 Zucchini","2 Paprika","400 g Tomaten (Dose)","1 Knoblauchzehe","3 EL Olivenöl","150 g Reis"], s:["Gemüse würfeln, mit Tomaten, Knoblauch und Öl mischen.","40 Minuten bei 200 °C backen, mit Reis servieren."]},
  {t:"Hähnchen-Satay mit Erdnusssauce", m:["abend"], min:30, z:["300 g Hähnchenbrust (frisch)","3 EL Erdnussmus","100 ml Kokosmilch","1 EL Sojasauce","150 g Reis","1 Gurke"], s:["Hähnchen in Streifen auf Spieße stecken und braten.","Erdnussmus mit Kokosmilch und Sojasauce erwärmen.","Mit Reis und Gurke servieren."]},
  {t:"Gemüse-Frittata aus dem Ofen", m:["abend"], min:35, z:["6 Eier","1 Paprika","1 Zucchini","100 ml Milch","~frische Kräuter","~Salz"], s:["Gemüse würfeln und in eine Form geben.","Eier mit Milch, Kräutern und Salz verquirlen, darübergießen.","25 Minuten bei 180 °C backen."]},
  {t:"Kartoffelgulasch (mild)", m:["mittag","abend"], min:40, z:["800 g Kartoffeln","1 Paprika","2 Karotten","1 l Wasser","~1 TL Paprikapulver edelsüß","~Majoran","~Salz"], s:["Gemüse würfeln und kurz anbraten.","Mit Wasser und Gewürzen 25 Minuten köcheln lassen."]},
  {t:"Lachsfrikadellen mit Gurkensalat", m:["abend"], min:30, z:["300 g Lachsfilet (frisch)","1 Ei","2 EL Maisstärke","~Dill","1 Gurke","2 EL laktosefreier Joghurt"], s:["Lachs fein hacken, mit Ei, Stärke und Dill mischen und kleine Frikadellen braten.","Gurke hobeln und mit Joghurt und Dill anmachen."]},
  {t:"Asia-Hähnchen mit Pak Choi", m:["abend"], min:25, z:["300 g Hähnchenbrust (frisch)","2 Pak Choi","1 Karotte","~1 Stück Ingwer","2 EL Tamari (glutenfrei)","150 g Reis","1 EL Rapsöl"], s:["Reis garen, Hähnchen in Streifen anbraten.","Gemüse und Ingwer zugeben, mit Tamari ablöschen."]},
  {t:"Quinoa-Pfanne mit Halloumi", m:["mittag","abend"], min:25, z:["150 g Quinoa","200 g Halloumi","1 Zucchini","1 Paprika","1 EL Olivenöl","~Minze"], s:["Quinoa garen.","Halloumi in Scheiben braten, Gemüse anbraten und alles mischen."]},
  /* Snacks */
  {t:"Ofen-Kichererbsen", m:["snack"], min:35, z:["400 g Kichererbsen (Dose)","1 EL Olivenöl","~1 TL Paprikapulver","~Salz"], s:["Kichererbsen abspülen, gut trocknen und mit Öl und Gewürzen mischen.","30 Minuten bei 200 °C knusprig backen."]},
  {t:"Gurken-Sticks mit Kräuterquark", m:["snack"], min:10, z:["1 Gurke","150 g Magerquark","~frische Kräuter","~Salz"], s:["Gurke in Sticks schneiden.","Quark mit Kräutern und Salz verrühren und dazu dippen."]},
  {t:"Reiswaffeln mit Mandelmus und Heidelbeeren", m:["snack"], min:3, z:["2 Reiswaffeln","1 EL Mandelmus","50 g Heidelbeeren"], s:["Reiswaffeln mit Mandelmus bestreichen und mit Heidelbeeren belegen."]},
  {t:"Kürbiskern-Energiebällchen", m:["snack"], min:15, z:["100 g Kürbiskerne","60 g Haferflocken (glutenfrei)","2 EL Ahornsirup","1 EL Kokosöl"], s:["Alles im Mixer zerkleinern.","Zu kleinen Kugeln formen und kühl stellen."]},
  {t:"Popcorn selbst gemacht", m:["snack"], min:10, z:["50 g Popcornmais","1 EL Rapsöl","~Salz"], s:["Öl im Topf erhitzen, Mais zugeben und mit Deckel poppen lassen.","Leicht salzen."]},
  {t:"Joghurt-Dip mit Gemüsesticks", m:["snack"], min:10, z:["150 g Naturjoghurt","2 Karotten","1 Paprika","~Schnittlauch","~Salz"], s:["Gemüse in Sticks schneiden.","Joghurt mit Schnittlauch und Salz verrühren."]},
  {t:"Bananen-Kakao-Shake", m:["snack"], min:5, z:["1 Banane","250 ml Milch","1 TL Kakao"], s:["Alles im Mixer cremig pürieren."]},
  {t:"Hummus mit Reiscrackern", m:["snack"], min:10, z:["200 g Kichererbsen (Dose)","1 EL Tahin","~1 Knoblauchzehe","~Zitronensaft","~etwas Wasser","Reiscracker"], s:["Kichererbsen mit Tahin, Knoblauch, Zitronensaft und etwas Wasser pürieren.","Mit Reiscrackern servieren."]},
  {t:"Melonen-Minz-Salat", m:["snack"], min:5, z:["¼ Honigmelone","~Minze","~1 TL Limettensaft"], s:["Melone würfeln, mit Minze und Limettensaft mischen."]},
  {t:"Möhren-Muffins (glutenfrei)", m:["snack","fruehstueck"], min:35, z:["150 g Reismehl","2 Möhren","2 Eier","80 ml Rapsöl","60 g Zucker","~1 TL Backpulver"], s:["Möhren fein reiben, mit allen Zutaten verrühren.","In Förmchen füllen und 22 Minuten bei 180 °C backen."]}
);

/* ---------- Austauschvorschläge: Zutat → besser verträgliche Alternative je Kategorie ---------- */
/* Zutaten, ohne die ein Gericht nicht mehr es selbst ist – dann wird es nicht „angepasst“ */
const RECIPE_CORE = {
  "Spaghetti Bolognese": ["tomat", "hack"],
  "Ofen-Ratatouille mit Reis": ["tomat", "aubergine"],
  "Gefüllte Paprika mit Hackfleisch und Reis": ["hack"],
  "Gefüllte Zucchini mit Reis und Hackfleisch": ["hack"],
  "Hähnchen-Satay mit Erdnusssauce": ["erdnuss"],
  "Zucchini-Nudeln mit Hähnchen und Pesto": ["basilikum", "pinienkern"],
  "Gemüsesticks mit Hummus": ["kichererbse", "tahin"],
  "Hummus mit Reiscrackern": ["kichererbse", "tahin"],
  "Rotes Linsen-Dal mit Reis": ["linse"],
  "Thai-Kokossuppe mit Hähnchen": ["kokos"]
};
const SUBS = [
  {re:/buttermilch/, for:{l:"laktosefreie Buttermilch", m:"Haferdrink mit Zitronensaft", o:"laktosefreie Buttermilch"}},
  {re:/(^|[^a-z])(voll|frisch|fettarme |kuh)?milch([^a-z]|$)/, for:{l:"laktosefreie Milch", m:"Haferdrink oder Reisdrink", o:"laktosefreie Milch"}},
  {re:/sahne|(^|[^a-z])rahm/, for:{l:"laktosefreie Sahne", m:"Hafercreme oder Kokosmilch", o:"laktosefreie Sahne"}},
  {re:/joghurt/, for:{l:"laktosefreier Joghurt", m:"Kokosjoghurt", o:"laktosefreier Joghurt"}},
  {re:/quark/, for:{l:"laktosefreier Quark", m:"Kokosjoghurt", o:"laktosefreier Quark"}},
  {re:/frischkaese|ziegenfrischkaese/, for:{l:"laktosefreier Frischkäse", m:"veganer Frischkäse", o:"laktosefreier Frischkäse"}},
  {re:/(^|[^a-z])butter(?!milch)/, for:{m:"Rapsöl oder Pflanzenmargarine"}},
  {re:/parmesan|bergkaese|emmentaler|gouda|halloumi/, for:{h:"Mozzarella", m:"weglassen"}},
  {re:/mozzarella|feta/, for:{m:"weglassen"}},
  {re:/^(?!.*buchweizen).*(weizen|dinkel|paniermehl|gnocchi|semmelknoedel)/, for:{g:"glutenfreie Variante", wa:"glutenfreie Variante ohne Weizenstärke (z. B. Reis- oder Maismehl)", o:"glutenfreie Variante"}},
  {re:/^(?!.*glutenfrei).*hafer/, for:{g:"Haferflocken (glutenfrei)"}},
  {re:/tomat/, for:{h:"Kürbis- oder Möhrenpüree", t:"Kürbis- oder Möhrenpüree"}},
  {re:/zwiebel|schalotte/, for:{o:"Schnittlauch oder das Grün von Frühlingszwiebeln", f:"Schnittlauch"}},
  {re:/knoblauch/, for:{o:"Knoblauchöl", f:"Knoblauchöl"}},
  {re:/lauch/, for:{o:"das Grün von Frühlingszwiebeln", f:"Schnittlauch"}},
  {re:/(^|[^a-z])apfel|aepfel|birne|mango|pflaume/, for:{f:"Heidelbeeren", s:"Heidelbeeren", o:"Heidelbeeren"}},
  {re:/honig(?!melone)|agave/, for:{f:"Reissirup", o:"Ahornsirup"}},
  {re:/spinat/, for:{h:"Feldsalat"}},
  {re:/aubergine/, for:{h:"Zucchini"}},
  {re:/avocado/, for:{h:"Gurke", o:"Gurke"}},
  {re:/champignon|pilz/, for:{o:"Austernpilze in kleiner Menge oder Zucchini", h:"Zucchini"}},
  {re:/blumenkohl/, for:{o:"Brokkoli-Röschen"}},
  {re:/erdnuss/, for:{p:"Sonnenblumenkernmus", h:"Kürbiskernmus"}},
  {re:/mandel|cashew|walnuss|haselnuss|pinienkern/, for:{nu:"Kürbis- oder Sonnenblumenkerne", h:"Kürbiskerne"}},
  {re:/(^|[^a-z])ei(er|ern)?([^a-z]|$)/, for:{e:"Leinsamen-Ei (1 EL Leinsamen + 3 EL Wasser)"}},
  {re:/garnele|shrimp/, for:{kr:"Hähnchenbrust", h:"Hähnchenbrust"}},
  {re:/lachs|thunfisch|kabeljau|fischfilet|fisch(?!sauce)/, for:{i:"Hähnchenbrust"}},
  {re:/fischsauce/, for:{i:"Salz", h:"Salz"}},
  {re:/tamari|soja ?sauce|sojasauce/, for:{y:"Salz und frische Kräuter", h:"Salz und frische Kräuter", g:"Tamari (glutenfrei)", wa:"Tamari (glutenfrei)"}},
  {re:/tofu|sojajoghurt|soja/, for:{y:"Hähnchen oder Kokosjoghurt"}},
  {re:/sesam|tahin/, for:{z:"Sonnenblumenkernmus"}},
  {re:/sellerie/, for:{c:"Petersilienwurzel"}},
  {re:/senf/, for:{u:"frischer Meerrettich"}},
  {re:/weisswein|rotwein|(^|[^a-z])wein/, for:{h:"Wasser mit etwas Gemüsefond", q:"Wasser"}},
  {re:/essig/, for:{h:"etwas Zitronenschale"}},
  {re:/schoko|kakao/, for:{h:"Carob-Pulver"}},
  {re:/kichererbse|linse|bohne/, for:{o:"kleine Menge aus der Dose, gut abgespült"}},
  {re:/banane/, for:{h:"Heidelbeeren"}},
  {re:/himbeer|erdbeer|kiwi/, for:{h:"Heidelbeeren"}},
  {re:/limette|zitrone|orange/, for:{h:"etwas Zitronenschale"}},
  {re:/curry|chili|paprikapulver/, for:{h:"Kurkuma und Kreuzkümmel"}},
  {re:/hackfleisch|rinderhack/, for:{h:"frisch gewolftes Fleisch, sofort verarbeitet"}},
  {re:/zucker(?!frei)/, for:{f:"Traubenzucker"}}
];

/* ---------- Typische Gerichte auf Speisekarten (nur für „Speisekarte fotografieren“) ---------- */
const MENU_RULES = [
  {re:/pizza/, g:2, wa:2, t:2, h:2, m:2, l:1, why:"Pizza: Weizenteig, Tomate, Käse"},
  {re:/lasagne|cannelloni/, g:2, wa:2, t:2, h:2, m:2, l:2, e:1, why:"Nudelplatten, Tomate, Béchamel, Käse"},
  {re:/spaghetti|penne|tagliatelle|linguine|fusilli|rigatoni|pasta|nudel(?!.*reis)|ravioli|tortellini|gnocchi/, g:2, wa:2, e:1, o:2, why:"Nudeln meist aus Weizen (frische oft mit Ei)"},
  {re:/carbonara/, e:2, m:2, h:2, why:"Carbonara: Ei, Parmesan, Speck"},
  {re:/bolognese|napoli|arrabbiata|marinara|pomodoro/, t:2, h:2, o:2, why:"Tomatensoße (oft mit Zwiebel/Knoblauch)"},
  {re:/schnitzel|paniert|cordon|backfisch|nuggets|wiener/, g:2, wa:2, e:2, why:"Panade: Weizenmehl, Ei, Paniermehl"},
  {re:/pommes|fritten|frittiert/, g:1, wa:1, why:"Frittierfett oft auch für Paniertes genutzt"},
  {re:/burger|sandwich|baguette|toast|wrap|bruschetta|crostini/, g:2, wa:2, why:"Brot/Brötchen aus Weizen"},
  {re:/caesar/, e:2, i:2, m:2, h:2, g:2, wa:2, why:"Caesar: Dressing mit Ei und Sardellen, Parmesan, Croûtons"},
  {re:/tiramisu/, e:2, m:2, l:2, h:2, g:2, wa:2, why:"Ei, Mascarpone, Kakao, Löffelbiskuit"},
  {re:/sushi|maki|nigiri/, i:2, y:2, z:1, h:1, why:"Fisch, Sojasauce, oft Sesam"},
  {re:/kaesespaetzle|spaetzle|knoedel|klöße/, g:2, wa:2, e:2, why:"Spätzle/Knödel: Weizenmehl, Ei"},
  {re:/gratin|ueberbacken|auflauf|béchamel|bechamel/, m:2, l:2, h:1, g:1, wa:1, why:"Sahne/Milch, Käse, oft mit Mehl gebunden"},
  {re:/risotto/, m:2, h:2, q:1, why:"Parmesan, Butter, oft Weißwein"},
  {re:/curry/, h:1, o:1, why:"Oft Zwiebel, Knoblauch, Sahne oder Nüsse – nachfragen"},
  {re:/pesto/, nu:2, m:2, h:1, why:"Pesto: Pinienkerne/Nüsse, Parmesan"},
  {re:/satay|erdnuss/, p:2, h:2, why:"Erdnusssauce"},
  {re:/miso|teriyaki|soja|wok|asia/, y:2, g:1, wa:1, h:2, why:"Sojasauce (meist mit Weizen)"},
  {re:/meeresfruecht|frutti di mare|paella/, kr:2, w:2, i:1, h:2, why:"Garnelen, Muscheln, Tintenfisch"},
  {re:/calamari|tintenfisch|pulpo|muschel|vongole/, w:2, h:2, why:"Weichtiere"},
  {re:/kuchen|torte|strudel|crepe|pfannkuchen|waffel|dessert/, g:2, wa:2, e:2, m:2, l:2, why:"Gebäck: Mehl, Ei, Butter, Milch"},
  {re:/eis(?!bein|berg)|panna cotta|creme brulee|mousse/, m:2, l:2, e:1, why:"Milch, Sahne, oft Ei"},
  {re:/salami|prosciutto|serrano|chorizo|parmaschinken/, h:2, why:"Gereifte Wurst"},
  {re:/sauerkraut|kimchi/, h:2, why:"Fermentiert"},
  {re:/gulasch|braten|sosse|sauce|jus/, g:1, wa:1, c:1, h:1, why:"Soßen oft mit Mehl gebunden, mit Brühe/Sellerie, Wein"}
];
