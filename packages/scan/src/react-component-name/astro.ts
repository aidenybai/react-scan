import vite from './vite';
import { type Options } from '.';

export default (options: Options = {}) => ({
  name: 'react-component-name',
  hooks: {
    'astro:config:setup': (astro: any) => {
      astro.config.vite.plugins ||= [];
      astro.config.vite.plugins.push(vite(options));
    },
  },
});
