/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'], // Support both class and data attribute for dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary-color)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary-color)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent-color)",
          foreground: "var(--accent-foreground)",
        },
        background: "var(--background-color)",
        foreground: "var(--text-color)",
        border: "var(--border-color)",
        muted: {
          DEFAULT: "var(--muted-color)",
          foreground: "var(--muted-foreground)",
        },
      },
    },
  },
  plugins: [],
};
