import { getSettings, themeStyle } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div style={themeStyle(settings) as React.CSSProperties} className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
}
