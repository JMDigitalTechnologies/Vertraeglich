"use strict";
/* Verträglich – zentrale Konfiguration
   Hier wird festgelegt, was die App kann. So lässt sich später ohne Umbau
   z. B. eine App-Store-Version (Capacitor) oder ein Plus-Modell bauen:
   - available:   Funktion grundsätzlich verfügbar (false = komplett ausgeblendet)
   - plus:        Funktion als „Plus“ markieren (aktuell ohne Wirkung, alles kostenlos)
   - links:       Impressum/Datenschutz – für eine Veröffentlichung nötig */
const APP_CONFIG = {
  name: "Verträglich",
  platform: (typeof window !== "undefined" && window.Capacitor) ? "native" : "web",
  edition: "free",                 // "free" | später z. B. "plus"
  features: {
    foods:        {available: true, plus: false},
    recipes:      {available: true, plus: false},
    diary:        {available: true, plus: false},
    symptoms:     {available: true, plus: false},
    report:       {available: true, plus: false},
    alternatives: {available: true, plus: false},
    lists:        {available: true, plus: false},
    family:       {available: true, plus: false},
    program:      {available: true, plus: false},
    card:         {available: true, plus: false},
    emergency:    {available: true, plus: false},
  },
  data: {
    off: "https://world.openfoodfacts.org",      // Produktdatenbank (ODbL)
    offSearch: "https://search.openfoodfacts.org"
  },
  links: {
    privacy: "",   // URL Datenschutzerklärung – vor einer Veröffentlichung eintragen
    imprint: ""    // URL Impressum
  }
};
