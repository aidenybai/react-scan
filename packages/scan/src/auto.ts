import 'bippy'; // implicit init RDT hook
import { scan } from './index';

if (typeof window !== 'undefined') {
  scan({ dangerouslyForceRunInProduction: true });
  window.reactScan = scan;
}

export * from './index';
