'use client';

import { useState } from 'react';
import { icons as lucideIcons } from 'lucide-react';

interface Template { key: string; label: string }
interface CustomIcon { value: string; url: string; name: string }

function Preview({ value }: { value: string }) {
  if (value.startsWith('custom:')) return null;
  const name = value.replace('lucide:', '');
  const Cmp = (lucideIcons as Record<string, React.ComponentType<{ size?: number }>>)[name] ?? lucideIcons.Link;
  return <Cmp size={22} />;
}

export function IconPicker({
  name,
  defaultValue = 'lucide:Link',
  templates,
  customIcons,
}: {
  name: string;
  defaultValue?: string;
  templates: Template[];
  customIcons: CustomIcon[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const customSelected = customIcons.find((c) => `custom:${c.value}` === value);

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-xl ring-1 ring-gray-300 px-3.5 py-2.5 w-full text-left"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}>
          {customSelected ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={customSelected.url} alt="" width={22} height={22} style={{ objectFit: 'contain' }} />
          ) : (
            <Preview value={value} />
          )}
        </span>
        <span className="text-sm text-gray-600">Symbol wählen …</span>
      </button>

      {open ? (
        <div className="mt-2 rounded-xl ring-1 ring-gray-200 p-3 bg-white max-h-72 overflow-y-auto">
          {customIcons.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Eigene Symbole</div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-4">
                {customIcons.map((c) => {
                  const v = `custom:${c.value}`;
                  return (
                    <button
                      type="button"
                      key={c.value}
                      title={c.name}
                      onClick={() => { setValue(v); setOpen(false); }}
                      className={`flex items-center justify-center h-10 rounded-lg ring-1 ${value === v ? 'ring-gray-900 bg-gray-100' : 'ring-gray-200'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.url} alt="" width={22} height={22} style={{ objectFit: 'contain' }} />
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Vorlagen</div>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {templates.map((t) => {
              const v = `lucide:${t.key}`;
              const Cmp = (lucideIcons as Record<string, React.ComponentType<{ size?: number }>>)[t.key] ?? lucideIcons.Link;
              return (
                <button
                  type="button"
                  key={t.key}
                  title={t.label}
                  onClick={() => { setValue(v); setOpen(false); }}
                  className={`flex items-center justify-center h-10 rounded-lg ring-1 ${value === v ? 'ring-gray-900 bg-gray-100' : 'ring-gray-200'}`}
                >
                  <Cmp size={20} />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
