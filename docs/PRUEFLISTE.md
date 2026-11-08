# Prüfliste „Verträglich“

Zum fachlichen Abgleich durch eine Ernährungsfachkraft bzw. Allergologie. Bitte in der Spalte „Prüfung“ mit ✔ / Korrektur markieren.

Stand: 8.11.2026

## 1. Kategorien

| Kürzel | Kategorie | Gruppe | Beschreibung | Prüfung |
|---|---|---|---|---|
| H | Histamin | Unverträglichkeit | Histaminreiches und Histaminliberatoren | |
| F | Fructose | Unverträglichkeit | Fruktose, Fruchtzucker-Sirupe, Sorbit und Co. | |
| So | Sorbit | Unverträglichkeit | Sorbit (E420) und sorbitreiches Obst | |
| L | Laktose | Unverträglichkeit | Milchzucker in Milch, Molke, Sahne, Frischmilchprodukten | |
| G | Gluten | Unverträglichkeit | Zöliakie oder Gluten-/Weizensensitivität: Weizen, Dinkel, Roggen, Gerste und Co. | |
| FM | FODMAP | Unverträglichkeit | Für Reizdarm (Low-FODMAP): Fruktane, GOS, Laktose, Fruktose, Polyole | |
| T | Tomate | Unverträglichkeit | Tomate in jeder Form – auch als Pulver, Mark, Soße oder Gewürz | |
| Wz | Weizenallergie | Allergie | Weizen und Verwandte (Dinkel, Hartweizen, Emmer …) in jeder Form – auch glutenfreie Weizenstärke | |
| Mi | Milcheiweiß | Allergie | Kuhmilchallergie – auch laktosefreie Milchprodukte, Butter, Käse | |
| Ei | Ei | Allergie | Hühnerei in jeder Form, auch Mayonnaise und Eiernudeln | |
| Sj | Soja | Allergie | Soja, Tofu, Sojasauce, Sojalecithin | |
| Nu | Schalenfrüchte | Allergie | Mandel, Haselnuss, Walnuss, Cashew, Pistazie und Co. | |
| Er | Erdnuss | Allergie | Erdnüsse und Erdnussöl/-mus | |
| Se | Sellerie | Allergie | Knollen-, Stangensellerie, Selleriesalz | |
| Sf | Senf | Allergie | Senf und Senfsaat | |
| Ss | Sesam | Allergie | Sesam, Tahin | |
| Fi | Fisch | Allergie | Alle Fischarten, Fischsauce | |
| Kr | Krebstiere | Allergie | Garnelen, Krabben, Hummer, Krebse | |
| We | Weichtiere | Allergie | Muscheln, Tintenfisch, Schnecken | |
| Lu | Lupine | Allergie | Lupinenmehl und -eiweiß | |
| Su | Sulfite | Allergie | Schwefeldioxid/Sulfite (E220–E228), z. B. in Wein und Trockenobst | |

## 2. Zutaten-Regeln (116)

Wert 0 = ok, 1 = Vorsicht, 2 = meiden. „Ausnahme“ überschreibt andere Treffer.

