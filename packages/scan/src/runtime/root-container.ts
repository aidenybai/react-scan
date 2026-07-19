import styles from "../web/assets/css/styles.css";
import { watchAppTheme } from "../web/utils/watch-app-theme";

export interface RootContainerController {
  shadowRoot: ShadowRoot;
  dispose: () => void;
}

export const createRootContainer = (): RootContainerController => {
  const host = document.createElement("div");
  host.id = "react-scan-root";

  const shadowRoot = host.attachShadow({ mode: "open" });
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  shadowRoot.appendChild(styleElement);
  document.documentElement.appendChild(host);

  const stopWatchingTheme = watchAppTheme(host);

  return {
    shadowRoot,
    dispose: () => {
      stopWatchingTheme();
      host.remove();
    },
  };
};
