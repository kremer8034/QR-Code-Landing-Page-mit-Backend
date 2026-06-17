import { redirect } from 'next/navigation';
import { getSession, countAdminUsers } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { isSupabaseConfigured } from '@/lib/supabase';
import { loginAction } from '../auth-actions';
import { Alert, Button, Card, CardBody, Field, Input } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardBody>
            <h1 className="text-xl font-bold mb-3">Konfiguration erforderlich</h1>
            <Alert kind="error">
              Die Datenbank ist noch nicht verbunden. Bitte setzen Sie die Umgebungsvariablen
              <code className="mx-1">SUPABASE_URL</code> und
              <code className="mx-1">SUPABASE_SERVICE_ROLE_KEY</code> und starten Sie die App neu.
            </Alert>
          </CardBody>
        </Card>
      </div>
    );
  }

  const session = await getSession();
  if (session) redirect('/admin');

  const users = await countAdminUsers().catch(() => -1);
  if (users === 0) redirect('/admin/setup');

  const settings = await getSettings();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardBody className="p-8">
          <div className="text-center mb-6">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt="" className="h-12 mx-auto mb-3 object-contain" />
            ) : null}
            <h1 className="text-2xl font-bold text-gray-900">{settings.app_name}</h1>
            <p className="text-gray-500">Backoffice-Anmeldung</p>
          </div>

          {error === 'invalid' ? (
            <div className="mb-4">
              <Alert kind="error">E-Mail oder Passwort ist ungültig.</Alert>
            </div>
          ) : null}

          <form action={loginAction} className="space-y-4">
            <Field label="E-Mail">
              <Input name="email" type="email" autoComplete="username" required />
            </Field>
            <Field label="Passwort">
              <Input name="password" type="password" autoComplete="current-password" required />
            </Field>
            <Button type="submit" className="w-full">Anmelden</Button>
          </form>

          {settings.oidc_enabled ? (
            <div className="mt-6">
              <div className="relative text-center text-xs text-gray-400 my-4">
                <span className="bg-white px-2 relative z-10">oder</span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
              </div>
              <a
                href="/admin/oidc/login"
                className="block w-full text-center rounded-xl px-4 py-2.5 font-semibold bg-gray-900 text-white hover:bg-gray-700"
              >
                {settings.oidc_button_label || 'Anmelden mit BRK.id'}
              </a>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
