import type * as babel from '@babel/core';
import type * as t from '@babel/types';

export function isStatementTopLevel(
  path: babel.NodePath<t.Statement>,
): boolean {
  let blockParent = path.scope.getBlockParent();
  const programParent = path.scope.getProgramParent();
  // a FunctionDeclaration binding refers to itself as the block parent
  if (blockParent.path === path) {
    blockParent = blockParent.parent;
  }

  return programParent === blockParent;
}
