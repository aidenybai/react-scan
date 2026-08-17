import "./polyfills";
// Prioritize bippy side-effect
import "bippy";

import { IS_CLIENT } from "./utils/is-client";
import { scan } from "./index";

if (IS_CLIENT) {
  scan();
  window.reactScan = scan;
}

export * from "./core";
