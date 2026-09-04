/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colors derived from the reference image (Peymen design system)
        canvas: '#F4F6FA',       // Cool off-white/gray-blue background canvas
        cardBg: '#FFFFFF',       // Pure white card background
        primaryText: '#1A1E29',  // Dark charcoal/slate header and primary text
        secondaryText: '#8F99AE',// Steel gray/slate inactive text and labels
        brandActive: '#2B58FF',  // Vibrant royal blue/indigo for active links and status indicators
        brandHover: '#1E45D7',   // Deeper blue for hover states
        darkAccent: '#0A1E56',   // Deep navy/midnight blue card background
        alertOrange: '#FF5E3A',  // Orange dot indicator color
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Custom diffuse, low-opacity shadows seen on white cards in the reference image
        'card': '0 8px 30px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 35px rgba(43, 88, 255, 0.06)',
        'sidebar': '2px 0 20px rgba(0, 0, 0, 0.01)',
      },
      borderRadius: {
        // Large rounded corners matching the reference layout
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
