import { type FunctionComponent, memo } from "react";

function CONSTANT_UPDATE() {
  return true;
}

export function constant<P extends object>(Component: FunctionComponent<P>) {
  const Memoed = memo(Component, CONSTANT_UPDATE);
  Memoed.displayName = `Memo(${Component.displayName || Component.name})`;
  return Memoed;
}
