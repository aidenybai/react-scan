import { version as REACT_GRAB_VERSION } from "react-grab/package.json";

let didRunVersionCheck = false;

export const checkReactGrabVersion = (): void => {
  if (didRunVersionCheck) return;
  didRunVersionCheck = true;

  if (typeof window === "undefined") return;
  if (window.__REACT_GRAB__) return;
  if (!navigator.onLine) return;
  if (!REACT_GRAB_VERSION) return;

  const fetchOptions: RequestInit = {
    referrerPolicy: "origin",
    keepalive: true,
    priority: "low",
    cache: "no-store",
  };

  try {
    fetch(
      `https://www.react-grab.com/api/version?source=react-scan&v=${REACT_GRAB_VERSION}&t=${Date.now()}`,
      fetchOptions,
    )
      .then((response) => response.text())
      .then((latestVersion) => {
        if (latestVersion && latestVersion !== REACT_GRAB_VERSION) {
          // oxlint-disable-next-line no-console
          console.warn(
            `[React Scan] react-grab v${REACT_GRAB_VERSION} is outdated (latest: v${latestVersion}). Update react-scan to pick up the newer react-grab.`,
          );
        }
      })
      .catch(() => null);
  } catch {}
};
