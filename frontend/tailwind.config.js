/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "oklch(65.69% 0.196 255 / 1)", // Blue instead of purple
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "oklch(65.69% 0.196 255 / 1)", // Blue instead of purple
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}

