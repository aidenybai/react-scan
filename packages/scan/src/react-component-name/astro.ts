import type { Options } from '.';
import vite from './vite';

export default (options: Options = {}) => ({
  name: 'react-component-name',
  hooks: {
    // biome-ignore lint/suspicious/noExplicitAny: should be { config: AstroConfig }
    'astro:config:setup': (astro: any) => {
      astro.config.vite.plugins ||= [];
      astro.config.vite.plugins.push(vite(options));
    },
  },
});
