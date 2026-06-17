# Fuhrpark QR – QR-Code Landingpages & Backoffice

Eine Web-App für Kreisverbände/Unternehmen mit vielen Fahrzeugen: jedes Fahrzeug
erhält einen eindeutigen QR-Code. Wer ihn mit dem Smartphone scannt, landet auf
einer mobil-optimierten Landingpage mit nützlichen Inhalten (z. B. digitaler
Fahrzeugcheck, Fahrtenbuch, Dienstanweisungen, Telefonnummern, Dokumente). Über
ein geschütztes Backoffice werden Fahrzeuge, Inhalte, Gruppen, Design und
Statistik verwaltet.

---

## Funktionsumfang

### Landingpage (öffentlich, ohne Anmeldung)
- Eindeutige Seite pro Fahrzeug unter `/v/<id>`, für Smartphones optimiert.
- Fahrzeug klar erkennbar über das **KFZ-Kennzeichen**.
- Tappbare Buttons und Inhalte mit Symbolen.
- **Installierbar als Web-App** (PWA). Eine einzige Installation genügt: Der
  stabile Einstieg `/app` öffnet immer das **zuletzt gescannte** Fahrzeug – ein
  neuer Scan aktualisiert den Inhalt automatisch, ohne erneutes Hinzufügen.
- Kein Login nötig – jede Person mit Smartphone kann die Seite öffnen.

### Inhaltstypen
Jedes Inhalts-Element hat einen Typ, der Eingabe und Darstellung steuert:

| Typ | Verhalten auf der Web-App |
| --- | --- |
| **Link** | Öffnet eine Webseite (neuer Tab) |
| **PDF-Dokument** | Upload im Backoffice → eingebettete Inline-Vorschau (ohne Download-Button) |
| **Telefonnummer** | Öffnet die Telefon-App und startet den Anruf (`tel:`) |
| **E-Mail-Adresse** | Öffnet die Mail-App (`mailto:`) |
| **Adresse / Navigation** | Öffnet die Karten-/Navigations-App des Geräts |
| **Info-Text** | Wird ohne Klick direkt als Infokarte angezeigt |
| **Bild** | Wird inline auf der Landingpage dargestellt |

### Backoffice (`/admin`, nur mit Anmeldung)
- **Fahrzeuge** anlegen, bearbeiten, löschen; eindeutige QR-Codes automatisch.
- **Excel-/CSV-Import** zum Massen-Anlegen von Fahrzeugen (Spalten: Kennzeichen,
  Name, Gruppe, VIN/FIN, Notiz; fehlende Gruppen werden automatisch angelegt).
