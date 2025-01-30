import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      
      'xs': '425px',  // Very small devices
      'sm': '640px',
      'md': '768px',
      'lg': '797px',  // Specific breakpoint for navbar
      'xl': '1024px',
      '2xl': '1280px',
      'navbar-mobile': '883px',  // Custom breakpoint for navbar menu icon
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        'courier-prime': ['var(--font-courier-prime)', 'monospace'],
      },
      fontSize: {
        'xs-tiny': '0.6rem',  // Extra small font size
      },
      spacing: {
        'xs-tight': '0.25rem',  // Tighter spacing for very small devices
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config;
