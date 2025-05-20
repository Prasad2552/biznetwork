// tailwind.config.ts
import type { Config } from "tailwindcss";

const withOpacity = (variableName: string) => {
  return ({ opacityValue }: { opacityValue?: number }) => {
    if (opacityValue === undefined) {
      return `hsl(var(${variableName}))`;
    }
    return `hsl(var(${variableName}) / ${opacityValue})`;
  };
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
   // Remove globals.css from here
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))', // No withOpacity function needed
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: withOpacity("--card")({}),
          foreground: withOpacity("--card-foreground")({}),
        },
        popover: {
          DEFAULT: withOpacity("--popover")({}),
          foreground: withOpacity("--popover-foreground")({}),
        },
        primary: {
          DEFAULT: withOpacity("--primary")({}),
          foreground: withOpacity("--primary-foreground")({}),
        },
        secondary: {
          DEFAULT: withOpacity("--secondary")({}),
          foreground: withOpacity("--secondary-foreground")({}),
        },
        muted: {
          DEFAULT: withOpacity("--muted")({}),
          foreground: withOpacity("--muted-foreground")({}),
        },
        accent: {
          DEFAULT: withOpacity("--accent")({}),
          foreground: withOpacity("--accent-foreground")({}),
        },
        destructive: {
          DEFAULT: withOpacity("--destructive")({}),
          foreground: withOpacity("--destructive-foreground")({}),
        },
        border: withOpacity("--border")({}),
        input: withOpacity("--input")({}),
        ring: withOpacity("--ring")({}),
        chart: {
          "1": withOpacity("--chart-1")({}),
          "2": withOpacity("--chart-2")({}),
          "3": withOpacity("--chart-3")({}),
          "4": withOpacity("--chart-4")({}),
          "5": withOpacity("--chart-5")({}),
        },
        sidebar: {
          DEFAULT: withOpacity("--sidebar-background")({}),
          foreground: withOpacity("--sidebar-foreground")({}),
          primary: withOpacity("--sidebar-primary")({}),
          "primary-foreground": withOpacity("--sidebar-primary-foreground")({}),
          accent: withOpacity("--sidebar-accent")({}),
          "accent-foreground": withOpacity("--sidebar-accent-foreground")({}),
          border: withOpacity("--sidebar-border")({}),
          ring: withOpacity("--sidebar-ring")({}),
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      fontWeight: {
        medium: '500',
      },
      spacing: {
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;