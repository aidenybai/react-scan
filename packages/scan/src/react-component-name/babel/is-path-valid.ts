import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';

type TypeFilter<V extends t.Node> = (node: t.Node) => node is V;

export const isPathValid = <V extends t.Node>(
  path: unknown,
  key: TypeFilter<V>,
): path is NodePath<V> => {
  return key((path as NodePath).node);
};
