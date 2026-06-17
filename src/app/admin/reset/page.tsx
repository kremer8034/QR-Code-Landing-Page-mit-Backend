import Link from 'next/link';
import { resetPasswordAction } from '../reset-actions';
import { Alert, Button, Card, CardBody, Field, Input } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  const expired = error === 'expired' || !token;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardBody className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Neues Passwort vergeben</h1>

          {expired ? (
            <>
              <div className="my-4">
                <Alert kind="error">
                  Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.
                </Alert>
              </div>
              <Link href="/admin/forgot" className="font-semibold" style={{ color: 'var(--brand)' }}>
                Neuen Link anfordern
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-6">Bitte vergeben Sie ein neues Passwort für Ihr Konto.</p>

              {error === 'weak' ? (
                <div className="mb-4"><Alert kind="error">Das Passwort muss mindestens 8 Zeichen lang sein.</Alert></div>
              ) : null}
              {error === 'mismatch' ? (
                <div className="mb-4"><Alert kind="error">Die Passwörter stimmen nicht überein.</Alert></div>
              ) : null}

              <form action={resetPasswordAction} className="space-y-4">
                <input type="hidden" name="token" value={token} />
                <Field label="Neues Passwort" hint="Mindestens 8 Zeichen.">
                  <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
                </Field>
                <Field label="Passwort wiederholen">
                  <Input name="password2" type="password" autoComplete="new-password" required minLength={8} />
                </Field>
                <Button type="submit" className="w-full">Passwort speichern</Button>
              </form>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
