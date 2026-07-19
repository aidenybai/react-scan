import { rmSync } from "node:fs";
import { defineConfig } from "vite-plus";
import type { Plugin } from "vite-plus";
import type { PackUserConfig } from "vite-plus/pack";
import packageJson from "./package.json";
import {
  cssTextPlugin,
  declarationsOnlyPlugin,
  solidVitePlugin,
  solidWebBrowserPlugin,
  workerCodePlugin,
} from "./solid-vite-plugin";

const DIST_PATH = "./dist";
const BROWSER_TARGET = "es2019";
const USE_CLIENT_DIRECTIVE = "'use client';";
const IS_COVERAGE_BUILD = process.env.REACT_SCAN_COVERAGE === "true";
let hasCleanedDist = false;

const licenseBanner = `/**
 * Copyright 2025 Aiden Bai, Million Software, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */`;

const browserExternalDependencies = [
  "react",
  "react-dom",
  "next",
  "next/navigation",
  "react-router",
  "react-router-dom",
  "@remix-run/react",
];

const reactComponentNameExternalDependencies = [
  "unplugin",
  "estree-walker",
  "@rollup/pluginutils",
  "@babel/types",
  "@babel/parser",
  "@babel/traverse",
  "@babel/generator",
  "@babel/core",
  "rollup",
  "webpack",
  "esbuild",
  "rspack",
  "vite",
];

const browserModuleEntries = {
  index: "./src/index.ts",
  auto: "./src/auto.ts",
  "install-hook": "./src/install-hook.ts",
  "core/all-environments": "./src/core/all-environments.ts",
  "lite/index": "./src/lite/index.ts",
};

const reactComponentNameEntries = {
  "react-component-name/index": "./src/react-component-name/index.ts",
  "react-component-name/vite": "./src/react-component-name/vite.ts",
  "react-component-name/webpack": "./src/react-component-name/webpack.ts",
  "react-component-name/esbuild": "./src/react-component-name/esbuild.ts",
  "react-component-name/rspack": "./src/react-component-name/rspack.ts",
  "react-component-name/rolldown": "./src/react-component-name/rolldown.ts",
  "react-component-name/rollup": "./src/react-component-name/rollup.ts",
  "react-component-name/astro": "./src/react-component-name/astro.ts",
  "react-component-name/loader": "./src/react-component-name/loader.ts",
};

const declarationEntries = {
  index: "./src/core/index.ts",
  "install-hook": "./src/install-hook.ts",
  "core/all-environments": "./src/core/all-environments.ts",
  "lite/index": "./src/lite/index.ts",
  "rsc-shim": "./src/rsc-shim.ts",
  ...reactComponentNameEntries,
};

const createSharedPlugins = () => [solidWebBrowserPlugin(), cssTextPlugin(), solidVitePlugin()];

const cleanDistPlugin = (): Plugin => ({
  name: "clean-dist",
  buildStart() {
    if (hasCleanedDist || process.env.NODE_ENV === "development") return;
    rmSync(DIST_PATH, { force: true, recursive: true });
    hasCleanedDist = true;
  },
});

const moduleOutExtensions: NonNullable<PackUserConfig["outExtensions"]> = ({ format }) => ({
  js: format === "es" ? ".mjs" : ".js",
  dts: format === "es" ? ".d.mts" : ".d.ts",
});

const createIifePack = (name: string, entry: string): PackUserConfig => ({
  entry: { [name]: entry },
  outDir: DIST_PATH,
  format: ["iife"],
  dts: false,
  clean: false,
  hash: false,
  platform: "browser",
  target: BROWSER_TARGET,
  sourcemap: IS_COVERAGE_BUILD,
  minify: process.env.NODE_ENV === "production" && !IS_COVERAGE_BUILD,
  banner: licenseBanner,
  env: {
    NODE_ENV: process.env.NODE_ENV ?? "development",
  },
  loader: {
    ".css": "text",
  },
  deps: {
    neverBundle: browserExternalDependencies,
    alwaysBundle: [/^bippy(?:\/|$)/, /^react-grab(?:\/|$)/, /^solid-js(?:\/|$)/],
    onlyBundle: false,
  },
  outputOptions: {
    entryFileNames: "[name].global.js",
    globals: {
      react: "React",
    },
  },
  plugins: [cleanDistPlugin(), ...createSharedPlugins(), workerCodePlugin()],
});

