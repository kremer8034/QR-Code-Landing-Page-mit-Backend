# Fuhrpark QR – QR-Code Landingpages & Backoffice

Eine Web-App für Kreisverbände/Unternehmen mit vielen Fahrzeugen: jedes Fahrzeug
erhält einen eindeutigen QR-Code. Wer ihn scannt, landet auf einer
mobil-optimierten Landingpage mit einer Link-Sammlung (z. B. digitaler
Fahrzeugcheck, Fahrtenbuch, Dienstanweisungen). Über ein geschütztes Backoffice
werden Fahrzeuge, Links, Gruppen, Design und Statistik verwaltet.

## Funktionsumfang

**Landingpage (öffentlich, ohne Anmeldung)**
- Eindeutige Seite pro Fahrzeug unter `/v/<id>`, Smartphone-optimiert.
- Fahrzeug klar erkennbar über das **KFZ-Kennzeichen**.
- Buttons mit Symbolen als Link-Sammlung.
- **Installierbar als Web-App** (PWA). Ein einziges Install genügt: Der stabile
  Einstieg `/app` öffnet immer das **zuletzt gescannte** Fahrzeug – ein neuer
  Scan aktualisiert den Inhalt automatisch, ohne erneutes Hinzufügen.

**Backoffice (`/admin`, nur mit Anmeldung)**
- Fahrzeuge anlegen, bearbeiten, löschen; eindeutige QR-Codes automatisch.
- **Excel-/CSV-Import** zum Massen-Anlegen von Fahrzeugen.
- **Zentrale Link-Bibliothek**: Ändert man einen Link, ändert er sich überall.
- Links platzieren: **global** (alle Landingpages), pro **Gruppe**
  (z. B. „Fahrzeug- und Servicedienste") oder pro **einzelnem Fahrzeug**.
- Symbole je Button: mitgelieferte Vorlagen **oder eigene Symbole hochladen**.
- **Download** des QR-Codes als **PNG** und **SVG**.
- **Etiketten-PDF** passend für **Brother DK-11209 (62 × 29 mm)**, mit Zusatztext
  („Hier scannen" o. ä.); bei Mehrfachauswahl ein PDF mit mehreren Seiten.
- **Corporate Identity**: Logo hochladen, Farben anpassen.
- **Statistik**: Aufrufe pro Fahrzeug inkl. Zeitstempel.
- **Benutzerverwaltung** mit Rollen (Administrator / Bearbeiter).
- **BRK.id (SSO via OpenID Connect)** – komplett im Backoffice konfigurierbar,
  jederzeit aktivierbar, ohne Code-Änderung.

## Technik

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** (PostgreSQL + Storage)
- Alle Datenbankzugriffe serverseitig über den Service-Role-Key; im Browser
  liegen keine Schlüssel. RLS ist auf allen Tabellen aktiv.
- Deploybar auf **Vercel** und als **Docker**-Container (self-hosted).

## Umgebungsvariablen

| Variable | Beschreibung |
| --- | --- |
| `SUPABASE_URL` | Supabase Projekt-URL, z. B. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-Role-Key (Supabase → Project Settings → API). Server-only. |
| `SESSION_SECRET` | Langer Zufallsstring zum Signieren der Session-Cookies (`openssl rand -hex 32`). |
| `APP_BASE_URL` | Optional: Fallback-Basis-URL für QR-Links (sonst im Backoffice setzen). |

## Erste Schritte

1. **Datenbank**: Das Schema liegt unter `supabase/schema.sql`. Es ist im
   verbundenen Supabase-Projekt bereits eingespielt. Für ein neues Projekt die
   Datei im Supabase SQL-Editor ausführen und die Storage-Buckets `branding`
   und `icons` (öffentlich) anlegen.
2. **Env** setzen (siehe `.env.example`).
3. Start lokal:
   ```bash
   npm install
   npm run dev
   ```
4. `/admin` öffnen → bei leerer Benutzertabelle erscheint die **Ersteinrichtung**
   zum Anlegen des ersten Administrators.
5. Unter **Einstellungen → Darstellung** die **Basis-URL für QR-Codes** auf die
   endgültige Domain setzen, **bevor** QR-Codes gedruckt werden.

## Deployment auf Vercel

1. Projekt importieren/deployen.
2. Unter **Settings → Environment Variables** die o. g. Variablen setzen.
3. Redeploy. Fertig.

> Die QR-Codes kodieren `<<Basis-URL>>/v/<id>`. Solange die Basis-URL stabil
> bleibt (eigene Domain empfohlen), bleiben alle gedruckten Codes gültig –
> auch wenn sich die Vercel-interne Adresse ändert.

## Deployment via Docker (eigene Webseite)

```bash
# .env mit SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET füllen
docker compose up -d --build
# App läuft auf http://localhost:3000 (hinter Reverse-Proxy mit HTTPS betreiben)
```

## BRK.id (SSO) einrichten

Die BRK.id unterstützt OpenID Connect (bevorzugt OIDC + PKCE). Anwendung über das
BRK-Hilfeformular registrieren; benötigt werden Anwendungsname, Anwendungs-URL,
**Redirect-URL** und technischer Ansprechpartner. Als Redirect-URL eintragen:

```
https://<ihre-domain>/admin/oidc/callback
```

Anschließend im Backoffice unter **Einstellungen → BRK.id / SSO** Issuer,
Client-ID/Secret und Scopes eintragen und die Anmeldung aktivieren. Bis dahin
funktioniert die klassische Anmeldung mit E-Mail und Passwort.
