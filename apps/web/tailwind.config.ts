import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "sans-serif"],
        display: ["var(--font-sora)", "sans-serif"]
      },
      boxShadow: {
        panel: "0 20px 60px rgba(15, 23, 42, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
