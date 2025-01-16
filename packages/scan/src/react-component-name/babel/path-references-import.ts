import type { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { isPathValid } from './is-path-valid';
import { unwrapPath } from './unwrap';

export const pathReferencesImport = (
  path: NodePath,
  moduleSource: string,
  importName: string,
  asType: boolean,
  defaultNamespace = false,
): boolean => {
  const identifier = unwrapPath(path, t.isIdentifier);
  if (identifier) {
    const binding = path.scope.getBinding(identifier.node.name);
    if (binding && binding.kind === 'module') {
      const importPath = binding.path;
      const importParent = importPath.parentPath;
      if (
        isPathValid(importParent, t.isImportDeclaration) &&
        importParent.node.source.value === moduleSource
      ) {
        if (isPathValid(importPath, t.isImportSpecifier)) {
          const key = t.isIdentifier(importPath.node.imported)
            ? importPath.node.imported.name
            : importPath.node.imported.value;
          return key === importName;
        }
        if (isPathValid(importPath, t.isImportDefaultSpecifier)) {
          return importName === 'default';
        }
        if (isPathValid(importPath, t.isImportNamespaceSpecifier)) {
          return importName === '*';
        }
      }
    }
    return false;
  }
  const memberExpr =
    unwrapPath(path, t.isMemberExpression) ||
    unwrapPath(path, t.isOptionalMemberExpression);
  if (memberExpr) {
    const object = unwrapPath(memberExpr.get('object'), t.isIdentifier);
    if (!object) {
      return false;
    }
    const property = memberExpr.get('property');
    if (isPathValid(property, t.isIdentifier)) {
      return (
        property.node.name === importName &&
        (pathReferencesImport(object, moduleSource, '*', asType) ||
          (defaultNamespace &&
            pathReferencesImport(object, moduleSource, 'default', asType)))
      );
    }
    if (isPathValid(property, t.isStringLiteral)) {
      return (
        property.node.value === importName &&
        (pathReferencesImport(object, moduleSource, '*', asType) ||
          (defaultNamespace &&
            pathReferencesImport(object, moduleSource, 'default', asType)))
      );
    }
  }
  return false;
};
