import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config = {
  darkMode: ['class', '.dark'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // DuneFlame Official Brand Palette
        flame: {
          red: '#CC3323',      // Primary Accent
          deep: '#A3291C',     // Hover / Active Variant
          caramel: '#E2A56E',  // Secondary Accent
          apricot: '#F2C38B',  // Soft Highlight
        },
        dune: {
          paper: '#FBEDDC',    // Main Background
          sand: '#E6D3BF',     // Secondary Background / Panels
          taupe: '#C3AD98',    // Borders / Dividers
        },
        oasis: {
          teal: '#1F6F78',     // CTA / Contrast Accent
        },
        olive: {
          deep: '#3E4B3A',     // Support / Neutral Dark
        },
        espresso: {
          brown: '#2B1B13',    // Text Primary
        },
        charcoal: {
          roast: '#1F1A17',    // Text Dark Background
        },
      },
      fontFamily: {
        // Brand Typography
        'logo': ['Bank Gothic BT', 'sans-serif'],
        'heading': ['DIN 2014', 'sans-serif'],
        'body': ['Source Sans Pro', 'sans-serif'],
        'arabic': ['var(--font-arabic)', 'Noto Sans Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
