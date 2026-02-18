/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // EXACT colors from staging.hedgeco.net - Updated 2026-02-18
        hedgeco: {
          // Primary colors from staging
          'primary': '#059669',      // Main green - EXACT from staging
          'primary-light': '#10b981', // Light green - EXACT from staging
          'cyan': '#0891b2',         // Cyan - EXACT from staging
          
          // Text colors from staging
          'dark': '#0f172a',         // Dark text - EXACT from staging
          'text-dark': '#1e293b',    // Darker text - EXACT from staging
          'text': '#334155',         // Medium text - EXACT from staging
          'text-light': '#64748b',   // Light text - EXACT from staging
          'text-lighter': '#9ca3af', // Lighter text - EXACT from staging
          
          // Background colors from staging
          'light': '#f8fafc',        // Light background - EXACT from staging
          'white': '#ffffff',        // White - EXACT from staging
          'gray-light': '#f1f5f9',   // Light gray - EXACT from staging
          'gray': '#e2e8f0',         // Gray - EXACT from staging
          'gray-dark': '#cbd5e1',    // Dark gray - EXACT from staging
          
          // Border colors from staging
          'border': '#e5e7eb',       // Border - EXACT from staging
          'border-dark': '#d1d5db',  // Dark border
          
          // Accent colors
          'red': '#ef4444',          // Red - EXACT from staging
          'red-dark': '#dc2626',     // Dark red - EXACT from staging
          
          // Legacy names for compatibility (will phase out)
          'blue-dark': '#0f172a',    // Same as 'dark'
          'blue': '#059669',         // Same as 'primary' (GREEN, not blue!)
          'blue-light': '#10b981',   // Same as 'primary-light'
        },
        // Shadcn compatibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      fontFamily: {
        'hedgeco-sans': ["'Inter'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', "'Helvetica Neue'", 'Arial', 'sans-serif'],
        'hedgeco-mono': ["'JetBrains Mono'", "'SF Mono'", 'Monaco', "'Courier New'", 'monospace'],
      },
      backgroundImage: {
        'hedgeco-gradient': 'linear-gradient(135deg, #0f1a3d 0%, #1e40af 50%, #06b6d4 100%)',
        'hedgeco-grid': "url('/assets/grid.svg')",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
