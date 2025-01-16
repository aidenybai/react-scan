import { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import { pathReferencesImport } from './path-references-import';

export function isReactClassComponent(path: NodePath<t.Class>): boolean {
  const superClass = path.get('superClass');

  if (!superClass.isExpression()) {
    return false;
  }
  // The usual
  if (pathReferencesImport(superClass, 'react', 'Component', false, true)) {
    return true;
  }
  // PureComponent check
  if (pathReferencesImport(superClass, 'react', 'PureComponent', false, true)) {
    return true;
  }
  return false;
}
