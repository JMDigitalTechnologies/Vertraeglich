# Verträglich – Aufbau

Reine Web-App ohne Build-Schritt, ohne Server, ohne Konto. Alle Nutzerdaten liegen im `localStorage` des Geräts.

| Datei | Inhalt |
|---|---|
| `config.js` | Zentrale Konfiguration: welche Funktionen verfügbar sind (`available`), Markierung für ein mögliches Plus-Modell (`plus`), Datenquellen, Links zu Impressum/Datenschutz |
| `data.js` | Lebensmittel-Liste, Zutaten-Regeln, Rezepte |
| `engine.js` | Bewertungslogik (ohne Oberfläche, testbar mit Node) |
| `app.js` | Oberfläche: Prüfen, Ergebnis, Lebensmittel, Rezepte, Tagebuch, Profil, Einstieg |
| `features.js` | Zusatzfunktionen als Module: Symptome, Arztbericht, Alternativen, Favoriten/Einkaufsliste, mehrere Profile, Ernährungsprogramm, Allergiekarte, Notfall, Offline |
| `sw.js` | Service Worker für den Offline-Betrieb |

## Funktionen an- und abschalten
Nutzer wählen beim Einstieg und unter *Profil → Funktionen*, was sie sehen möchten (`vt_settings.features`).
Über `APP_CONFIG.features[k].available = false` lässt sich eine Funktion für alle ausblenden.

## Später als App im App Store
Der Code ist so aufgebaut, dass er sich mit [Capacitor](https://capacitorjs.com) ohne Umbau in eine iOS-/Android-App verpacken lässt:
- nur relative Pfade, keine GitHub-spezifischen Abhängigkeiten
- `APP_CONFIG.platform` erkennt die native Umgebung
- Kamera über Web-Standards (`getUserMedia`), in Capacitor ebenfalls verfügbar
- Plus-Funktionen könnten über `APP_CONFIG.features[k].plus` + In-App-Kauf freigeschaltet werden

Vor einer Veröffentlichung nötig: Impressum, Datenschutzerklärung (`APP_CONFIG.links`), Prüfung der Medizinprodukte-Einordnung, Namensnennung Open Food Facts (ODbL).

## Qualität
- `node tests/rules.test.js` – Regeltests (läuft auch automatisch per GitHub Actions bei jedem Push, `.github/workflows/tests.yml`)
- `node tools/pruefliste.js` – erzeugt `docs/PRUEFLISTE.md` zur fachlichen Prüfung
- `rechtliches/` – Vorlagen für Impressum und Datenschutz (ausfüllen, prüfen lassen, in `config.js` unter `links` eintragen)
