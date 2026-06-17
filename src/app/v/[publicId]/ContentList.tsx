import { Icon } from '@/components/Icon';
import { contentHref } from '@/lib/content';
import type { ResolvedLink } from '@/lib/types';

function Button({
  href,
  icon,
  label,
  description,
  newTab,
}: {
  href: string;
  icon: string;
  label: string;
  description?: string;
  newTab?: boolean;
}) {
  return (
    <a
      href={href}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex items-center gap-4 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 px-4 py-4 active:scale-[0.99] transition-transform"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
      >
        <Icon icon={icon} size={24} />
      </span>
      <span className="flex flex-col text-left min-w-0">
        <span className="font-semibold text-gray-900 break-words">{label}</span>
        {description ? <span className="text-sm text-gray-500 break-words">{description}</span> : null}
      </span>
    </a>
  );
}

export function ContentList({ items, publicId }: { items: ResolvedLink[]; publicId: string }) {
  if (items.length === 0) {
    return (
      <p className="text-center text-gray-500 py-10">
        Für dieses Fahrzeug sind noch keine Inhalte hinterlegt.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ link }) => {
        // Inline info text block (no click).
        if (link.type === 'text') {
          return (
            <div key={link.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 px-4 py-4">
              {link.label ? (
                <div className="flex items-center gap-2 mb-1.5 font-semibold text-gray-900">
                  <span style={{ color: 'var(--brand)' }}><Icon icon={link.icon} size={18} /></span>
                  {link.label}
                </div>
              ) : null}
              {link.body ? <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{link.body}</p> : null}
            </div>
          );
        }

        // Inline image.
        if (link.type === 'image') {
          if (!link.storage_path) return null;
          return (
            <figure key={link.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/content/${link.id}`} alt={link.label || ''} className="w-full h-auto block" />
              {link.label ? <figcaption className="px-4 py-2 text-sm text-gray-600">{link.label}</figcaption> : null}
            </figure>
          );
        }

        // Tappable types: link, pdf, phone, email, address.
        const href = contentHref(link, publicId);
        if (!href) return null;
        return (
          <Button
            key={link.id}
            href={href}
            icon={link.icon}
            label={link.label}
            description={link.description}
            newTab={link.type === 'link'}
          />
        );
      })}
    </div>
  );
}
