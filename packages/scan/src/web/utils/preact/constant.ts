import {
  type Attributes,
  type Component,
  type FunctionComponent,
  createElement,
} from 'preact';

function CONSTANT_UPDATE() {
  return false;
}

export function constant<P extends Attributes>(
  Component: FunctionComponent<P>,
) {
  function Memoed(this: Component<P>, props: P) {
    this.shouldComponentUpdate = CONSTANT_UPDATE;
    return createElement<P>(Component, props);
  }
  Memoed.displayName = `Memo(${Component.displayName || Component.name})`;
  Memoed.prototype.isReactComponent = true;
  Memoed._forwarded = true;
  return Memoed;
}
