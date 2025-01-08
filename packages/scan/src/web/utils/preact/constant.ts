import { createElement, type Component, type FunctionComponent } from 'preact';

function CONSTANT_UPDATE() {
  return false;
}

export function constant<P>(Component: FunctionComponent<P>) {
  function Memoed(this: Component<P>, props: P) {
    this.shouldComponentUpdate = CONSTANT_UPDATE;
    return createElement(Component, props as any); // Preact has a broken type declaration
  }
  Memoed.displayName =
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    `Memo(${Component.displayName || Component.name})`;
  Memoed.prototype.isReactComponent = true;
  Memoed._forwarded = true;
  return Memoed;
}
