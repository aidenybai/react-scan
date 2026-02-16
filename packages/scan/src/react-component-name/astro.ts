import type { Options } from '.';
import vite from './vite';

export default (options: Options = {}) => ({
  name: 'react-component-name',
  hooks: {
    // oxlint-disable-next-line typescript/no-explicit-any
    'astro:config:setup': (astro: any) => {
      astro.config.vite.plugins ||= [];
      astro.config.vite.plugins.push(vite(options));
    },
  },
});
