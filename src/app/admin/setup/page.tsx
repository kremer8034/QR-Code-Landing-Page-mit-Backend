import { redirect } from 'next/navigation';
import { countAdminUsers } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { setupAction } from '../auth-actions';
import { Alert, Button, Card, CardBody, Field, Input } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!isSupabaseConfigured()) redirect('/admin/login');

  const users = await countAdminUsers().catch(() => -1);
  if (users > 0) redirect('/admin/login');

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardBody className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Ersteinrichtung</h1>
          <p className="text-gray-500 mb-6">Legen Sie das erste Administrator-Konto an.</p>

          {error === 'weak' ? (
            <div className="mb-4">
              <Alert kind="error">Bitte E-Mail angeben und ein Passwort mit mindestens 8 Zeichen.</Alert>
            </div>
          ) : null}
          {error === 'failed' ? (
            <div className="mb-4">
              <Alert kind="error">Konto konnte nicht angelegt werden. Existiert die E-Mail bereits?</Alert>
            </div>
          ) : null}

          <form action={setupAction} className="space-y-4">
            <Field label="Name">
              <Input name="name" type="text" autoComplete="name" />
            </Field>
            <Field label="E-Mail">
              <Input name="email" type="email" autoComplete="username" required />
            </Field>
            <Field label="Passwort" hint="Mindestens 8 Zeichen.">
              <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
            </Field>
            <Button type="submit" className="w-full">Konto anlegen &amp; anmelden</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
