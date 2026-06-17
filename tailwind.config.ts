import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Driven at runtime by CSS variables so the backoffice can re-theme.
        brand: {
          DEFAULT: 'var(--brand)',
          fg: 'var(--brand-fg)',
          dark: 'var(--brand-dark)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          fg: 'var(--accent-fg)',
        },
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
