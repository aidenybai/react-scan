export const isInputLikeFocused = (): boolean => {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (active instanceof HTMLElement && active.isContentEditable) return true;
  return false;
};
