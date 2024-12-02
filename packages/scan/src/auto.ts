import './core/instrumentation/init';
import { scan } from './index';

if (typeof window !== 'undefined') {
  scan();
  window.reactScan = scan;
}

export * from './index';
