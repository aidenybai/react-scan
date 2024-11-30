// todo: add types
export default function ({ types: t }: { types: any }) {
  return {
    name: 'modify-react-scan',
    visitor: {
      Program(path: any, state: any) {
        const { filename } = state;

        const isProduction = process.env.NODE_ENV === 'production';
        if (!isProduction) {
          return;
        }

        if (filename) {
          if (filename.includes('node_modules/react-scan/dist/native.js')) {
            // replace the entire file with a stub in production
            path
              .get('body')
              .forEach((childPath: { node: unknown; remove: () => void }) => {
                if (t.isImportDeclaration(childPath.node)) {
                  childPath.remove();
                }
              });

            const reactScanDeclaration = t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier('ReactScan'),
                t.arrowFunctionExpression(
                  [
                    t.objectPattern([
                      t.objectProperty(
                        t.identifier('children'),
                        t.identifier('children'),
                        false,
                        true,
                      ),
                    ]),
                  ],
                  t.identifier('children'),
                ),
              ),
            ]);

            const exportsAssignment = t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.memberExpression(
                  t.identifier('exports'),
                  t.identifier('ReactScan'),
                ),
                t.identifier('ReactScan'),
              ),
            );

            path.node.body = [];

            path.pushContainer('body', reactScanDeclaration);
            path.pushContainer('body', exportsAssignment);
          }
        }
      },
    },
  };
}
