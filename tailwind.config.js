/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  // Optional: enable dark mode by class if you plan to add it later
  // darkMode: 'class',

  safelist: [
    // ── Dynamic color classes used across tabs, badges, statuses ──
    ...['blue', 'emerald', 'violet', 'purple', 'cyan', 'rose', 'amber', 'indigo', 'slate', 'gray', 'green', 'red', 'yellow']
      .flatMap((c) => [
        // Border colors
        `border-${c}-100`,
        `border-${c}-200`,
        `border-${c}-300`,
        `border-${c}-400`,
        `border-${c}-500`,

        // Text colors
        `text-${c}-400`,
        `text-${c}-500`,
        `text-${c}-600`,
        `text-${c}-700`,
        `text-${c}-800`,

        // Background colors
        `bg-${c}-50`,
        `bg-${c}-100`,
        `bg-${c}-200`,
        `bg-${c}-400`,
        `bg-${c}-500`,
        `bg-${c}-600`,
        `bg-${c}-700`,

        // Hover states
        `hover:bg-${c}-50`,
        `hover:bg-${c}-100`,
        `hover:bg-${c}-600`,
        `hover:bg-${c}-700`,
        `hover:text-${c}-600`,
        `hover:text-${c}-700`,
        `hover:text-${c}-800`,
        `hover:border-${c}-300`,

        // Ring colors (for focus states)
        `ring-${c}-500`,
        `focus:ring-${c}-500`,
        `focus:border-${c}-500`,

        // Gradient endpoints
        `from-${c}-50`,
        `from-${c}-500`,
        `from-${c}-600`,
        `via-${c}-600`,
        `to-${c}-600`,
        `to-${c}-700`,
      ]),

    // Opacity modifiers used in some overlays
    'bg-blue-500/20',
    'bg-emerald-500/20',
    'bg-rose-500/20',
    'bg-amber-500/20',
    'bg-violet-500/20',
  ],

  theme: {
    extend: {
      // Optional: add custom brand colors here if needed
      // colors: {
      //   brand: { 500: '#1A56DB', 600: '#153E7C' },
      // },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        // (Tailwind has pulse by default; keeping an example)
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },

  plugins: [
    // Optional: uncomment if you use @tailwindcss/forms for nicer inputs
    // require('@tailwindcss/forms'),

    // Optional: uncomment if you use @tailwindcss/typography for prose
    // require('@tailwindcss/typography'),
  ],
};