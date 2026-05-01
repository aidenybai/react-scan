import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{js,ts,tsx}": "vp check --fix",
  },
  lint: {
    ignorePatterns: [
      ".next",
      "dist",
      "build",
      "node_modules",
      "test-results",
      "playwright-report",
      "packages/website/public/auto.global.js",
      "bin",
      "**/*.css",
      "**/*.astro",
    ],
    plugins: ["typescript", "react", "import"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn",
      "no-array-constructor": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-extra-non-null-assertion": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-this-alias": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",
      "@typescript-eslint/no-unsafe-declaration-merging": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "no-unused-expressions": "error",
      "no-unused-vars": [
        "warn",
        {
          "vars": "all",
          "args": "all",
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrors": "none",
        },
      ],
      "@typescript-eslint/no-wrapper-object-types": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/prefer-namespace-keyword": "error",
      "@typescript-eslint/triple-slash-reference": "error",
      "react/no-danger": "error",
    },
    overrides: [
      {
        files: ["packages/**/*.{ts,tsx}", "kitchen-sink/**/*.{ts,tsx}"],
        rules: {
          "no-var": "error",
          "prefer-rest-params": "error",
          "prefer-spread": "error",
        },
      },
      {
        files: ["**/*.tsx"],
        rules: {
          "no-unassigned-vars": "off",
        },
      },
    ],
  },
  fmt: {
    semi: true,
    singleQuote: false,
    ignorePatterns: [
      ".next",
      "node_modules",
      "dist",
      "build",
      "pnpm-lock.yaml",
      "packages/website/public/auto.global.js",
    ],
  },
});
