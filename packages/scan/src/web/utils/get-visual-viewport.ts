interface VisualViewportInfo {
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
}

export const getVisualViewport = (): VisualViewportInfo => {
  const visualViewport = window.visualViewport;
  if (visualViewport) {
    return {
      width: visualViewport.width,
      height: visualViewport.height,
      offsetLeft: visualViewport.offsetLeft,
      offsetTop: visualViewport.offsetTop,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    offsetLeft: 0,
    offsetTop: 0,
  };
};
