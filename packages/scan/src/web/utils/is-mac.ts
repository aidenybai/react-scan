export const isMac = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform || "";
  if (platform) return /Mac|iPhone|iPad|iPod/i.test(platform);
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
};
