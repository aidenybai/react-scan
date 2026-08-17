import { IS_CLIENT } from "./is-client";

export const readLocalStorage = <Value>(storageKey: string): Value | null => {
  if (!IS_CLIENT) return null;

  try {
    const storedValue = localStorage.getItem(storageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
};
