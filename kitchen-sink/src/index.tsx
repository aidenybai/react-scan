import 'react-scan';

import { FC, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './main';

import './index.css';

const examples = import.meta.glob<false, string, { default: FC<unknown> }>(
  './examples/**/index.tsx',
  {
    eager: false,
  },
);

const root = document.getElementById('root');

if (root) {
  const embedded = new URLSearchParams(window.location.search);
  const page = embedded.get('example');
  const target = `./examples/${page}/index.tsx`;
  if (page && target in examples) {
    const App = lazy(examples[target]);
    createRoot(root).render(<App />);
  } else {
    createRoot(root).render(<Home />);
  }
}
