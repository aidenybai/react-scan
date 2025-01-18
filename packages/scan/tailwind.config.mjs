export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: true,
  },
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: [
          'Menlo',
          'Consolas',
          'Monaco',
          'Liberation Mono',
          'Lucida Console',
          'monospace',
        ],
      },
      colors: {
        inspect: '#8e61e3',
      },
      fontSize: {
        xxs: '0.5rem',
      },
      cursor: {
        'nwse-resize': 'nwse-resize',
        'nesw-resize': 'nesw-resize',
        'ns-resize': 'ns-resize',
        'ew-resize': 'ew-resize',
        move: 'move',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        shake: {
          '0%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '50%': { transform: 'translateX(5px)' },
          '75%': { transform: 'translateX(-5px)' },
          '100%': { transform: 'translateX(0)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn ease-in forwards',
        'fade-out': 'fadeOut ease-out forwards',
        rotate: 'rotate linear infinite',
        shake: 'shake 0.4s ease-in-out forwards',
      },
      zIndex: {
        100: 100,
      },
      borderWidth: {
        1: '1px',
      },
    },
  },
  safelist: [
    'cursor-nwse-resize',
    'cursor-nesw-resize',
    'cursor-ns-resize',
    'cursor-ew-resize',
    'cursor-move',
  ],
  plugins: [
    ({ addUtilities }) => {
      const newUtilities = {
        '.pointer-events-bounding-box': {
          'pointer-events': 'bounding-box',
        },
      };
      addUtilities(newUtilities);
    },
    ({ addUtilities }) => {
      const newUtilities = {
        '.animation-duration-0': {
          'animation-duration': '0s',
        },
        '.animation-delay-0': {
          'animation-delay': '0s',
        },
        '.animation-duration-100': {
          'animation-duration': '100ms',
        },
        '.animation-delay-100': {
          'animation-delay': '100ms',
        },
        '.animation-delay-150': {
          'animation-delay': '150ms',
        },
        '.animation-duration-200': {
          'animation-duration': '200ms',
        },
        '.animation-delay-200': {
          'animation-delay': '200ms',
        },
        '.animation-duration-300': {
          'animation-duration': '300ms',
        },
        '.animation-delay-300': {
          'animation-delay': '300ms',
        },
        '.animation-duration-500': {
          'animation-duration': '500ms',
        },
        '.animation-delay-500': {
          'animation-delay': '500ms',
        },
        '.animation-duration-700': {
          'animation-duration': '700ms',
        },
        '.animation-delay-700': {
          'animation-delay': '700ms',
        },
        '.animation-duration-1000': {
          'animation-duration': '1000ms',
        },
        '.animation-delay-1000': {
          'animation-delay': '1000ms',
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
