import { createFilter } from '@rollup/pluginutils';
import { createUnplugin } from 'unplugin';
import { transformAsync } from '@babel/core';
import type { NodePath, PluginObj } from '@babel/core';
import * as t from '@babel/types';

export interface Options {
  include?: Array<string | RegExp>;
  exclude?: Array<string | RegExp>;
  parseDependencies?: boolean;
}

const isFirstLetterCapitalized = (name: string): boolean =>
  name[0] === name[0].toUpperCase();

const isComponentName = (name: string): boolean =>
  isFirstLetterCapitalized(name) &&
  !name.startsWith('use') &&
  !name.startsWith('create') &&
  !name.endsWith('Context') &&
  !name.endsWith('Provider');

const isReactComponent = (path: any): boolean => {
  if (!path?.node) return false;

  // Arrow functions and function declarations
  if (
    t.isArrowFunctionExpression(path.node) ||
    t.isFunctionDeclaration(path.node)
  ) {
    return true;
  }

  // Class components
  if (
    t.isClassDeclaration(path.node) &&
    path.node.superClass &&
    t.isMemberExpression(path.node.superClass) &&
    t.isIdentifier(path.node.superClass.object) &&
    path.node.superClass.object.name === 'React' &&
    t.isIdentifier(path.node.superClass.property) &&
    path.node.superClass.property.name === 'Component'
  ) {
    return true;
  }

  // Handle createReactClass and React.createClass
  if (t.isCallExpression(path.node)) {
    const callee = path.node.callee;

    // Direct createReactClass call
    if (t.isIdentifier(callee) && callee.name === 'createReactClass') {
      return true;
    }

    // React.createClass call
    if (
      t.isMemberExpression(callee) &&
      t.isIdentifier(callee.object) &&
      callee.object.name === 'React' &&
      t.isIdentifier(callee.property) &&
      callee.property.name === 'createClass'
    ) {
      return true;
    }

    // Handle factory functions that return components
    if (t.isIdentifier(callee)) {
      // Check if the function name follows a component factory pattern
      if (
        callee.name.startsWith('create') ||
        callee.name.endsWith('Component')
      ) {
        return true;
      }
    }

    // Handle HOCs (withX functions)
    if (t.isIdentifier(callee) && callee.name.startsWith('with')) {
      return true;
    }

    // Handle composed components
    if (t.isCallExpression(callee)) {
      return path.node.arguments.some(
        (arg: t.Node) =>
          (t.isIdentifier(arg) && /^[A-Z]/.exec(arg.name)) ??
          isReactComponent({ node: arg }),
      );
    }

    // Handle React.memo and React.forwardRef
    if (t.isMemberExpression(callee)) {
      return (
        t.isIdentifier(callee.object) &&
        callee.object.name === 'React' &&
        t.isIdentifier(callee.property) &&
        ['memo', 'forwardRef', 'createClass'].includes(callee.property.name)
      );
    }
  }

  return false;
};

const hasJSX = (path: NodePath) => {
  let jsx = false;
  path.traverse({
    JSXElement(path) {
      jsx = true;
      path.stop();
    },
    JSXFragment(path) {
      jsx = true;
      path.stop();
    },
  });
  return jsx;
};

const createBabelPlugin = (): PluginObj => {
  return {
    name: 'react-component-name',
    visitor: {
      Program: {
        exit(path) {
          const hasDisplayNameAssignment = new Set<string>();

          // First pass: collect existing displayName assignments
          path.traverse({
            AssignmentExpression(path) {
              const { node } = path;
              if (
                t.isMemberExpression(node.left) &&
                t.isIdentifier(node.left.property) &&
                node.left.property.name === 'displayName' &&
                t.isIdentifier(node.left.object)
              ) {
                hasDisplayNameAssignment.add(node.left.object.name);
              }
            },
          });

          // Second pass: add displayName assignments
          path.traverse({
            'ClassDeclaration|FunctionDeclaration|VariableDeclarator'(path) {
              let componentName: string | undefined;
              let componentPath;

              if (!hasJSX(path)) return;

              // Grab names of the component
              if (t.isClassDeclaration(path.node) && path.node.id?.name) {
                componentName = path.node.id.name;
                componentPath = path;
              } else if (
                t.isFunctionDeclaration(path.node) &&
                path.node.id?.name
              ) {
                componentName = path.node.id.name;
                componentPath = path;
              } else if (
                t.isVariableDeclarator(path.node) &&
                t.isIdentifier(path.node.id)
              ) {
                componentName = path.node.id.name;
                componentPath = path.get('init');
              }

              // If the component is a valid component name and not already assigned a displayName, add it
              if (
                componentName &&
                isComponentName(componentName) &&
                !hasDisplayNameAssignment.has(componentName) &&
                isReactComponent(componentPath)
              ) {
                const displayNameAssignment = t.tryStatement(
                  t.blockStatement([
                    t.expressionStatement(
                      t.assignmentExpression(
                        '=',
                        t.memberExpression(
                          t.identifier(componentName),
                          t.identifier('displayName'),
                        ),
                        t.stringLiteral(componentName),
                      ),
                    ),
                  ]),
                  t.catchClause(null, t.blockStatement([])),
                );

                // Find the parent statement
                let targetPath: babel.NodePath | null = path;
                while (targetPath && !t.isStatement(targetPath.node)) {
                  targetPath = targetPath.parentPath;
                }

                if (targetPath) {
                  targetPath.insertAfter(displayNameAssignment);
                }
              }
            },
          });
        },
      },
    },
  };
};

export const transform = async (
  code: string,
  id: string,
  filter: (id: string) => boolean,
) => {
  if (!filter(id)) return null;

  try {
    const result = await transformAsync(code, {
      plugins: [createBabelPlugin()],
      ignore: [/\/(?<c>build|node_modules)\//],
      parserOpts: {
        plugins: ['jsx', 'typescript', 'decorators'],
      },
      cloneInputAst: false,
      filename: id,
      ast: false,
      highlightCode: false,
      sourceMaps: true,
      configFile: false,
      babelrc: false,
      generatorOpts: {
        jsescOption: {
          quotes: 'single',
          minimal: true,
        },
      },
    });

    if (result?.code) {
      return { code: result.code ?? '', map: result.map };
    }

    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing file:', id, error);
    return null;
  }
};

export const DEFAULT_INCLUDE = '**/*.{mtsx,mjsx,tsx,jsx,ts,js}';
export const DEFAULT_EXCLUDE = '**/node_modules/**';
export const reactComponentNamePlugin = createUnplugin<Options>(
  (options?: Options) => {
    // mirror to loader.ts when changing this
    const filter = createFilter(
      options?.include || DEFAULT_INCLUDE,
      options?.exclude || [
        DEFAULT_EXCLUDE,
        // Next.js pages dir specific
        '**/_app.{jsx,tsx,js,ts}',
        '**/_document.{jsx,tsx,js,ts}',
        '**/api/**/*',
        // Million.js specific
        '**/.million/**/*',
      ],
    );

    return {
      name: 'react-component-name',
      enforce: 'post',
      async transform(code, id) {
        return transform(code, id, filter);
      },
    };
  },
);

export default reactComponentNamePlugin;
