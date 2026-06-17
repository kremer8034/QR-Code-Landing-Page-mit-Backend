import { requireSession } from '@/lib/guard';
import { getSettings } from '@/lib/settings';
import { logoutAction } from '../auth-actions';
import { AdminNav } from './AdminNav';
import { Button } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const settings = await getSettings();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="lg:w-64 lg:fixed lg:inset-y-0 bg-white ring-1 ring-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt="" className="h-8 object-contain" />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
            >
              QR
            </div>
          )}
          <span className="font-bold text-gray-900 truncate">{settings.app_name}</span>
        </div>

        <AdminNav role={session.role} />

        <div className="mt-auto p-4 border-t border-gray-100">
          <div className="text-sm text-gray-600 mb-3 truncate">{session.name || session.email}</div>
          <form action={logoutAction}>
            <Button variant="ghost" className="w-full" type="submit">Abmelden</Button>
          </form>
        </div>
      </aside>

      <main className="lg:ml-64 flex-1 p-5 lg:p-8 max-w-6xl">{children}</main>
    </div>
  );
}
