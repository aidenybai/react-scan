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
      spacing: {
        3.5: '0.875rem',
        4.5: '1.125rem',
        5.5: '1.375rem',
        6.5: '1.625rem',
        7.5: '1.875rem',
        8.5: '2.125rem',
        9.5: '2.375rem',
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
        countFlash: {
          '0%': {
            backgroundColor: 'rgba(168, 85, 247, 0.3)',
            transform: 'scale(1.05)',
          },
          '100%': {
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            transform: 'scale(1)',
          },
        },
        countFlashShake: {
          '0%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '50%': {
            transform: 'translateX(5px) scale(1.1)',
          },
          '75%': { transform: 'translateX(-5px)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn ease-in forwards',
        'fade-out': 'fadeOut ease-out forwards',
        rotate: 'rotate linear infinite',
        shake: 'shake .4s ease-in-out forwards',
        'count-flash': 'countFlash .3s ease-out forwards',
        'count-flash-shake': 'countFlashShake .3s ease-out forwards',
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
          'animation-duration': '.1s',
        },
        '.animation-delay-100': {
          'animation-delay': '.1s',
        },
        '.animation-delay-150': {
          'animation-delay': '.15s',
        },
        '.animation-duration-200': {
          'animation-duration': '.2s',
        },
        '.animation-delay-200': {
          'animation-delay': '.2s',
        },
        '.animation-duration-300': {
          'animation-duration': '.3s',
        },
        '.animation-delay-300': {
          'animation-delay': '.3s',
        },
        '.animation-duration-500': {
          'animation-duration': '.5s',
        },
        '.animation-delay-500': {
          'animation-delay': '.5s',
        },
        '.animation-duration-700': {
          'animation-duration': '.7s',
        },
        '.animation-delay-700': {
          'animation-delay': '.7s',
        },
        '.animation-duration-1000': {
          'animation-duration': '1s',
        },
        '.animation-delay-1000': {
          'animation-delay': '1s',
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
