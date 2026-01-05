// src/lib/theme.ts
// StudEx Design System 3.0 - Unified Theme Configuration

export const theme = {
  // Color Palette
  colors: {
    // Backgrounds
    background: {
      cream: '#FFF8F0',           // Warm cream base
      warmWhite: '#FFFBF7',       // Soft warm white
      lightCream: '#FFF9F1',      // Light cream variation
      cardBg: '#FFFFFF',          // Card background (pure white for contrast)
    },

    // Brand Colors - Teal & Purple Gradient
    primary: {
      teal: '#14B8A6',            // Teal 500
      tealLight: '#5EEAD4',       // Teal 300
      tealDark: '#0D9488',        // Teal 600
      purple: '#A855F7',          // Purple 500
      purpleLight: '#C084FC',     // Purple 400
      purpleDark: '#9333EA',      // Purple 600
    },

    // Accent Colors
    accent: {
      pink: '#EC4899',            // Pink 500
      orange: '#F97316',          // Orange 500
      yellow: '#FBBF24',          // Amber 400
      green: '#10B981',           // Emerald 500
    },

    // Neutral Colors
    neutral: {
      black: '#1F2937',           // Gray 800
      darkGray: '#4B5563',        // Gray 600
      mediumGray: '#9CA3AF',      // Gray 400
      lightGray: '#E5E7EB',       // Gray 200
      white: '#FFFFFF',
    },

    // Status Colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },

  // Gradient Presets
  gradients: {
    primary: 'linear-gradient(135deg, #14B8A6 0%, #A855F7 100%)',           // Teal to Purple
    primaryReverse: 'linear-gradient(135deg, #A855F7 0%, #14B8A6 100%)',   // Purple to Teal
    vibrant: 'linear-gradient(135deg, #EC4899 0%, #A855F7 50%, #14B8A6 100%)', // Pink-Purple-Teal
    warm: 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)',             // Orange to Pink
    cool: 'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)',             // Teal to Blue
    hero: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)', // Indigo-Purple-Pink
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem',  // 72px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
  },

  // Spacing
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '1rem',     // 16px
    md: '1.5rem',   // 24px
    lg: '2rem',     // 32px
    xl: '3rem',     // 48px
    '2xl': '4rem',  // 64px
    '3xl': '6rem',  // 96px
  },

  // Border Radius
  borderRadius: {
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
    full: '9999px', // Fully rounded
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 30px rgba(168, 85, 247, 0.5)',         // Purple glow
    glowTeal: '0 0 30px rgba(20, 184, 166, 0.5)',     // Teal glow
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
};

// Tailwind class helpers
export const tw = {
  // Background classes
  bg: {
    cream: 'bg-[#FFF8F0]',
    warmWhite: 'bg-[#FFFBF7]',
    lightCream: 'bg-[#FFF9F1]',
  },

  // Gradient button classes
  button: {
    primary: 'bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white font-bold shadow-lg hover:shadow-xl transition-all',
    secondary: 'bg-white/90 hover:bg-white text-purple-600 font-bold border-2 border-purple-200 hover:border-purple-300 shadow-md hover:shadow-lg transition-all',
    outline: 'bg-transparent border-2 border-gradient-to-r from-teal-500 to-purple-500 text-transparent bg-clip-text bg-gradient-to-r hover:bg-gradient-to-r hover:from-teal-500 hover:to-purple-500 hover:text-white transition-all',
  },

  // Card classes
  card: {
    default: 'bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-purple-100',
    gradient: 'bg-gradient-to-br from-teal-50 to-purple-50 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-purple-200',
  },

  // Logo classes
  logo: {
    round: 'rounded-full bg-gradient-to-br from-teal-500 to-purple-600 p-2 shadow-lg',
  },
};
