import type { Config } from "tailwindcss";

const withOpacity =
  (variable: string) =>
  ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue
      ? `rgb(var(${variable}) / ${opacityValue})`
      : `rgb(var(${variable}))`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: withOpacity("--color-bg"),
        surface: withOpacity("--color-surface"),
        surface2: withOpacity("--color-surface2"),
        border: withOpacity("--color-border"),
        ink: withOpacity("--color-ink"),
        "ink-dim": withOpacity("--color-ink-dim"),
        "ink-faint": withOpacity("--color-ink-faint"),
        rm: withOpacity("--color-rm"),
        "rm-dim": withOpacity("--color-rm-dim"),
        tc: withOpacity("--color-tc"),
        "tc-dim": withOpacity("--color-tc-dim"),
        rx: withOpacity("--color-rx"),
        "rx-dim": withOpacity("--color-rx-dim"),
        alert: withOpacity("--color-alert"),
        "alert-dim": withOpacity("--color-alert-dim"),
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
