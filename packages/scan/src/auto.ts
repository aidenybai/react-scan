import 'bippy'; // implicit init RDT hook
import { scan } from './index';

if (typeof window !== 'undefined') {
  scan();
  window.reactScan = scan;
}

export * from './index';
