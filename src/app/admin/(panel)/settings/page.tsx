import Link from 'next/link';
import { getSupabaseAdmin, supabasePublicUrl } from '@/lib/supabase';
import { getSettings } from '@/lib/settings';
import { requireSession } from '@/lib/guard';
import { Alert, Button, Card, CardBody, Field, Input, PageHeader, Select } from '@/components/ui';
import {
  updateBranding, updateOidc, updateSmtp, sendTestEmail, createUser, deleteUser, resetUserPassword, uploadIcon, deleteIcon,
} from './actions';
import type { AdminUser, IconItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TABS: { key: string; label: string; adminOnly?: boolean }[] = [
  { key: 'branding', label: 'Darstellung' },
  { key: 'email', label: 'E-Mail', adminOnly: true },
  { key: 'sso', label: 'BRK.id / SSO', adminOnly: true },
  { key: 'users', label: 'Benutzer', adminOnly: true },
  { key: 'icons', label: 'Symbole' },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const session = await requireSession();
  const isAdmin = session.role === 'admin';
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);
  const requestedTab = sp.tab ?? 'branding';
  // Non-admins may only see non-admin tabs.
  const tab = visibleTabs.some((t) => t.key === requestedTab) ? requestedTab : 'branding';
  const settings = await getSettings();
  const supabase = getSupabaseAdmin();

  // Only admins see the user list; editors never receive it.
  const userList = isAdmin
    ? (((await supabase.from('admin_users').select('*').order('created_at')).data as AdminUser[]) ?? [])
    : [];
  const { data: icons } = await supabase.from('icons').select('*').order('created_at', { ascending: false });
  const iconList = (icons as IconItem[]) ?? [];

  return (
    <div>
      <PageHeader title="Einstellungen" />

      {sp.saved === 'testmail' ? <div className="mb-4"><Alert kind="success">Testnachricht wurde versendet.</Alert></div> : null}
      {sp.saved && sp.saved !== 'testmail' ? <div className="mb-4"><Alert kind="success">Gespeichert.</Alert></div> : null}
      {sp.error === 'testmail' ? <div className="mb-4"><Alert kind="error">Testnachricht konnte nicht gesendet werden. Bitte SMTP-Einstellungen prüfen.</Alert></div> : null}
      {sp.error === 'userexists' ? <div className="mb-4"><Alert kind="error">Diese E-Mail existiert bereits.</Alert></div> : null}
      {sp.error === 'user' ? <div className="mb-4"><Alert kind="error">Bitte gültige E-Mail und Passwort (min. 8 Zeichen) angeben.</Alert></div> : null}

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {visibleTabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/settings?tab=${t.key}`}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === t.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'branding' ? (
        <Card className="max-w-2xl">
          <CardBody className="p-6">
            <form action={updateBranding} className="space-y-5">
              <Field label="App-Name">
                <Input name="app_name" defaultValue={settings.app_name} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Primärfarbe" hint="Buttons, Hervorhebungen">
                  <input type="color" name="primary_color" defaultValue={settings.primary_color} className="h-10 w-24 rounded-lg ring-1 ring-gray-300" />
                </Field>
                <Field label="Akzentfarbe">
                  <input type="color" name="accent_color" defaultValue={settings.accent_color} className="h-10 w-24 rounded-lg ring-1 ring-gray-300" />
                </Field>
              </div>

              <Field label="Logo" hint="PNG/JPG. Erscheint im Backoffice, auf Landingpages und Etiketten.">
                {settings.logo_url ? (
                  <div className="flex items-center gap-3 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.logo_url} alt="" className="h-12 object-contain ring-1 ring-gray-200 rounded-lg p-1" />
                    <label className="flex items-center gap-2 text-sm text-red-600">
                      <input type="checkbox" name="remove_logo" className="h-4 w-4" /> entfernen
                    </label>
                  </div>
                ) : null}
                <input type="file" name="logo" accept="image/*" className="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-gray-900 file:px-4 file:py-2.5 file:text-white" />
              </Field>

              <hr className="border-gray-100" />
              <h3 className="font-semibold text-gray-900">QR-Code &amp; Etikett</h3>

              <Field label="Basis-URL für QR-Codes" hint="z. B. https://qr.kv-musterstadt.de — wird in die QR-Codes kodiert. Wichtig: vor dem Druck festlegen, damit gedruckte Codes stabil bleiben. Leer = aktuelle Adresse.">
                <Input name="qr_base_url" defaultValue={settings.qr_base_url ?? ''} placeholder="https://…" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Etikett-Überschrift (Standard)">
                  <Input name="label_headline" defaultValue={settings.label_headline} />
                </Field>
                <Field label="Etikett-Text (Aufruf)">
                  <Input name="label_subtext" defaultValue={settings.label_subtext} placeholder="Hier scannen" />
                </Field>
              </div>

              <Button type="submit">Speichern</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {tab === 'email' ? (
        <Card className="max-w-2xl">
          <CardBody className="p-6">
            <div className="mb-4">
              <Alert kind="info">
                Hinterlegen Sie hier ein SMTP-Postfach (z. B. das von Ihnen bereitgestellte E-Mail-Konto).
                Es wird für den Versand von <strong>„Passwort vergessen"</strong>-E-Mails verwendet. Für Port 465
                „SSL/TLS" aktivieren, für Port 587 (STARTTLS) deaktiviert lassen.
              </Alert>
            </div>
            <form action={updateSmtp} className="space-y-4">
              <Field label="SMTP-Server (Host)">
                <Input name="smtp_host" defaultValue={settings.smtp_host ?? ''} placeholder="z. B. mail.ihre-domain.de" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Port">
                  <Input name="smtp_port" type="number" defaultValue={String(settings.smtp_port ?? 587)} />
                </Field>
                <Field label="Verschlüsselung">
                  <label className="flex items-center gap-2 mt-2.5">
                    <input type="checkbox" name="smtp_secure" defaultChecked={settings.smtp_secure} className="h-4 w-4" />
                    <span className="text-sm text-gray-700">SSL/TLS (Port 465)</span>
                  </label>
                </Field>
              </div>
              <Field label="Benutzername">
                <Input name="smtp_user" defaultValue={settings.smtp_user ?? ''} autoComplete="off" placeholder="meist die E-Mail-Adresse" />
              </Field>
              <Field label="Passwort" hint={settings.smtp_password ? 'Ein Passwort ist gespeichert. Feld leer lassen, um es beizubehalten.' : undefined}>
                <Input name="smtp_password" type="password" autoComplete="new-password" placeholder={settings.smtp_password ? '•••••••• (gespeichert)' : 'SMTP-Passwort'} />
                {settings.smtp_password ? (
                  <label className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                    <input type="checkbox" name="smtp_clear_password" className="h-3.5 w-3.5" /> gespeichertes Passwort entfernen
                  </label>
                ) : null}
              </Field>
              <Field label="Absender-Adresse (From)" hint='z. B. "Fuhrpark QR <noreply@ihre-domain.de>"'>
                <Input name="smtp_from" defaultValue={settings.smtp_from ?? ''} placeholder="noreply@ihre-domain.de" />
              </Field>
              <Button type="submit">SMTP-Einstellungen speichern</Button>
            </form>

            <hr className="border-gray-100 my-6" />
            <h3 className="font-semibold text-gray-900 mb-2">Testnachricht senden</h3>
            <form action={sendTestEmail} className="flex flex-col sm:flex-row gap-2">
              <Input name="to" type="email" placeholder={session.email} className="flex-1" />
              <Button type="submit" variant="ghost">Test senden</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {tab === 'sso' ? (
        <Card className="max-w-2xl">
          <CardBody className="p-6">
            <div className="mb-4">
              <Alert kind="info">
                Die BRK.id unterstützt OpenID Connect (bevorzugt OIDC mit PKCE). Tragen Sie hier die Daten ein,
                die Sie bei der Registrierung Ihrer Anwendung über das BRK-Hilfeformular erhalten. Als
                <strong> Redirect-URL</strong> geben Sie dort an:
                <code className="block mt-1 bg-white px-2 py-1 rounded">[Ihre-Adresse]/admin/oidc/callback</code>
                Die Anmeldung lässt sich jederzeit aktivieren/deaktivieren, ohne den Code zu ändern.
              </Alert>
            </div>
            <form action={updateOidc} className="space-y-4">
              <label className="flex items-center gap-2 font-medium">
                <input type="checkbox" name="oidc_enabled" defaultChecked={settings.oidc_enabled} className="h-4 w-4" />
                BRK.id-Anmeldung aktivieren
              </label>
              <Field label="Issuer / Discovery-URL" hint="z. B. https://id.brk.de (OIDC .well-known wird automatisch geladen)">
                <Input name="oidc_issuer" defaultValue={settings.oidc_issuer ?? ''} placeholder="https://…" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Client ID">
                  <Input name="oidc_client_id" defaultValue={settings.oidc_client_id ?? ''} />
                </Field>
                <Field label="Client Secret" hint={settings.oidc_client_secret ? 'Ein Secret ist gespeichert. Feld leer lassen, um es beizubehalten.' : undefined}>
                  <Input name="oidc_client_secret" type="password" autoComplete="new-password" placeholder={settings.oidc_client_secret ? '•••••••• (gespeichert)' : 'Client Secret'} />
                  {settings.oidc_client_secret ? (
                    <label className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                      <input type="checkbox" name="oidc_clear_secret" className="h-3.5 w-3.5" /> gespeichertes Secret entfernen
                    </label>
                  ) : null}
                </Field>
              </div>
              <Field label="Scopes">
                <Input name="oidc_scopes" defaultValue={settings.oidc_scopes} />
              </Field>
              <Field label="Button-Beschriftung">
                <Input name="oidc_button_label" defaultValue={settings.oidc_button_label} />
              </Field>
              <hr className="border-gray-100" />
              <label className="flex items-center gap-2 font-medium">
                <input type="checkbox" name="oidc_auto_create" defaultChecked={settings.oidc_auto_create} className="h-4 w-4" />
                Neue Backoffice-Benutzer bei erster Anmeldung automatisch anlegen
              </label>
              <Field label="Erlaubte E-Mail-Domains für Auto-Anlage" hint="Kommagetrennt, z. B. brk.de,kv-musterstadt.de. Leer = alle.">
                <Input name="oidc_allowed_domains" defaultValue={settings.oidc_allowed_domains ?? ''} />
              </Field>
              <Button type="submit">SSO-Einstellungen speichern</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {tab === 'users' ? (
        <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
          <Card className="h-fit">
            <CardBody className="p-6">
              <h2 className="font-bold text-gray-900 mb-4">Neuer Benutzer</h2>
              <form action={createUser} className="space-y-4">
                <Field label="Name"><Input name="name" /></Field>
                <Field label="E-Mail"><Input name="email" type="email" required /></Field>
                <Field label="Rolle">
                  <Select name="role" defaultValue="editor">
                    <option value="editor">Bearbeiter</option>
                    <option value="admin">Administrator</option>
                  </Select>
                </Field>
                <Field label="Passwort" hint="Mindestens 8 Zeichen."><Input name="password" type="password" required minLength={8} /></Field>
                <Button type="submit">Benutzer anlegen</Button>
              </form>
            </CardBody>
          </Card>

          <div className="space-y-3">
            {userList.map((u) => (
              <Card key={u.id}>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{u.name || u.email}</div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                    </div>
                    <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5">{u.role}{u.provider === 'oidc' ? ' · SSO' : ''}</span>
                  </div>
                  <details className="mt-3">
                    <summary className="text-sm text-gray-500 cursor-pointer">Verwalten</summary>
                    <form action={resetUserPassword} className="mt-3 flex gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <Input name="password" type="password" placeholder="Neues Passwort" minLength={8} />
                      <Button type="submit" variant="ghost">Setzen</Button>
                    </form>
                    {u.id !== session.id ? (
                      <form action={deleteUser} className="mt-2">
                        <input type="hidden" name="id" value={u.id} />
                        <button className="text-sm text-red-600 hover:underline">Benutzer löschen</button>
                      </form>
                    ) : <p className="text-xs text-gray-400 mt-2">(Ihr eigenes Konto)</p>}
                  </details>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'icons' ? (
        <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
          <Card className="h-fit">
            <CardBody className="p-6">
              <h2 className="font-bold text-gray-900 mb-1">Eigenes Symbol hochladen</h2>
              <p className="text-sm text-gray-500 mb-4">PNG/SVG, am besten quadratisch. Danach in jedem Link wählbar.</p>
              <form action={uploadIcon} className="space-y-4">
                <Field label="Bezeichnung"><Input name="icon_name" placeholder="z. B. Wappen" /></Field>
                <Field label="Datei">
                  <input type="file" name="icon_file" accept="image/*,.svg" required className="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-gray-900 file:px-4 file:py-2.5 file:text-white" />
                </Field>
                <Button type="submit">Hochladen</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h2 className="font-bold text-gray-900 mb-4">Eigene Symbole</h2>
              {iconList.length === 0 ? (
                <p className="text-sm text-gray-500">Noch keine eigenen Symbole.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {iconList.map((i) => (
                    <div key={i.id} className="text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={supabasePublicUrl('icons', i.storage_path)} alt={i.name} className="h-12 w-12 mx-auto object-contain ring-1 ring-gray-200 rounded-lg p-1" />
                      <div className="text-xs text-gray-500 truncate mt-1">{i.name}</div>
                      <form action={deleteIcon}>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="path" value={i.storage_path} />
                        <button className="text-xs text-red-600 hover:underline">löschen</button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
