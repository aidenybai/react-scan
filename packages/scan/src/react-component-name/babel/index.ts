import { NodePath, PluginObj } from '@babel/core';
import * as t from '@babel/types';
import { isComponentishName } from './is-componentish-name';
import { isReactClassComponent } from './is-react-class-component';
import { isStatementTopLevel } from './is-statement-top-level';
import { pathReferencesImport } from './path-references-import';
import { unwrapNode, unwrapPath } from './unwrap';

function getAssignedDisplayNames(path: NodePath<t.Program>): Set<string> {
  const names = new Set<string>();
  path.traverse({
    AssignmentExpression(path) {
      const { node } = path;

      const memberExpr = unwrapNode(node.left, t.isMemberExpression);
      if (!memberExpr) {
        return;
      }
      const object = unwrapNode(memberExpr.object, t.isIdentifier);
      if (!object) {
        return;
      }
      if (
        t.isIdentifier(memberExpr.property) &&
        memberExpr.property.name === 'displayName'
      ) {
        names.add(object.name);
      }
    },
  });
  return names;
}

function isValidFunction(
  node: t.Node,
): node is t.ArrowFunctionExpression | t.FunctionExpression {
  return t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);
}

function assignDisplayName(
  statement: NodePath<t.Statement>,
  name: string,
): void {
  statement.insertAfter([
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(t.identifier(name), t.identifier('displayName')),
        t.stringLiteral(name),
      ),
    ),
  ]);
}

function isReactComponent(expr: NodePath<t.Expression>): boolean {
  // Check for class components
  const classExpr = unwrapPath(expr, t.isClassExpression);
  if (classExpr && isReactClassComponent(classExpr)) {
    return true;
  }
  // Check for function components
  const funcExpr = unwrapPath(expr, isValidFunction);
  if (funcExpr && !funcExpr.node.generator && funcExpr.node.params.length < 3) {
    return true;
  }
  // Time for call exprs
  const callExpr = unwrapPath(expr, t.isCallExpression);
  if (callExpr) {
    const callee = callExpr.get('callee');
    // forwardRef
    if (pathReferencesImport(callee, 'react', 'forwardRef', false, true)) {
      return true;
    }
    // memo
    if (pathReferencesImport(callee, 'react', 'memo', false, true)) {
      return true;
    }
    // memo
    if (pathReferencesImport(callee, 'react', 'createContext', false, true)) {
      return true;
    }
  }

  return false;
}

const BABEL_PLUGIN: PluginObj = {
  name: 'react-scan/component-name',
  visitor: {
    Program(path) {
      const assignedNames = getAssignedDisplayNames(path);

      path.traverse({
        ClassDeclaration(path) {
          if (isStatementTopLevel(path) && isReactClassComponent(path)) {
            if (!path.node.id) {
              return;
            }
            const name = path.node.id.name;
            if (assignedNames.has(name)) {
              return;
            }
            assignDisplayName(path, name);
          }
        },
        FunctionDeclaration(path) {
          if (isStatementTopLevel(path)) {
            const decl = path.node;

            if (
              // Check if the declaration has an identifier, and then check
              decl.id &&
              // if the name is component-ish
              isComponentishName(decl.id.name) &&
              !decl.generator &&
              // Might be component-like, but the only valid components
              // have zero, one or two (forwardRef) parameters
              decl.params.length < 3
            ) {
              if (!path.node.id) {
                return;
              }
              const name = path.node.id.name;
              if (assignedNames.has(name)) {
                return;
              }
              assignDisplayName(path, name);
            }
          }
        },
        VariableDeclarator(path) {
          if (!path.parentPath.isVariableDeclaration()) {
            return;
          }
          if (!isStatementTopLevel(path.parentPath)) {
            return;
          }
          const identifier = path.node.id;
          const init = path.get('init');
          if (!(init.isExpression() && t.isIdentifier(identifier))) {
            return;
          }
          if (!isComponentishName(identifier.name)) {
            return;
          }
          if (isReactComponent(init)) {
            const name = identifier.name;

            if (!assignedNames.has(name)) {
              assignDisplayName(path.parentPath, name);
            }
          }
        },
      });
    },
  },
};

export const reactScanComponentNamePlugin = (): PluginObj => BABEL_PLUGIN;
