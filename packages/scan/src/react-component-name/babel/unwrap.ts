import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import { isNestedExpression } from './is-nested-expression';
import { isPathValid } from './is-path-valid';

type TrueTypeFilter<U extends t.Node> = (node: t.Node) => node is U;
type TypeCheck<K> = K extends TrueTypeFilter<infer U> ? U : never;

type NodeTypeFilter = (node: t.Node) => boolean;

export const unwrapNode = <K extends NodeTypeFilter>(
  node: t.Node | null | undefined,
  key: K,
): TypeCheck<K> | undefined => {
  if (!node) {
    return undefined;
  }
  if (key(node)) {
    return node as TypeCheck<K>;
  }
  if (isNestedExpression(node)) {
    return unwrapNode(node.expression, key);
  }
  return undefined;
};

type PathTypeFilter<V extends t.Node> = (node: t.Node) => node is V;

export const unwrapPath = <V extends t.Node>(
  path: unknown,
  key: PathTypeFilter<V>,
): NodePath<V> | undefined => {
  if (isPathValid(path, key)) {
    return path;
  }
  if (isPathValid(path, isNestedExpression)) {
    return unwrapPath(path.get('expression'), key);
  }
  return undefined;
};
