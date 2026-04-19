import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        surface: { DEFAULT:"#090b0e", 50:"#0e1116", 100:"#12151c", 200:"#171b24", 300:"#1c212c", 400:"#222836" },
        panel:   { DEFAULT:"#0f1218", border:"#1c2232", hover:"#161b24" },
        accent: {
          cyan:"#38bdf8", "cyan-dim":"#0ea5e9", blue:"#3b82f6",
          green:"#22d3a0", "green-dim":"#10b981", amber:"#f59e0b", red:"#f43f5e",
        },
        text: { primary:"#dce4f0", secondary:"#8a98b0", muted:"#4a5568", dim:"#2d3748" },
      },
      backgroundImage: {
        "grid-subtle":"linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)",
        "gradient-radial":"radial-gradient(var(--tw-gradient-stops))",
      },
      backgroundSize: { grid: "32px 32px" },
      boxShadow: {
        panel:"0 0 0 1px #1c2232, 0 4px 24px rgba(0,0,0,.6)",
        "panel-sm":"0 0 0 1px #1c2232, 0 2px 8px rgba(0,0,0,.4)",
        glow:"0 0 20px rgba(56,189,248,0.15)",
        "glow-green":"0 0 20px rgba(34,211,160,0.15)",
      },
      animation: {
        "fade-in":"fadeIn 0.2s ease-out",
        "slide-in-left":"slideInLeft 0.25s cubic-bezier(0.16,1,0.3,1)",
        "slide-in-right":"slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)",
        "pulse-slow":"pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        scan:"scan 2s linear infinite",
      },
      keyframes: {
        fadeIn:{ from:{ opacity:"0", transform:"translateY(4px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
        slideInLeft:{ from:{ opacity:"0", transform:"translateX(-12px)" }, to:{ opacity:"1", transform:"translateX(0)" } },
        slideInRight:{ from:{ opacity:"0", transform:"translateX(12px)" }, to:{ opacity:"1", transform:"translateX(0)" } },
        scan:{ "0%":{ transform:"translateY(-100%)" }, "100%":{ transform:"translateY(100%)" } },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