| Muster | Bewertung | Begründung | Prüfung |
|---|---|---|---|
| `/glu[ck]osesirup\|dextrose\|maltodextrin\|glu[ck]ose\b\|glucose syrup/` | G=0, Wz=0 (Ausnahme) |  | |
| `/glu[ck]osesirup(?!.*fru[ck]tose)\|dextrose\|maltodextrin\|glucose syrup/` | FM=0 (Ausnahme) |  | |
| `/weizenstaerke\|wheat starch/` | G=1, FM=1 (Ausnahme) | Weizenstärke – kann glutenfrei aufbereitet sein, Kennzeichnung prüfen | |
| `/buchweizen\|buckwheat/` | G=0, Wz=0 (Ausnahme) |  | |
| `/buchweizen\|buckwheat/` | FM=0 (Ausnahme) |  | |
| `/glutenfrei\|gluten-free\|gluten free\|ohne gluten/` | G=0 (Ausnahme) |  | |
| `/laktosefrei\|lactose-free\|lactose free\|ohne laktose/` | L=0 (Ausnahme) |  | |
| `/zitronensaeure\|citronensaeure\|citric acid\|e ?330(?!\d)\|ascorbinsaeure\|ascorbic\|weinsaeure\|milchsaeure\|lactic acid\|e ?270(?!\d)/` | H=0, L=0 (Ausnahme) |  | |
| `/frischkaese\|huettenkaese\|mozzarella\|mascarpone\|ricotta\|cream cheese/` | H=0 (Ausnahme) |  | |
| `/kakaobutter\|cocoa butter/` | H=0 (Ausnahme) |  | |
| `/milchreis\|milchsaeurebakterien\|milchsaeure/` | L=0 (Ausnahme) |  | |
| `/milchsaeure\|lactic acid\|milchsaeurebakterien\|kakaobutter\|cocoa butter\|erdnussbutter\|sheabutter\|kokosmilch\|kokosnussmilch\|hafermilch\|mandelmilch\|sojamilch\|reismilch\|milchreis\|e ?270(?!\d)\|e ?32[5-7](?!\d)/` | Mi=0 (Ausnahme) |  | |
| `/kokosnuss\|kokos\|muskatnuss\|muskat\|(^\|[^a-z])erdnuss/` | Nu=0 (Ausnahme) |  | |
| `/tintenfisch/` | Fi=0 (Ausnahme) |  | |
| `/weizen\|dinkel\|emmer\|einkorn\|kamut\|khorasan\|durum\|gruenkern\|bulgur\|couscous\|seitan\|griess\|triticale\|wheat\|spelt\|paniermehl\|semmelbroesel/` | Wz=2 | Weizen bzw. Weizenart – auch als Stärke oder glutenfrei relevant | |
| `/gluten(?!frei\|-free\| free)\|glutenhaltiges getreide/` | Wz=1 | Gluten – Getreideart unklar, kann Weizen sein | |
| `/weizen\|dinkel\|roggen\|gerste\|emmer\|einkorn\|kamut\|khorasan\|gruenkern\|triticale\|bulgur\|couscous\|seitan\|griess\|paniermehl\|semmelbroesel\|wheat\|barley\|(^\|[^a-z])rye([^a-z]\|$)\|spelt\|durum/` | G=2 | Glutenhaltiges Getreide | |
| `/gerstenmalz\|malzextrakt\|roestmalz\|(^\|[^a-z])malz([^a-z]\|$)\|malt extract\|barley malt\|(^\|[^a-z])malt([^a-z]\|$)/` | G=2 | Malz aus Gerste – glutenhaltig | |
| `/gluten(?!frei\|-free\| free)/` | G=2 | Enthält Gluten | |
| `/hafer\|(^\|[^a-z])oats?([^a-z]\|$)\|oatmeal/` | G=1 | Hafer – nur als glutenfrei gekennzeichnet sicher | |
| `/(^\|[^a-z])bier\|(^\|[^a-z])beer/` | H=2, G=2 | Bier – Gerste, histaminreich | |
| `/laktose\|lactose\|milchzucker/` | L=2 | Laktose (Milchzucker) | |
| `/milchpulver\|magermilchpulver\|vollmilchpulver\|molke\|milchserum\|kondensmilch\|milk powder\|skimmed milk\|whey\|milk solids/` | L=2 | Milchpulver/Molke – laktosereich | |
| `/(^\|[^a-z])(voll\|mager\|frisch\|kuh\|roh\|teilentrahmte \|fettarme \|haltbare )?milch(?!saeure\|eiweiss\|protein\|fett\|saeurebakterien)\|(^\|[^a-z])milk(?! protein\| fat)/` | L=2 | Milch – laktosereich | |
| `/buttermilch\|buttermilk/` | L=2 | Buttermilch | |
| `/milcheiweiss\|milchprotein\|milk protein\|kasein\|casein/` | L=1 | Milcheiweiß – kann Laktose-Reste enthalten | |
| `/sahne\|(^\|[^a-z])rahm\|schmand\|creme fraiche\|crème fraîche\|(^\|[^a-z])cream([^a-z]\|$)/` | L=1 | Sahne/Rahm | |
| `/joghurt\|jogurt\|yogh?urt\|kefir\|quark\|frischkaese\|mascarpone\|ricotta\|huettenkaese\|cream cheese/` | L=1 | Frische Milchprodukte – Laktose | |
| `/fru[ck]tose\|fruchtzucker/` | F=2 | Fruktose | |
| `/invertzucker\|invert sugar/` | F=2 | Invertzucker – zur Hälfte Fruktose | |
| `/honig\|honey/` | F=2 | Honig – sehr fruktosereich | |
| `/agave/` | F=2 | Agavendicksaft – sehr fruktosereich | |
| `/dicksaft\|fruchtsuesse/` | F=2 | Fruchtdicksaft – fruktosereich | |
| `/sorbit\|e ?420(?!\d)/` | F=2 | Sorbit – verschlechtert die Fruktose-Aufnahme | |
| `/xylit\|e ?967(?!\d)/` | F=2 | Xylit (Zuckeralkohol) | |
| `/mannit\|e ?421(?!\d)/` | F=2 | Mannit (Zuckeralkohol) | |
| `/maltit\|e ?965(?!\d)/` | F=2 | Maltit (Zuckeralkohol) | |
| `/isomalt\|e ?953(?!\d)/` | F=2 | Isomalt (Zuckeralkohol) | |
| `/lactit\|lactitol\|e ?966(?!\d)/` | F=2 | Lactit (Zuckeralkohol) | |
| `/erythrit\|e ?968(?!\d)/` | F=1 | Erythrit – meist besser verträglich als andere Zuckeralkohole | |
| `/inulin\|oligofru[ck]tose\|fructooligo\|chicoree\|chicory/` | F=1 | Fruktane | |
| `/apfel\|aepfel\|birne\|mango\|pflaume\|dattel\|feige\|rosine\|trockenobst\|trockenfruecht\|(^\|[^a-z])apples?([^a-z]\|$)\|(^\|[^a-z])pears?([^a-z]\|$)\|raisin\|(^\|[^a-z])dates?([^a-z]\|$)/` | F=2 | Fruktosereiches Obst | |
| `/fruchtsaft\|saftkonzentrat\|fruchtpulver\|fruchtzubereitung\|fruit juice\|juice concentrate/` | F=1 | Fruchtsaft/-zubereitung – oft fruktosereich | |
| `/zwiebel\|knoblauch\|lauch\|onion\|garlic/` | F=1 | Fruktane – kleine Mengen oft ok | |
| `/sorbit\|e ?420(?!\d)/` | So=2 | Sorbit (E420) | |
| `/pflaume\|zwetschge\|kirsche\|kirschen\|aprikose\|marille\|pfirsich\|nektarine\|(^\|[^a-z])apfel\|aepfel\|birne\|trockenpflaume\|dattel\|(^\|[^a-z])prunes?/` | So=2 | Sorbitreiches Obst | |
| `/kaugummi\|chewing gum\|zuckerfrei\|ohne zucker\|sugar free/` | So=1, FM=1 | Zuckerfrei – oft mit Zuckeraustauschstoffen | |
| `/weizen\|roggen\|gerste\|wheat\|barley\|(^\|[^a-z])rye([^a-z]\|$)\|bulgur\|couscous\|griess\|paniermehl\|semmelbroesel/` | FM=2 | Fruktane aus Weizen, Roggen oder Gerste | |
| `/dinkel\|spelt/` | FM=1 | Dinkel – weniger Fruktane als Weizen | |
| `/zwiebel\|knoblauch\|schalotte\|onion\|garlic\|shallot/` | FM=2 | Fruktane aus Zwiebel/Knoblauch | |
| `/lauch\|porree\|leek/` | FM=1 | Lauch – Fruktane | |
| `/inulin\|oligofru[ck]tose\|fructooligo\|chicoree\|chicory\|topinambur/` | FM=2 | Fruktane (Inulin, Oligofruktose) | |
| `/bohne\|kichererbse\|linse\|erbse(?!n?protein)\|sojabohne\|(^\|[^a-z])beans?([^a-z]\|$)\|chickpea\|lentil/` | FM=2 | Hülsenfrüchte – Galakto-Oligosaccharide | |
| `/pilz\|champignon\|mushroom\|blumenkohl\|cauliflower\|spargel\|asparagus/` | FM=2 | Polyole (Mannit) | |
| `/avocado\|suesskartoffel\|sellerie\|celery/` | FM=1 | Polyole in größeren Mengen | |
| `/cashew\|pistazie\|pistachio/` | FM=2 | Cashew/Pistazie – GOS und Fruktane | |
| `/wassermelone\|mango\|(^\|[^a-z])apfel\|aepfel\|birne\|kirsche\|pflaume\|nektarine\|pfirsich\|trockenobst\|rosine\|dattel\|feige/` | FM=2 | Fruktose- oder polyolreiches Obst | |
| `/mannit\|xylit\|maltit\|isomalt\|lactit\|e ?42[01](?!\d)\|e ?96[5-7](?!\d)\|e ?953(?!\d)/` | FM=2 | Polyole (Zuckeraustauschstoffe) | |
| `/(^\|[^a-z])(voll\|mager\|frisch\|kuh\|roh\|teilentrahmte \|fettarme \|haltbare \|laktosefreie )?milch\|(^\|[^a-z])milk\|milchpulver\|molke\|whey\|kondensmilch\|buttermilch\|sahne\|(^\|[^a-z])rahm\|schmand\|creme fraiche\|(^\|[^a-z])cream([^a-z]\|$)\|joghurt\|jogurt\|yogh?urt\|kefir\|quark\|kaese\|cheese\|mozzarella\|mascarpone\|ricotta\|parmesan\|feta\|(^\|[^a-z])butter\|butterreinfett\|butterschmalz\|ghee\|kasein\|casein\|laktose\|lactose\|milchzucker\|milcheiweiss\|milchprotein\|lactoglobulin\|lactalbumin/` | Mi=2 | Enthält Milch(-eiweiß) | |
| `/(^\|[^a-z])ei(er\|ern)?([^a-z]\|$)\|vollei\|eigelb\|eidotter\|eiklar\|eiweisspulver\|huehnerei\|eipulver\|trockenei\|flüssigei\|fluessigei\|eiernudel\|mayonnaise\|mayo\b\|(^\|[^a-z])eggs?([^a-z]\|$)\|egg yolk\|egg white\|albumin\|lysozym\|e ?1105(?!\d)/` | Ei=2 | Enthält Ei | |
| `/soja\|(^\|[^a-z])soy\|tofu\|tempeh\|miso\|edamame\|tamari\|shoyu/` | Sj=2 | Enthält Soja | |
| `/lecithin\|e ?322(?!\d)/` | Sj=1 | Lecithin – oft aus Soja, Herkunft prüfen | |
| `/mandel\|haselnuss\|haselnuesse\|walnuss\|walnuesse\|cashew\|pekan\|paranuss\|paranuesse\|pistazie\|macadamia\|queenslandnuss\|(^\|[^a-z])(nuss\|nuesse\|nussmus\|nusspaste)([^a-z]\|$)\|nougat\|nugat\|marzipan\|krokant\|praline\|tree nuts?\|hazelnut\|almond\|walnut\|pecan\|pistachio\|brazil nut/` | Nu=2 | Enthält Schalenfrüchte (Nüsse) | |
| `/erdnuss\|erdnuesse\|peanut\|arachis/` | Er=2 | Enthält Erdnuss | |
| `/sellerie\|celery\|celeriac/` | Se=2 | Enthält Sellerie | |
| `/senf\|mustard/` | Sf=2 | Enthält Senf | |
| `/sesam\|tahin\|tahini\|sesame/` | Ss=2 | Enthält Sesam | |
| `/fisch\|lachs\|thunfisch\|kabeljau\|dorsch\|seelachs\|forelle\|hering\|makrele\|sardine\|sardelle\|anchovi\|scholle\|zander\|pangasius\|tilapia\|rotbarsch\|(^\|[^a-z])fish\|salmon\|(^\|[^a-z])tuna\|(^\|[^a-z])cod([^a-z]\|$)\|anchov\|fischsauce\|fish sauce/` | Fi=2 | Enthält Fisch | |
| `/garnele\|shrimp\|prawn\|krabbe\|(^\|[^a-z])krebs\|flusskrebs\|hummer\|languste\|langustine\|scampi\|crustacea\|crab\|lobster\|krebstier/` | Kr=2 | Enthält Krebstiere | |
| `/muschel\|tintenfisch\|kalmar\|calamar\|oktopus\|krake\|schnecke\|auster\|mollus\|weichtier\|squid\|mussel\|oyster\|clam\|scallop/` | We=2 | Enthält Weichtiere | |
| `/meeresfrue\|seafood/` | Kr=1, We=1 | Meeresfrüchte – Krebs- oder Weichtiere möglich | |
| `/lupin/` | Lu=2 | Enthält Lupine | |
| `/sulfit\|sulphite\|sulfite\|schwefeldioxid\|disulfit\|geschwefelt\|e ?22[0-8](?!\d)/` | Su=2 | Enthält Sulfite | |
| `/(^\|[^a-z])(rot\|weiss\|dessert\|koch)?wein(?!stein\|saeure)\|(^\|[^a-z])wine\|sekt\|trockenobst\|trockenfruecht\|rosine/` | Su=1 | Enthält häufig Sulfite | |
| `/tomat\|ketchup\|catsup\|passata\|pizzasauce\|pizzasosse\|pizzawuerze\|bolognese\|arrabbiata\|napoli\|gazpacho\|(^\|[^a-z])sugo\|chutney/` | T=2 | Tomate (auch als Pulver, Mark, Soße oder Gewürz) | |
| `/(^\|[^a-z])gewuerze?([^a-z]\|$)\|gewuerzmischung\|gewuerzzubereitung\|wuerzmischung\|gemuesepulver\|gemueseextrakt\|gemuesebruehe\|bruehe\|bouillon\|(^\|[^a-z])salsa\|grillsauce\|barbecue\|bbq\|(^\|[^a-z])curry([^a-z]\|$)\|(^\|[^a-z])spices?([^a-z]\|$)\|seasoning/` | T=1 | Gewürz-/Gemüsemischung – enthält häufig Tomate | |
| `/hefeextrakt\|hefe-extrakt\|yeast extract\|speisewuerze\|(^\|[^a-z])wuerze([^a-z]\|$)/` | H=2 | Hefeextrakt/Würze – histaminreich | |
| `/soja ?sauce\|sojasosse\|soja-sosse\|shoyu\|tamari\|soy sauce/` | H=2 | Sojasauce – fermentiert | |
| `/soja ?sauce\|sojasosse\|soja-sosse\|shoyu\|soy sauce/` | G=2 | Sojasauce – meist mit Weizen gebraut (Tamari ist oft glutenfrei) | |
| `/tomat/` | H=2 | Tomate – Histaminliberator | |
| `/spinat\|spinach/` | H=2 | Spinat – histaminreich | |
| `/aubergine\|eggplant/` | H=2 | Aubergine – histaminreich | |
| `/avocado/` | H=2 | Avocado – histaminreich | |
| `/sauerkraut\|kimchi\|miso\|tempeh\|kombucha\|fermentiert\|fermented/` | H=2 | Fermentiert – histaminreich | |
| `/parmesan\|emmentaler\|bergkaese\|cheddar\|gruyere\|grana padano\|pecorino\|hartkaese\|reifekaese\|camembert\|(^\|[^a-z])brie([^a-z]\|$)\|gorgonzola\|roquefort\|blauschimmel/` | H=2 | Gereifter Käse – histaminreich | |
| `/kaese\|cheese/` | H=1 | Käse – je nach Reifegrad | |
| `/(^\|[^a-z])(rot\|weiss\|dessert\|koch)?wein(?!stein\|saeure)\|(^\|[^a-z])wine/` | H=2 | Wein – histaminreich | |
| `/sekt\|branntwein\|likoer\|spirituose\|alkohol\|alcohol\|(^\|[^a-z])rum([^a-z]\|$)\|ethanol/` | H=2 | Alkohol – hemmt den Histaminabbau | |
| `/balsamico\|weinessig\|wine vinegar/` | H=2 | Wein-/Balsamicoessig – histaminreich | |
| `/essig\|vinegar/` | H=1 | Essig | |
| `/salami\|rohschinken\|parmaschinken\|serrano\|chorizo\|rohwurst\|landjaeger\|pepperoni/` | H=2 | Gereifte Wurst – histaminreich | |
| `/thunfisch\|makrele\|sardine\|sardelle\|anchovi\|hering\|fischsauce\|(^\|[^a-z])thun([^a-z]\|$)\|(^\|[^a-z])tuna\|mackerel\|anchov\|fish sauce/` | H=2 | Fisch – oft histaminreich | |
| `/garnele\|shrimp\|prawn\|krabbe\|meeresfrue\|muschel\|tintenfisch\|krebs\|seafood/` | H=2 | Meeresfrüchte – histaminreich | |
| `/geraeuchert\|raeucher\|smoked/` | H=1 | Geräuchert | |
| `/kakao\|schoko\|cacao\|cocoa\|chocolate/` | H=2 | Kakao – Histaminliberator | |
| `/erdbeer\|strawberr/` | H=2 | Erdbeere – Histaminliberator | |
| `/himbeer\|raspberr/` | H=1 | Himbeere | |
| `/orange\|zitrus\|grapefruit\|mandarin\|limette\|pomelo\|citrus\|(^\|[^a-z])lime/` | H=2 | Zitrusfrucht – Histaminliberator | |
| `/zitronensaft\|zitrone(?!nsaeure)\|zitronenschale\|lemon/` | H=1 | Zitrone | |
| `/ananas\|pineapple/` | H=2, F=1 | Ananas – Histaminliberator | |
| `/kiwi/` | H=2 | Kiwi – Histaminliberator | |
| `/papaya/` | H=1 | Papaya | |
| `/banane\|banana/` | H=1 | Banane | |
| `/erdnuss\|walnuss\|cashew\|pekannuss\|peanut\|walnut\|pecan/` | H=2 | Nüsse – Histaminliberator | |
| `/haselnuss\|mandel\|hazelnut\|almond/` | H=1 | Nüsse | |
| `/glutamat\|glutamate\|e ?62[0-5](?!\d)\|geschmacksverstaerker\|flavou?r enhancer/` | H=1 | Glutamat – kann Beschwerden verstärken | |
| `/benzoe\|benzoat\|benzoate\|e ?21[0-3](?!\d)/` | H=1 | Benzoat (Konservierungsstoff) | |
| `/sulfit\|sulphite\|sulfite\|schwefeldioxid\|disulfit\|e ?22[0-8](?!\d)/` | H=1 | Sulfit (Konservierungsstoff) | |
| `/tartrazin\|azorubin\|cochenillerot\|gelborange\|allurarot\|e ?1(02\|10\|22\|24\|29)(?!\d)/` | H=1 | Azofarbstoff | |
| `/eiklar\|huehnereiweiss\|eiweisspulver\|egg white/` | H=1 | Eiklar – Histaminliberator | |
| `/(^\|[^a-z])ei(er\|ern)?([^a-z]\|$)\|vollei\|huehnerei(?!weiss)\|(^\|[^a-z])eggs?([^a-z]\|$)/` | H=1 | Ei – Eiklar ist ein Histaminliberator, durchgegart meist ok | |
| `/weizenkeim\|wheat germ/` | H=2 | Weizenkeime – histaminreich | |
| `/bohne\|linse\|kichererbse\|(^\|[^a-z])beans?([^a-z]\|$)\|lentil\|chickpea/` | H=1, F=1 | Hülsenfrüchte | |
| `/chili\|curry\|cayenne/` | H=1 | Scharfe Gewürze | |
| `/pilz\|champignon\|mushroom/` | H=1 | Pilze | |
| `/hackfleisch\|rinderhack\|schweinehack\|(^\|[^a-z])hack([^a-z]\|$)\|gehacktes\|minced/` | H=1 | Hackfleisch – verdirbt schnell, ganz frisch verarbeiten | |

