import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [],
  theme: {
    extend: {
      colors: {
        scan: {
          50: 'oklch(96.51% 0.015 290.31 / <alpha-value>)',
          100: 'oklch(91.77% 0.035 292.75 / <alpha-value>)',
          200: 'oklch(83.48% 0.073 291.8 / <alpha-value>)',
          300: 'oklch(75.37% 0.11 290.05 / <alpha-value>)',
          400: 'oklch(68.25% 0.145 288.86 / <alpha-value>)',
          500: 'oklch(59.88% 0.185 285.85 / <alpha-value>)',
          600: 'oklch(50.07% 0.181 284.57 / <alpha-value>)',
          700: 'oklch(41.78% 0.117 287.1 / <alpha-value>)',
          800: 'oklch(34.52% 0.047 290.52 / <alpha-value>)',
          900: 'oklch(24.54% 0.004 308.28 / <alpha-value>)',
          950: 'oklch(18.22% 0 308.28 / <alpha-value>)',
        },
      },
    },
  },
};

export default config;
