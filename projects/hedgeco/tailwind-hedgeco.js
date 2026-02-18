
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
  hedgeco-blue-dark: "#0f1a3d",
  hedgeco-blue: "#1e40af",
  hedgeco-blue-light: "#3b82f6",
  hedgeco-cyan: "#06b6d4",
  hedgeco-dark: "#0f172a",
  hedgeco-light: "#f8fafc",
  hedgeco-white: "#ffffff",
  hedgeco-text-dark: "#1e293b",
  hedgeco-text: "#475569",
  hedgeco-text-light: "#64748b",
  hedgeco-green: "#10b981",
  hedgeco-purple: "#8b5cf6",
  hedgeco-orange: "#f97316",
  hedgeco-red: "#ef4444",
  hedgeco-border: "#e2e8f0",
  hedgeco-border-dark: "#cbd5e1"
},
      fontFamily: {
  hedgeco-sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  hedgeco-mono: "'JetBrains Mono', 'SF Mono', Monaco, 'Courier New', monospace"
},
      backgroundImage: {
        'hedgeco-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
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
    },
  },
};
