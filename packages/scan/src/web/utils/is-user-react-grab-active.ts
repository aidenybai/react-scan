export const isUserReactGrabActive = (): boolean =>
  typeof window !== "undefined" && Boolean(window.__REACT_GRAB__);
