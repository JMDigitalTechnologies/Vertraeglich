# Neue Version veröffentlichen

1. In `index.html` `APP_VERSION` um 1 erhöhen und die `?v=`-Nummern der drei Skripte auf denselben Wert setzen.
2. In `version.json` denselben Wert eintragen.
   (Die Skripte sind config.js, data.js, engine.js, app.js, features.js.)
3. Committen und pushen. Geöffnete Apps laden die neue Version beim nächsten Öffnen automatisch.
