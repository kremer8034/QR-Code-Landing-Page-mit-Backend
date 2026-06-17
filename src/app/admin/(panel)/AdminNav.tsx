'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  FolderTree,
  Link2,
  BarChart3,
  Settings,
} from 'lucide-react';

const items = [
  { href: '/admin', label: 'Übersicht', icon: LayoutDashboard, exact: true },
  { href: '/admin/vehicles', label: 'Fahrzeuge', icon: Car },
  { href: '/admin/groups', label: 'Gruppen', icon: FolderTree },
  { href: '/admin/links', label: 'Inhalte & Links', icon: Link2 },
  { href: '/admin/stats', label: 'Statistik', icon: BarChart3 },
  { href: '/admin/settings', label: 'Einstellungen', icon: Settings },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <nav className="p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
