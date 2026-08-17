import { IS_CLIENT } from "./is-client";

export const saveLocalStorage = <Value>(storageKey: string, state: Value): void => {
  if (!IS_CLIENT) return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {}
};
