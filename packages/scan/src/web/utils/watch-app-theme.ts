import { RGB_CHANNEL_MAX, THEME_DARK_LUMINANCE_THRESHOLD } from "../constants";

type AppTheme = "dark" | "light";

const THEME_ATTRIBUTES = [
  "class",
  "style",
  "data-theme",
  "data-mode",
  "data-color-scheme",
  "data-bs-theme",
  "data-mui-color-scheme",
] as const;

const getMarkerTheme = (element: HTMLElement): AppTheme | undefined => {
  if (element.classList.contains("dark")) return "dark";
  if (element.classList.contains("light")) return "light";

  for (const attribute of THEME_ATTRIBUTES) {
    const value = element.getAttribute(attribute)?.toLowerCase();
    if (value === "dark" || value === "light") return value;
  }
};

const linearizeChannel = (channel: number): number => {
  const normalized = channel / RGB_CHANNEL_MAX;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

const getBackgroundTheme = (element: HTMLElement): AppTheme | undefined => {
  const color = getComputedStyle(element).backgroundColor;
  const channels = color.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3 || channels[3] === 0) return;
  const luminance =
    linearizeChannel(channels[0]) * 0.2126 +
    linearizeChannel(channels[1]) * 0.7152 +
    linearizeChannel(channels[2]) * 0.0722;
  return luminance < THEME_DARK_LUMINANCE_THRESHOLD ? "dark" : "light";
};

const detectAppTheme = (): AppTheme =>
  getMarkerTheme(document.documentElement) ??
  (document.body ? getMarkerTheme(document.body) : undefined) ??
  (document.body ? getBackgroundTheme(document.body) : undefined) ??
  getBackgroundTheme(document.documentElement) ??
  "light";

export const watchAppTheme = (host: HTMLElement): (() => void) => {
  let frameId: number | undefined;

  const applyTheme = () => {
    const appTheme = detectAppTheme();
    host.dataset.reactScanTheme = appTheme === "dark" ? "light" : "dark";
  };
  const scheduleThemeUpdate = () => {
    cancelAnimationFrame(frameId ?? 0);
    frameId = requestAnimationFrame(applyTheme);
  };

  applyTheme();
  const observer = new MutationObserver(scheduleThemeUpdate);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [...THEME_ATTRIBUTES],
  });
  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [...THEME_ATTRIBUTES],
    });
  }
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  colorScheme.addEventListener("change", scheduleThemeUpdate);

  return () => {
    observer.disconnect();
    colorScheme.removeEventListener("change", scheduleThemeUpdate);
    cancelAnimationFrame(frameId ?? 0);
  };
};
