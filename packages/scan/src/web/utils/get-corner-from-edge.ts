import type { Corner, SnapEdge } from "../widget/types";

export const getCornerFromEdge = (edge: SnapEdge, ratio: number): Corner => {
  const isNearStart = ratio < 0.5;
  if (edge === "top") return isNearStart ? "top-left" : "top-right";
  if (edge === "bottom") {
    return isNearStart ? "bottom-left" : "bottom-right";
  }
  if (edge === "left") return isNearStart ? "top-left" : "bottom-left";
  return isNearStart ? "top-right" : "bottom-right";
};
