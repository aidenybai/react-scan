import { scan } from "./index";
import { init } from "./install-hook";

init();

if (typeof window !== "undefined") {
  scan();
  window.reactScan = scan;
}

export * from "./core";
