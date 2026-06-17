import Link from 'next/link';
import { getSettings } from '@/lib/settings';
import { forgotPasswordAction } from '../reset-actions';
import { Alert, Button, Card, CardBody, Field, Input } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  const settings = await getSettings();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardBody className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Passwort vergessen</h1>
          <p className="text-gray-500 mb-6">
            Geben Sie Ihre E-Mail-Adresse ein. Wenn ein Konto existiert, senden wir Ihnen einen Link zum
            Zurücksetzen.
          </p>

          {sent ? (
            <div className="mb-4">
              <Alert kind="success">
                Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit einem Link zum Zurücksetzen
                versendet. Bitte prüfen Sie Ihr Postfach (auch den Spam-Ordner).
              </Alert>
            </div>
          ) : (
            <form action={forgotPasswordAction} className="space-y-4">
              <Field label="E-Mail">
                <Input name="email" type="email" autoComplete="username" required />
              </Field>
              <Button type="submit" className="w-full">Link anfordern</Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/admin/login" className="text-sm text-gray-500 hover:text-gray-700">
              Zurück zur Anmeldung
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
