# Kompass – lokale Nachrichtenseite (statisch, ohne Backend)

## Veröffentlichen auf GitHub Pages
Variante A (empfohlen, mit Workflow):
  1. Projekt in ein GitHub-Repo pushen (Branch "main").
  2. Settings -> Pages -> Source: "GitHub Actions".
  3. Bei jedem Push baut .github/workflows/pages.yml die Artikelliste und veröffentlicht die Seite.

Variante B (ohne Workflow):
  Settings -> Pages -> "Deploy from a branch" -> main / root.
  Die Seite findet die Artikelordner dann selbst über die GitHub-API (Owner/Repo werden aus der URL erkannt).

## Neuer Artikel (alles direkt im Browser auf github.com möglich)
  1. Ordner in src/articles/ anlegen, z. B. 2026-12-01-mein-artikel/
  2. tags.json   {"categories": ["aktuelles"], "date": "2026-12-01"}
     (Kategorien: aktuelles, politik-arbeit, sport-kultur, veranstaltungen)
  3. content.md  "# Titel", dann Text; Bilder mit ![Alt](bild.jpg) - das erste Bild wird Titelbild
  4. Bilder in denselben Ordner hochladen, committen - fertig.

## Lokal testen (optional)
  python3 -m http.server   ->  http://localhost:8000

Instagram-Link, Kontaktdaten, Kategorien: oben in src/js/app.js (CONFIG).
Die 11 Artikel in src/articles/ sind Beispielinhalte.