const createBrowserModulePack = (name: string, entry: string): PackUserConfig => ({
  entry: { [name]: entry },
  outDir: DIST_PATH,
  format: ["cjs", "esm"],
  dts: false,
  clean: false,
  hash: false,
  platform: "browser",
  target: BROWSER_TARGET,
  sourcemap: IS_COVERAGE_BUILD,
  minify: false,
  treeshake: false,
  banner: `${USE_CLIENT_DIRECTIVE}\n${licenseBanner}`,
  env: {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    NPM_PACKAGE_VERSION: packageJson.version,
  },
  loader: {
    ".css": "text",
  },
  deps: {
    neverBundle: browserExternalDependencies,
    alwaysBundle: [/^bippy(?:\/|$)/, /^react-grab(?:\/|$)/, /^solid-js(?:\/|$)/],
    onlyBundle: false,
  },
  outExtensions: moduleOutExtensions,
  outputOptions: {
    codeSplitting: false,
  },
  plugins: [cleanDistPlugin(), ...createSharedPlugins(), workerCodePlugin()],
});

const createReactComponentNamePack = (name: string, entry: string): PackUserConfig => ({
  entry: { [name]: entry },
  outDir: DIST_PATH,
  format: ["cjs", "esm"],
  dts: false,
  clean: false,
  hash: false,
  platform: "node",
  target: "esnext",
  sourcemap: IS_COVERAGE_BUILD,
  minify: false,
  treeshake: true,
  banner: licenseBanner,
  env: {
    NODE_ENV: process.env.NODE_ENV ?? "development",
  },
  deps: {
    neverBundle: reactComponentNameExternalDependencies,
  },
  inputOptions: {
    resolve: {
      mainFields: ["module", "main"],
      conditionNames: ["import", "require", "node", "default"],
      symlinks: false,
    },
  },
  outExtensions: moduleOutExtensions,
  plugins: [cleanDistPlugin()],
});

const createDeclarationPack = (format: "cjs" | "esm"): PackUserConfig => ({
  entry: declarationEntries,
  outDir: DIST_PATH,
  format: [format],
  dts: {
    eager: true,
    emitDtsOnly: true,
    newContext: true,
    resolver: "tsc",
    sourcemap: false,
  },
  clean: false,
  hash: false,
  platform: "neutral",
  target: BROWSER_TARGET,
  sourcemap: false,
  outExtensions: moduleOutExtensions,
  deps: {
    onlyBundle: false,
  },
  plugins: [cleanDistPlugin(), ...createSharedPlugins(), declarationsOnlyPlugin()],
});

export default defineConfig({
  plugins: createSharedPlugins(),
  pack: [
    createIifePack("auto", "./src/auto.ts"),
    createIifePack("install-hook", "./src/install-hook.ts"),
    ...Object.entries(browserModuleEntries).map(([name, entry]) =>
      createBrowserModulePack(name, entry),
    ),
    {
      entry: { "rsc-shim": "./src/rsc-shim.ts" },
      outDir: DIST_PATH,
      format: ["cjs", "esm"],
      dts: false,
      clean: false,
      hash: false,
      platform: "neutral",
      target: BROWSER_TARGET,
      sourcemap: IS_COVERAGE_BUILD,
      minify: false,
      treeshake: true,
      banner: licenseBanner,
      outExtensions: moduleOutExtensions,
      plugins: [cleanDistPlugin()],
    },
    createDeclarationPack("cjs"),
    createDeclarationPack("esm"),
    {
      entry: { cli: "./src/cli.mts" },
      outDir: DIST_PATH,
      format: ["cjs"],
      dts: false,
      clean: false,
      hash: false,
      fixedExtension: false,
      platform: "node",
      target: "esnext",
      sourcemap: IS_COVERAGE_BUILD,
      minify: false,
      banner: licenseBanner,
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
        NPM_PACKAGE_VERSION: packageJson.version,
      },
      outExtensions: () => ({ js: ".js" }),
      plugins: [cleanDistPlugin()],
    },
    ...Object.entries(reactComponentNameEntries).map(([name, entry]) =>
      createReactComponentNamePack(name, entry),
    ),
  ],
});