- **Zentrale Inhalts-Bibliothek**: Ein Element ändern → wirkt sofort überall.
- Inhalte platzieren: **global** (alle Landingpages), pro **Gruppe**
  (z. B. „Fahrzeug- und Servicedienste") oder pro **einzelnem Fahrzeug**
  (suchbarer Fahrzeug-Picker, ausgelegt für große Fuhrparks).
- **Reihenfolge** der Inhalte: globale Standard-Reihenfolge sowie **pro Gruppe
  separat** einstellbar.
- **Symbole**: mitgelieferte Vorlagen **oder eigene Symbole hochladen**.
- **QR-Download** als **PNG** und **SVG**; kopierbare vollständige Landingpage-URL.
- **Etiketten-PDF** für **Brother DK-11209 (62 × 29 mm)** mit Zusatztext
  („Hier scannen" o. ä.); bei Mehrfachauswahl ein PDF mit mehreren Seiten.
- **Corporate Identity**: Logo hochladen, Farben anpassen.
- **Statistik**: Aufrufe pro Fahrzeug inkl. Zeitstempel.
- **Benutzerverwaltung** mit Rollen (Administrator / Bearbeiter).
- **Passwort vergessen**: Self-Service-Reset per E-Mail (zeitlich begrenzter,
  einmaliger Link).
- **BRK.id (SSO via OpenID Connect)** – komplett im Backoffice konfigurierbar,
  jederzeit aktivierbar, ohne Code-Änderung.

---

## Technik

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** (PostgreSQL + Storage)
- **nodemailer** (E-Mail-Versand), **pdf-lib** (Etiketten), **qrcode**,
  **openid-client** (BRK.id), **xlsx** (Import)
- Deploybar auf **Vercel** und als **Docker**-Container (self-hosted, `output: standalone`)

### Rollen
- **Administrator**: voller Zugriff inkl. Benutzer, SSO und E-Mail-Einstellungen.
- **Bearbeiter**: Fahrzeuge, Inhalte, Gruppen, Darstellung und Symbole; **kein**
  Zugriff auf Benutzer-, SSO- und E-Mail-Einstellungen.

---

## Sicherheit

- **Keine Schlüssel im Browser.** Alle Datenbankzugriffe laufen serverseitig
  über den Supabase-Service-Role-Key. Auf allen Tabellen ist **Row Level
  Security** aktiv (ohne Policies) – mit dem öffentlichen Anon-Key ist kein
  Zugriff möglich.
- **Sessions** als signierte, httpOnly-Cookies (JWT, 7 Tage). Jeder geschützte
  Aufruf wird **gegen die Datenbank geprüft**: gelöschte/deaktivierte Konten und
  Rollenänderungen wirken sofort, ohne auf den Token-Ablauf zu warten.
- **Passwörter** werden mit scrypt + Salt gehasht (keine native Abhängigkeit).
- **Passwort-Reset-Tokens** werden nur als SHA-256-Hash gespeichert, sind
  1 Stunde gültig und einmal verwendbar; die „Passwort vergessen"-Funktion
  verrät nicht, ob eine E-Mail existiert.
- **Eingabevalidierung**: Link-URLs werden auf `http(s)` beschränkt (gefährliche
  Schemata wie `javascript:` werden abgelehnt); Such- und ID-Parameter sind
  gegen Filter-Injection abgesichert.
- **Datei-Uploads** werden serverseitig in einen **privaten** Storage-Bucket
  geladen und ausschließlich über die App ausgeliefert.
- **Datenschutz**: Bei Scans wird nur ein gesalzener Hash der IP gespeichert,
  keine Roh-IP.
- Geheimnisse (OIDC Client Secret, SMTP-Passwort) werden **nie** ins HTML
  gerendert; ein leeres Feld behält den gespeicherten Wert.

> Hinweis: Die Landingpages sind bewusst ohne Anmeldung erreichbar. Hochgeladene
> Dokumente liegen daher unter einer nicht erratbaren, aber öffentlich
> abrufbaren URL. Für wirklich vertrauliche Dokumente ist das nicht geeignet.

---

## Umgebungsvariablen

| Variable | Beschreibung |
| --- | --- |
| `SUPABASE_URL` | Supabase Projekt-URL, z. B. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-Role-Key (Supabase → Project Settings → API). **Server-only.** |
| `SESSION_SECRET` | Langer Zufallsstring zum Signieren der Session-Cookies (`openssl rand -hex 32`). |
| `APP_BASE_URL` | Optional: Fallback-Basis-URL für QR-Links (sonst im Backoffice setzen). |

Siehe `.env.example`.

---

## Erste Schritte (lokal)

1. **Datenbank**: Schema unter `supabase/schema.sql` im Supabase SQL-Editor
   ausführen und die Storage-Buckets anlegen:
   - `branding` (öffentlich) – Logo
   - `icons` (öffentlich) – eigene Symbole
   - `content` (privat) – hochgeladene PDFs/Bilder
   (Die SQL-Befehle dafür stehen als Kommentar am Ende von `schema.sql`.)
2. **Env** setzen (siehe `.env.example`).
3. Starten:
   ```bash
   npm install
   npm run dev
   ```
4. `/admin` öffnen → bei leerer Benutzertabelle erscheint die **Ersteinrichtung**
   zum Anlegen des ersten Administrators.
5. Unter **Einstellungen → Darstellung** die **Basis-URL für QR-Codes** auf die
   endgültige Domain setzen, **bevor** QR-Codes gedruckt werden.

---

## Deployment auf Vercel

1. GitHub-Repo in Vercel importieren.
2. Unter **Settings → Environment Variables** die o. g. Variablen setzen.
3. Deploy. Künftige Pushes deployen automatisch.

> Die QR-Codes kodieren `<Basis-URL>/v/<id>`. Solange die Basis-URL stabil bleibt
> (eigene Domain empfohlen), bleiben alle gedruckten Codes gültig – auch wenn
> sich die Vercel-interne Adresse ändert.

### Upload-Größenlimit (wichtig)
Server-seitige Anfragen sind auf Vercel auf ca. **4,5 MB** begrenzt. Deshalb:
- **Bilder** werden vor dem Upload **im Browser komprimiert** (max. 1600 px,
  JPEG) – große Fotos funktionieren damit problemlos.
- **PDFs** bis ca. 4 MB werden akzeptiert; größere Dateien werden mit einer
  klaren Meldung abgelehnt. (Bei Bedarf lässt sich ein Direkt-Upload
  Browser→Supabase ergänzen, der diese Grenze aufhebt.)

---

## Deployment via Docker (eigene Webseite)

```bash
# .env mit SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET füllen
docker compose up -d --build
# App läuft auf http://localhost:3000 – hinter einem Reverse-Proxy mit HTTPS betreiben
```

Im Container greift das o. g. 4,5-MB-Limit nicht; dort sind größere Uploads
grundsätzlich möglich (begrenzt durch Storage- und Proxy-Konfiguration).

---

## E-Mail (Passwort vergessen)

Unter **Einstellungen → E-Mail** ein SMTP-Postfach hinterlegen (Host, Port,
SSL/TLS, Benutzer, Passwort, Absender). Mit „Test senden" lässt sich der Versand
prüfen. Erst danach funktioniert „Passwort vergessen" (`/admin/forgot`).
- Port **465** → „SSL/TLS" aktivieren.
- Port **587** (STARTTLS) → „SSL/TLS" deaktiviert lassen.

---

## BRK.id (SSO) einrichten

Die BRK.id unterstützt OpenID Connect (bevorzugt OIDC + PKCE). Anwendung über das
BRK-Hilfeformular registrieren; benötigt werden Anwendungsname, Anwendungs-URL,
**Redirect-URL** und technischer Ansprechpartner. Als Redirect-URL eintragen:

```
https://<ihre-domain>/admin/oidc/callback
```

Anschließend im Backoffice unter **Einstellungen → BRK.id / SSO** Issuer,
Client-ID/Secret und Scopes eintragen und die Anmeldung aktivieren. Optional
können neue Backoffice-Benutzer bei erster SSO-Anmeldung automatisch angelegt
werden (eingeschränkt auf erlaubte E-Mail-Domains). Bis zur Aktivierung
funktioniert die klassische Anmeldung mit E-Mail und Passwort.

---

## Projektstruktur

```
src/
  app/
    v/[publicId]/            Öffentliche Fahrzeug-Landingpage (+ PDF-Viewer)
    app/                     Stabiler PWA-Einstieg (zuletzt gescanntes Fahrzeug)
    admin/                   Backoffice (Login, Setup, Passwort-Reset, OIDC)
      (panel)/               Geschützte Bereiche: Übersicht, Fahrzeuge, Gruppen,
                             Inhalte & Links, Statistik, Einstellungen
    api/                     QR-Bild, Etiketten-PDF, Inhalts-Streaming, Scan, Icon
    manifest.webmanifest/    Dynamisches PWA-Manifest
  components/                UI-Bausteine, Icon, IconPicker, VehiclePicker, …
  lib/                       supabase, auth, guard, settings, queries, content,
                             qr, labels, mailer, oidc, validate, ids
supabase/schema.sql          Datenbankschema (für neue Projekte)
Dockerfile, docker-compose.yml
```

---

## Datenmodell (Kurzüberblick)

- `settings` – globale Einstellungen (Branding, QR-Basis-URL, OIDC, SMTP, Etikett)
- `admin_users` – Backoffice-Benutzer (lokal und/oder SSO), Rollen, Reset-Token
- `groups` – Fahrzeuggruppen
- `vehicles` – Fahrzeuge (mit stabilem `public_id` für den QR-Code)
- `links` – Inhalts-Elemente (typisiert) inkl. globaler Reihenfolge
- `link_placements` – Zuordnung global / Gruppe / Fahrzeug
- `group_link_order` – Reihenfolge der Inhalte pro Gruppe
- `icons` – eigene Symbole
- `scans` – Aufrufe/Analytics (mit gehashter IP)
