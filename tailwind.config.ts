import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "zine-paper": "#FFF8E7",
        "photocopy-ink": "#121212",
        "riso-red": "#FF3B30",
        "rubber-blue": "#0057FF",
        "banana-sticker": "#FFE600",
        "bubblegum-print": "#FF8BD1",
        "slime-stamp": "#35E36D",
        "pixel-aqua": "#00D8C8",
        "cardboard-tan": "#C99A6B",
        "purple-scribble": "#7A35FF",
        "tape-grey": "#D8D0BF",
        "margin-note": "#6B6257",
      },
      fontFamily: {
        display: ["var(--font-rubik-mono-one)", "monospace"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        halftone: "radial-gradient(#12121215 1px, transparent 1px)",
      },
      backgroundSize: {
        halftone: "8px 8px",
      },
    },
  },
  plugins: [],
};

export default config;
