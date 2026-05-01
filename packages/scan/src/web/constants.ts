export const SAFE_AREA = 24;
export const MIN_SIZE = {
  width: 550,
  height: 350,
  initialHeight: 400,
} as const;

export const MIN_CONTAINER_WIDTH = 240;

export const LOCALSTORAGE_KEY = "react-scan-widget-settings-v2";
export const LOCALSTORAGE_COLLAPSED_KEY = "react-scan-widget-collapsed-v1";
export const LOCALSTORAGE_LAST_VIEW_KEY = "react-scan-widget-last-view-v1";

// CSS selector for elements inside #react-scan-toolbar that should NOT
// trigger drag and SHOULD allow native text selection / focus (#415).
// Keep in sync with the matching CSS rule in styles.tailwind.css.
export const TOOLBAR_INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, pre, [contenteditable], [data-react-scan-selectable]";
