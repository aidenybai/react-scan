const { resolve } = require('node:path');

const project = resolve(__dirname, 'tsconfig.json');

module.exports = {
  root: true,
  extends: [
    require.resolve('@vercel/style-guide/eslint/node'),
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
  ],
  ignorePatterns: ['**/dist/*', '**/test/*'],
  parserOptions: {
    project,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    'import/no-default-export': 'off',
    'no-bitwise': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    'import/no-extraneous-dependencies': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-loop-func': 'off',
    'eslint-comments/disable-enable-pair': 'off',
    'import/no-cycle': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': 'off',
    'tsdoc/syntax': 'off',
    'eslint-comments/require-description': 'off',
    'import/no-relative-packages': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/require-await': 'off',
    // '@typescript-eslint/no-floating-promises': ['error'],
    'import/no-named-as-default': 'off',
    'no-implicit-coercion': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    'object-shorthand': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    'no-useless-return': 'off',
    'func-names': 'off',
    '@typescript-eslint/prefer-for-of': 'off',
    // 'no-implicit-coercion': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/array-type': ['error', { default: 'generic' }],
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
};