## 3. Lebensmittel-Liste (151)

| Lebensmittel | H | F | So | L | G | FM | T | Wz | Mi | Ei | Sj | Nu | Er | Se | Sf | Ss | Fi | Kr | We | Lu | Su | Hinweis | Prüfung |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kartoffel |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Karotte |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Gurke |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Zucchini |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Kürbis |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Paprika |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Brokkoli |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Kann blähen | |
| Blumenkohl |  | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Kann blähen | |
| Fenchel |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Rote Bete |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Süßkartoffel |  |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Mais |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Kopfsalat, Eisberg |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Feldsalat |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Rucola |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Spargel |  | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Fruktane | |
| Tomate | 2 |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Histaminliberator – auch Tomatenmark, Ketchup, Passata | |
| Spinat | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Histaminreich | |
| Aubergine | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Histaminreich | |
| Avocado | 2 |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Histaminreich | |
| Sauerkraut | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Fermentiert | |
| Oliven | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Meist fermentiert oder eingelegt | |
| Essiggurken | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Essig | |
| Pilze, Champignons | 1 | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Nur ganz frisch | |
| Zwiebel |  | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Fruktane – kleine Mengen oft ok | |
| Knoblauch |  | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Fruktane – kleine Mengen oft ok | |
| Lauch |  | 1 |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Fruktane | |
| Erbsen | 1 | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Linsen | 1 | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Kichererbsen | 1 | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Kidneybohnen | 1 | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Tofu, Soja | 1 | 1 |  |  |  | 1 |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  | Individuell sehr verschieden | |
| Erdnüsse | 2 |  |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  | Histaminliberator | |
| Walnuss | 2 |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  | |
| Cashew | 2 |  |  |  |  | 2 |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  | |
| Haselnuss | 1 |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  | |
| Mandel | 1 |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  | |
| Macadamia |  |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  | |
| Kürbiskerne |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Sonnenblumenkerne | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Leinsamen |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Chiasamen |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Apfel |  | 2 | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Viel Fruktose und Sorbit | |
| Birne |  | 2 | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Viel Fruktose und Sorbit | |
| Mango |  | 2 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Wassermelone |  | 2 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Kirsche |  | 2 | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Sorbit | |
| Pflaume | 1 | 2 | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Sorbit | |
| Trockenobst (Rosinen, Datteln, Feigen) | 1 | 2 | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 | Sehr fruktosereich | |
| Honigmelone |  | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Weintrauben |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 |  | |
| Pfirsich, Nektarine |  | 1 | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Aprikose |  | 1 | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Sorbit | |
| Johannisbeere |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Banane | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Sehr reif mehr Histamin | |
| Heidelbeere |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Himbeere | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Rhabarber |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Papaya | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Erdbeere | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Histaminliberator | |
| Kiwi | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Histaminliberator | |
| Ananas | 2 | 1 |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Histaminliberator | |
| Orange | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Zitrusfrucht | |
| Mandarine | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Zitrusfrucht | |
| Grapefruit | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Zitrusfrucht | |
| Zitrone | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Etwas Saft zum Würzen oft ok | |
| Reis |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Hirse |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Buchweizen |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Kein Weizen – glutenfrei | |
| Quinoa |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Amaranth |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Maismehl, Polenta |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Reisnudeln |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Hafer |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Nur als „glutenfrei“ gekennzeichnet sicher | |
| Weizen |  | 1 |  |  | 2 | 2 |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | Fruktane | |
| Dinkel |  | 1 |  |  | 2 | 1 |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Roggen |  | 1 |  |  | 2 | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Gerste |  | 1 |  |  | 2 | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Bulgur, Couscous |  | 1 |  |  | 2 | 2 |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | Aus Weizen | |
| Nudeln (Weizen) |  | 1 |  |  | 2 | 2 |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Weizenbrot, Brötchen |  | 1 |  |  | 2 | 2 |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Roggenbrot, Sauerteig | 1 | 1 |  |  | 2 | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Glutenfreies Brot |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Zutaten trotzdem prüfen | |
| Paniermehl |  | 1 |  |  | 2 | 2 |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Milch |  |  |  | 2 |  | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  | Etwa 5 g Laktose pro 100 ml | |
| Laktosefreie Milch |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Butter |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  | Nur Spuren von Laktose – meist gut verträglich | |
| Ghee, Butterschmalz |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  | Praktisch laktosefrei | |
| Sahne |  |  |  | 1 |  | 1 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Quark |  |  |  | 1 |  | 1 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Frischkäse |  |  |  | 1 |  | 1 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Mozzarella |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  | Frisch; wenig Laktose | |
| Mascarpone |  |  |  | 1 |  | 1 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Hüttenkäse |  |  |  | 1 |  | 1 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Joghurt natur | 1 |  |  | 1 |  | 1 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  | Die Joghurtkulturen helfen beim Laktoseabbau | |
| Laktosefreier Joghurt | 1 |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Kefir, Buttermilch | 1 |  |  | 1 |  | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Gouda jung | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Gouda alt, Emmentaler, Bergkäse | 2 |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  | Gereift: histaminreich, aber laktosefrei | |
| Parmesan | 2 |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  | Gereift: histaminreich, aber laktosefrei | |
| Camembert, Brie | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Gereift | |
| Eier | 1 |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  | Eiklar ist ein Histaminliberator; durchgegart meist ok | |
| Frisches Fleisch (Rind, Schwein, Geflügel) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Frisch kaufen, schnell verarbeiten | |
| Hackfleisch | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Verdirbt schnell – ganz frisch verarbeiten | |
| Kochschinken | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Würstchen | 1 |  |  | 1 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Teils Weizen oder Milchzucker | |
| Salami | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Gereift | |
| Rohschinken (Parma, Serrano) | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Gereift | |
| Fisch frisch oder TK |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  | Nur fangfrisch oder direkt tiefgekühlt | |
| Thunfisch (Dose) | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  | |
| Räucherlachs | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  | |
| Makrele, Hering | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  | |
| Garnelen, Meeresfrüchte | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 | 1 |  |  |  | |
| Wasser |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Kräutertee |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Schwarzer und grüner Tee | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Kaffee | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Individuell | |
| Rotwein | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 |  | |
| Weißwein, Sekt | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 |  | |
| Bier | 2 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Gerste | |
| Apfelsaft, Birnensaft |  | 2 | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Orangensaft | 2 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Cola, Limonade | 1 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Oft Glukose-Fruktose-Sirup | |
| Energy-Drinks | 2 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Kombucha | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Fermentiert | |
| Hafermilch |  | 1 |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Nur mit glutenfreiem Hafer sicher | |
| Reismilch |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Mandelmilch | 1 |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  | |
| Sojamilch | 1 | 1 |  |  |  | 1 |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  | |
| Kokosmilch |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Haushaltszucker |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | In kleinen Mengen meist ok | |
| Traubenzucker |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Kann die Fruktose-Aufnahme verbessern | |
| Ahornsirup |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Reissirup |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Honig |  | 2 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Agavendicksaft |  | 2 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Zartbitterschokolade | 2 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Histaminliberator | |
| Milchschokolade | 2 | 1 |  | 1 |  | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Gummibärchen |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Zutaten prüfen | |
| Zuckerfreier Kaugummi |  | 2 | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Sorbit, Xylit | |
| Speiseeis (Milch) |  | 1 |  | 1 |  | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Sojasauce | 2 |  |  |  | 2 |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  | Fermentiert, meist mit Weizen – Tamari ist oft glutenfrei | |
| Wein- und Balsamicoessig | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 |  | |
| Branntweinessig | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Senf | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  | |
| Ketchup | 2 | 1 |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Hefeextrakt | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Gemüsebrühe (Fertig) | 2 | 1 |  | 1 | 1 |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | Oft Hefeextrakt, Glutamat, Weizen, Milchzucker | |
| Chili, Curry | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Frische Kräuter |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |
| Salz, Pfeffer |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |

