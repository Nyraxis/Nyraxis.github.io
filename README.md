# Kompass – lokale Nachrichtenseite

Start (lokaler Server nötig, wegen fetch):
    python3 -m http.server   ->  http://localhost:8000

Neuer Artikel:
  1. Ordner in src/articles/ anlegen, z. B. 2026-12-01-mein-artikel/
  2. tags.json   {"categories": ["aktuelles"], "date": "2026-12-01"}
     (Kategorien: aktuelles, politik-arbeit, sport-kultur, veranstaltungen)
  3. content.md  "# Titel", dann Text; Bilder mit ![Alt](bild.jpg) - das erste Bild wird Titelbild
  4. Bilder in denselben Ordner legen
  5. node tools/build-index.js   (aktualisiert src/articles/index.json)

Instagram-Link, Kontaktdaten und Kategorien: oben in src/js/app.js (CONFIG).
Die 11 Artikel in src/articles/ sind Beispielinhalte.
