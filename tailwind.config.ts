import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        h1: ['2.25rem', '2.75rem'], // text-h1
        h2: ['1.875rem', '2.25rem'],
        body: ['1rem', '1.5rem'], // text-body
        caption: ['0.75rem', '1.125rem'],
      },
      colors: {
        primary: '#FFD93D',
        secondary: '#3083FF',
        danger: '#EF4444',
        background: '#FAFAFA',
        gray1: 'D9D9D9',
        gray2: '#B0B0B0',
        gray3: '#6B7280',
        gray4: '#374151',
        gray5: '#1F2937',
        white: '#FFFFFF',
        black: '#000000',
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'custom-light': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'custom-dark': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
