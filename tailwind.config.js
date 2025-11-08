export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BlackBoxZ Aviation Orange Theme
        'blackboxz-primary': '#FF6B00',
        'blackboxz-secondary': '#E55A00',
        'blackboxz-accent': '#FF8533',
        'blackboxz-dark': '#1A1A1A',
        'blackboxz-gray': '#2D2D2D',
      },
      fontFamily: {
        sans: ['Saira', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        blackboxz: {
          "primary": "#FF6B00",
          "secondary": "#E55A00",
          "accent": "#FF8533",
          "neutral": "#2D2D2D",
          "base-100": "#ffffff",
          "base-200": "#f8f8f8",
          "base-300": "#e5e5e5",
          "info": "#0ea5e9",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      "light"
    ],
  },
}