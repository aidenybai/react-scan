export const hasNonEmptyTextSelection = (): boolean => {
  const selection = window.getSelection?.();
  return Boolean(selection && selection.toString().length > 0);
};