## 4. Austauschvorschläge (43)

| Zutat (Muster) | Vorschläge | Prüfung |
|---|---|---|
| `/buttermilch/` | L: laktosefreie Buttermilch; Mi: Haferdrink mit Zitronensaft; FM: laktosefreie Buttermilch | |
| `/(^\|[^a-z])(voll\|frisch\|fettarme \|kuh)?milch([^a-z]\|$)/` | L: laktosefreie Milch; Mi: Haferdrink oder Reisdrink; FM: laktosefreie Milch | |
| `/sahne\|(^\|[^a-z])rahm/` | L: laktosefreie Sahne; Mi: Hafercreme oder Kokosmilch; FM: laktosefreie Sahne | |
| `/joghurt/` | L: laktosefreier Joghurt; Mi: Kokosjoghurt; FM: laktosefreier Joghurt | |
| `/quark/` | L: laktosefreier Quark; Mi: Kokosjoghurt; FM: laktosefreier Quark | |
| `/frischkaese\|ziegenfrischkaese/` | L: laktosefreier Frischkäse; Mi: veganer Frischkäse; FM: laktosefreier Frischkäse | |
| `/(^\|[^a-z])butter(?!milch)/` | Mi: Rapsöl oder Pflanzenmargarine | |
| `/parmesan\|bergkaese\|emmentaler\|gouda\|halloumi/` | H: Mozzarella; Mi: weglassen | |
| `/mozzarella\|feta/` | Mi: weglassen | |
| `/^(?!.*buchweizen).*(weizen\|dinkel\|paniermehl\|gnocchi\|semmelknoedel)/` | G: glutenfreie Variante; Wz: glutenfreie Variante ohne Weizenstärke (z. B. Reis- oder Maismehl); FM: glutenfreie Variante | |
| `/^(?!.*glutenfrei).*hafer/` | G: Haferflocken (glutenfrei) | |
| `/tomat/` | H: Kürbis- oder Möhrenpüree; T: Kürbis- oder Möhrenpüree | |
| `/zwiebel\|schalotte/` | FM: Schnittlauch oder das Grün von Frühlingszwiebeln; F: Schnittlauch | |
| `/knoblauch/` | FM: Knoblauchöl; F: Knoblauchöl | |
| `/lauch/` | FM: das Grün von Frühlingszwiebeln; F: Schnittlauch | |
| `/(^\|[^a-z])apfel\|aepfel\|birne\|mango\|pflaume/` | F: Heidelbeeren; So: Heidelbeeren; FM: Heidelbeeren | |
| `/honig\|agave/` | F: Reissirup; FM: Ahornsirup | |
| `/spinat/` | H: Feldsalat | |
| `/aubergine/` | H: Zucchini | |
| `/avocado/` | H: Gurke; FM: Gurke | |
| `/champignon\|pilz/` | FM: Austernpilze in kleiner Menge oder Zucchini; H: Zucchini | |
| `/blumenkohl/` | FM: Brokkoli-Röschen | |
| `/erdnuss/` | Er: Sonnenblumenkernmus; H: Kürbiskernmus | |
| `/mandel\|cashew\|walnuss\|haselnuss\|pinienkern/` | Nu: Kürbis- oder Sonnenblumenkerne; H: Kürbiskerne | |
| `/(^\|[^a-z])ei(er\|ern)?([^a-z]\|$)/` | Ei: Leinsamen-Ei (1 EL Leinsamen + 3 EL Wasser) | |
| `/garnele\|shrimp/` | Kr: Hähnchenbrust; H: Hähnchenbrust | |
| `/lachs\|thunfisch\|kabeljau\|fischfilet\|fisch(?!sauce)/` | Fi: Hähnchenbrust | |
| `/fischsauce/` | Fi: Salz; H: Salz | |
| `/tamari\|soja ?sauce\|sojasauce/` | Sj: Salz und frische Kräuter; H: Salz und frische Kräuter; G: Tamari (glutenfrei); Wz: Tamari (glutenfrei) | |
| `/tofu\|sojajoghurt\|soja/` | Sj: Hähnchen oder Kokosjoghurt | |
| `/sesam\|tahin/` | Ss: Sonnenblumenkernmus | |
| `/sellerie/` | Se: Petersilienwurzel | |
| `/senf/` | Sf: frischer Meerrettich | |
| `/weisswein\|rotwein\|(^\|[^a-z])wein/` | H: Wasser mit etwas Gemüsefond; Su: Wasser | |
| `/essig/` | H: etwas Zitronenschale | |
| `/schoko\|kakao/` | H: Carob-Pulver | |
| `/kichererbse\|linse\|bohne/` | FM: kleine Menge aus der Dose, gut abgespült | |
| `/banane/` | H: Heidelbeeren | |
| `/himbeer\|erdbeer\|kiwi/` | H: Heidelbeeren | |
| `/limette\|zitrone\|orange/` | H: etwas Zitronenschale | |
| `/curry\|chili\|paprikapulver/` | H: Kurkuma und Kreuzkümmel | |
| `/hackfleisch\|rinderhack/` | H: frisch gewolftes Fleisch, sofort verarbeitet | |
| `/zucker(?!frei)/` | F: Traubenzucker | |

