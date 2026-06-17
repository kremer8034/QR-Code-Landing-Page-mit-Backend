'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Printer, QrCode, Pencil } from 'lucide-react';

interface Row {
  id: string;
  public_id: string;
  license_plate: string;
  name: string;
  active: boolean;
  group: string | null;
  groupColor: string | null;
}

export function VehicleListClient({ vehicles }: { vehicles: Row[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = selected.size === vehicles.length && vehicles.length > 0;
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(vehicles.map((v) => v.id)));
  };

  const printSelected = () => {
    if (selected.size === 0) return;
    const ids = [...selected].join(',');
    window.open(`/api/labels?ids=${ids}`, '_blank');
  };

  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 bg-gray-50">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4" />
          {selected.size > 0 ? `${selected.size} ausgewählt` : 'Alle auswählen'}
        </label>
        <button
          onClick={printSelected}
          disabled={selected.size === 0}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold btn-brand disabled:opacity-40"
        >
          <Printer size={16} /> Etiketten-PDF ({selected.size})
        </button>
      </div>

      <ul className="divide-y divide-gray-100">
        {vehicles.map((v) => (
          <li key={v.id} className="flex items-center gap-3 p-4 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selected.has(v.id)}
              onChange={() => toggle(v.id)}
              className="h-4 w-4"
            />
            <Link href={`/admin/vehicles/${v.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 truncate">
                  {v.license_plate || '(ohne Kennzeichen)'}
                </span>
                {!v.active ? (
                  <span className="text-xs rounded-full bg-gray-200 text-gray-600 px-2 py-0.5">inaktiv</span>
                ) : null}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {v.name}
                {v.group ? (
                  <span
                    className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs"
                    style={{ background: (v.groupColor ?? '#888') + '22', color: v.groupColor ?? '#666' }}
                  >
                    {v.group}
                  </span>
                ) : null}
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <a
                title="QR als PNG"
                href={`/api/qr/${v.public_id}?download=1`}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <QrCode size={18} />
              </a>
              <a
                title="Etikett-PDF"
                href={`/api/labels?ids=${v.id}`}
                target="_blank"
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <Download size={18} />
              </a>
              <Link
                title="Bearbeiten"
                href={`/admin/vehicles/${v.id}`}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <Pencil size={18} />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
