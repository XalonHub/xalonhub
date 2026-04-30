/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B9D83",
          hover: "#7A8C72",
          soft: "#F4F6F2",
        },
        secondary: {
          DEFAULT: "#D4C5B9",
          hover: "#C3B4A8",
        },
        dark: {
          DEFAULT: "#2C2C2C",
          muted: "#8A8A8A",
        },
        background: {
          DEFAULT: "#FAFAFA",
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'premium': '16px',
        'pro-max': '24px',
      },
      boxShadow: {
        'premium': '0 4px 20px -5px rgba(0, 0, 0, 0.05)',
        'floating': '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
