import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm ${className}`}>{children}</div>
  );
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle ? <p className="text-gray-500 mt-1">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  variant = 'brand',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: 'brand' | 'ghost' | 'danger' | 'neutral' }) {
  const styles: Record<string, string> = {
    brand: 'btn-brand',
    neutral: 'bg-gray-900 text-white hover:bg-gray-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 ring-1 ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  variant = 'brand',
  className = '',
}: {
  children: ReactNode;
  href: string;
  variant?: 'brand' | 'ghost' | 'neutral';
  className?: string;
}) {
  const styles: Record<string, string> = {
    brand: 'btn-brand',
    neutral: 'bg-gray-900 text-white hover:bg-gray-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 ring-1 ring-gray-300',
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-gray-400 mt-1">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl ring-1 ring-gray-300 px-3.5 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900';

export function Input(props: ComponentProps<'input'>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function Textarea(props: ComponentProps<'textarea'>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function Select(props: ComponentProps<'select'>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: (color ?? '#888') + '22', color: color ?? '#555' }}
    >
      {children}
    </span>
  );
}

export function Alert({ children, kind = 'info' }: { children: ReactNode; kind?: 'info' | 'error' | 'success' }) {
  const styles: Record<string, string> = {
    info: 'bg-blue-50 text-blue-800 ring-blue-200',
    error: 'bg-red-50 text-red-800 ring-red-200',
    success: 'bg-green-50 text-green-800 ring-green-200',
  };
  return <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${styles[kind]}`}>{children}</div>;
}
