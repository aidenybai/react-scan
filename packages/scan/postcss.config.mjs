import autoprefixer from 'autoprefixer';
import postcssNesting from 'postcss-nesting';
import tailwindcss from 'tailwindcss';
import remToPx from './postcss.rem2px.mjs';

export default {
  plugins: [
    remToPx({ baseValue: 16 }),
    postcssNesting,
    tailwindcss,
    autoprefixer,
  ],
};
