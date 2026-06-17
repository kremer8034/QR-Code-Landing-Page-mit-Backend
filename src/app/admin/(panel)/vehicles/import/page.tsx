import { Alert, Button, Card, CardBody, Field, LinkButton, PageHeader } from '@/components/ui';
import { importVehicles } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <PageHeader title="Fahrzeuge importieren" subtitle="Excel- oder CSV-Datei hochladen" />

      {error ? (
        <div className="mb-4">
          <Alert kind="error">
            {error === 'nofile' ? 'Bitte eine Datei auswählen.' : 'Die Datei konnte nicht gelesen werden.'}
          </Alert>
        </div>
      ) : null}

      <Card className="max-w-2xl">
        <CardBody className="p-6 space-y-5">
          <Alert kind="info">
            Die erste Tabellenzeile muss Spaltenüberschriften enthalten. Erkannt werden (Groß-/Kleinschreibung egal):
            <br />
            <strong>Kennzeichen</strong>, <strong>Name</strong>, <strong>Gruppe</strong>, <strong>VIN</strong> (FIN),{' '}
            <strong>Notiz</strong>. Nicht vorhandene Gruppen werden automatisch angelegt. Für jedes Fahrzeug wird ein
            eindeutiger QR-Code erzeugt; Links können anschließend zugewiesen werden.
          </Alert>

          <form action={importVehicles} className="space-y-4">
            <Field label="Datei (.xlsx, .xls, .csv)">
              <input
                type="file"
                name="file"
                accept=".xlsx,.xls,.csv"
                required
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-gray-900 file:px-4 file:py-2.5 file:text-white"
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Importieren</Button>
              <LinkButton href="/admin/vehicles" variant="ghost">Abbrechen</LinkButton>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