## 5. Ernährungsprogramme (Phasen, Dauern, Tests, Hinweise)

```js
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
```

## 6. Standard-Notfallplan (Anaphylaxie)

```js
const PLAN_DEFAULT = [
  "Anzeichen einer schweren Reaktion: Atemnot, Heiserkeit, Schwellung von Zunge oder Hals, Schwindel, Kreislaufprobleme, Erbrechen nach Kontakt mit dem Allergen, Benommenheit.",
  "Adrenalin-Autoinjektor sofort in den äußeren Oberschenkel – auch durch die Kleidung. Ein abgelaufener Pen ist im Notfall besser als keiner.",
  "Notruf 112 wählen und „Anaphylaxie“ sagen.",
  "Nicht aufstehen oder herumlaufen. Bei Atemnot aufrecht sitzen, bei Schwindel hinlegen und Beine hochlagern. Bewusstlos: stabile Seitenlage. Keine normale Atmung: Wiederbelebung.",
  "Bessert sich nichts, nach 5–15 Minuten den zweiten Pen geben, falls vorhanden.",
  "Antihistaminikum und Kortison wie verordnet zusätzlich – sie ersetzen kein Adrenalin.",
  "Auch wenn es besser wird: immer ins Krankenhaus. Die Reaktion kann wiederkommen."
];
```

## 7. Offene fachliche Fragen

- Zeitfenster für die Zuordnung von Beschwerden (schnelle Reaktionen 0–4 h, Verdauung 0,5–12 h)
- Dauer der Karenzphase bei Fruktosemalabsorption (2–4 Wochen?)
- Intervall bis zum zweiten Adrenalin-Pen (5–10 oder 5–15 Minuten?)
- Bewertung von Lebensmitteln mit portionsabhängiger Verträglichkeit (FODMAP)
