import { NodePath, PluginObj } from '@babel/core';
import * as t from '@babel/types';
import { isComponentishName } from './is-componentish-name';
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
    t.tryStatement(
      t.blockStatement([
        t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(t.identifier(name), t.identifier('displayName')),
            t.stringLiteral(name),
          ),
        ),
      ]),
    ),
  ]);
}

function isReactClassComponent(path: NodePath<t.Class>): boolean {
  const superClass = path.get('superClass');

  if (!superClass.isExpression()) {
    return false;
  }
  // The usual
  if (
    pathReferencesImport(
      superClass,
      'react',
      ['Component', 'PureComponent'],
      false,
      true,
    )
  ) {
    return true;
  }
  return false;
}

function isStyledComponent(
  moduleName: string,
  importName: string[],
  path: NodePath<t.Expression>,
): boolean {
  function isStyledImport(path: NodePath<t.Node>): boolean {
    return pathReferencesImport(path, moduleName, importName, false, false);
  }
  const callExpr = unwrapPath(path, t.isCallExpression);
  if (callExpr) {
    const callee = callExpr.get('callee');
    // styled('h1', () => {...});
    if (isStyledImport(callee)) {
      return true;
    }
    // styled.h1(() => {...})
    const memberExpr = unwrapPath(callee, t.isMemberExpression);
    if (memberExpr) {
      const object = unwrapPath(memberExpr.get('object'), t.isIdentifier);
      if (object && isStyledImport(object)) {
        return true;
      }
    }

    return false;
  }

  const taggedExpr = unwrapPath(path, t.isTaggedTemplateExpression);
  if (taggedExpr) {
    const tag = taggedExpr.get('tag');

    const memberExpr = unwrapPath(tag, t.isMemberExpression);
    if (memberExpr) {
      const object = unwrapPath(memberExpr.get('object'), t.isIdentifier);
      // styled.h1`...`;
      if (object && isStyledImport(object)) {
        return true;
      }

      return false;
    }

    // styled(Link)`...`
    const callExpr = unwrapPath(tag, t.isCallExpression);
    if (callExpr) {
      const callee = callExpr.get('callee');
      if (isStyledImport(callee)) {
        return true;
      }

      return false;
    }
  }
  return false;
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
    // React
    if (
      pathReferencesImport(
        callee,
        'react',
        ['forwardRef', 'memo', 'createContext'],
        false,
        true,
      )
    ) {
      return true;
    }
    const identifier = unwrapPath(callee, t.isIdentifier);
    if (identifier) {
      // Assume HOCs
      if (/^with[A-Z]/.test(identifier.node.name)) {
        return true;
      }
    }
  }

  if (isStyledComponent('@emotion/styled', ['default'], expr)) {
    return true;
  }
  if (isStyledComponent('styled-components', ['default'], expr)) {
    return true;
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
          if (isReactClassComponent(path)) {
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
        },
        VariableDeclarator(path) {
          if (!path.parentPath.isVariableDeclaration()) {
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
