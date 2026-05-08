/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0D0D1A',
          surface: '#13132B',
          panel:   '#1A1A35',
        },
        border:  '#2A2A5A',
        accent:  '#00FFCC',
        accent2: '#FF6B35',
        green:   '#44FF88',
        red:     '#FF4466',
        yellow:  '#FFE566',
        blue:    '#4488FF',
        muted:   '#6666AA',
        text: {
          primary: '#CCCCFF',
          white:   '#EEEEFF',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        vt:    ['VT323', 'monospace'],
      },
    },
  },
  plugins: [],
};

