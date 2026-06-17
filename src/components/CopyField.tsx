'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Read-only field showing the full value with a one-click copy button. */
export function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for browsers without the async clipboard API.
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div>
      {label ? <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span> : null}
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-xl ring-1 ring-gray-300 px-3 py-2 text-sm text-gray-800 bg-gray-50 font-mono"
        />
        <button
          type="button"
          onClick={copy}
          title="Link kopieren"
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap bg-gray-900 text-white hover:bg-gray-700"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>
    </div>
  );
}
