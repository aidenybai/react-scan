import './polyfills';
// Prioritize bippy side-effect
import 'bippy';

import { IS_CLIENT } from '~web/utils/constants';
import { type Options, scan } from './index';

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Allowlist + per-field type validation. Mirrors react-grab's
// `parseOptionsFromJson` — never spread untrusted JSON into the options
// object, since that could inject internal/dangerous flags. Add new
// keys here as the need arises.
const parseOptionsFromJson = (raw: unknown): Options => {
  const out: Options = {};
  if (!isObjectRecord(raw)) return out;

  if (typeof raw.enabled === 'boolean') out.enabled = raw.enabled;

  return out;
};

// Read configuration from a `data-options='{"enabled":false}'` attribute on
// the loading <script> tag. Must run synchronously at module top-level so
// `document.currentScript` still points at our script tag.
const readScriptOptions = (): Options => {
  if (typeof document === 'undefined') return {};
  try {
    const script =
      document.currentScript instanceof HTMLScriptElement
        ? document.currentScript
        : null;
    const raw = script?.getAttribute('data-options');
    if (!raw) return {};
    return parseOptionsFromJson(JSON.parse(raw));
  } catch {
    return {};
  }
};

const scriptOptions = readScriptOptions();

if (IS_CLIENT) {
  scan(scriptOptions);
  window.reactScan = scan;
}

export * from './core';
