export default function VehicleNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900">Fahrzeug nicht gefunden</h1>
      <p className="max-w-sm text-gray-600">
        Dieser QR-Code ist ungültig oder das Fahrzeug wurde entfernt. Bitte wenden Sie sich an die
        Fuhrpark-Verwaltung.
      </p>
    </main>
  );
}
