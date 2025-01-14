import { scan } from './index';
import { init } from './install-hook'; // Initialize RDT hook

init();

if (typeof window !== 'undefined') {
  scan({ dangerouslyForceRunInProduction: true });
  window.reactScan = scan;
}

export * from './core';
