import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0F1720",
        surface: "#17212C",
        surface2: "#1D2A38",
        border: "#29394A",
        ink: "#E6EDF3",
        "ink-dim": "#8FA3B8",
        "ink-faint": "#5C7186",
        rm: "#5EC8D8",
        "rm-dim": "#2E5B63",
        tc: "#E8A33D",
        "tc-dim": "#6B4E20",
        rx: "#8FBF6F",
        "rx-dim": "#3E5230",
        alert: "#E2574C",
        "alert-dim": "#5A2B26",
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
