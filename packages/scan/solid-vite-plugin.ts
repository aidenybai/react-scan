import * as babel from "@babel/core";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite-plus";

const CSS_DEFAULT_IMPORT_PATTERN = /import\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']+\.css)["'];?/g;
const PACKAGE_ROOT = dirname(fileURLToPath(import.meta.url));
const OFFSCREEN_CANVAS_WORKER_PATH = resolve(
  PACKAGE_ROOT,
  "src/new-outlines/offscreen-canvas.worker.ts",
);
const NEW_OUTLINES_PATH = resolve(PACKAGE_ROOT, "src/new-outlines/index.ts");
const WORKER_CODE_DECLARATION = 'const workerCode = "__WORKER_CODE__";';

let workerCodePromise: Promise<string> | undefined;

const compileWorkerCode = async (): Promise<string> => {
  const result = await build({
    entryPoints: [OFFSCREEN_CANVAS_WORKER_PATH],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: "es2019",
    minify: true,
  });
  const outputFile = result.outputFiles[0];
  if (!outputFile) {
    throw new Error("Failed to compile the offscreen canvas worker");
  }
  return outputFile.text;
};

export const cssTextPlugin = (): Plugin => ({
  name: "css-text",
  enforce: "pre",
  transform(source, id) {
    const importerPath = id.split("?")[0];
    const transformedSource = source.replace(
      CSS_DEFAULT_IMPORT_PATTERN,
      (statement, variableName: string, cssPath: string) => {
        if (!cssPath.startsWith(".") && !cssPath.startsWith("/")) return statement;
        const resolvedPath = cssPath.startsWith("/")
          ? cssPath
          : resolve(dirname(importerPath), cssPath);
        return `const ${variableName} = ${JSON.stringify(readFileSync(resolvedPath, "utf8"))};`;
      },
    );
    if (transformedSource === source) return;
    return {
      code: transformedSource,
      map: null,
    };
  },
});

export const solidWebBrowserPlugin = (): Plugin => {
  const require = createRequire(import.meta.url);
  const serverPath = require.resolve("solid-js/web");
  const browserPath = resolve(dirname(serverPath), "web.js");

  return {
    name: "solid-web-browser",
    enforce: "pre" as const,
    resolveId(source: string) {
      if (source === "solid-js/web") return browserPath;
    },
  };
};

export const solidVitePlugin = (): Plugin => ({
  name: "solid-babel",
  transform(source: string, id: string) {
    if (!/\.(tsx|jsx)$/.test(id)) return;

    const result = babel.transformSync(source, {
      presets: [
        ["@babel/preset-typescript", { onlyRemoveTypeImports: true }],
        "babel-preset-solid",
      ],
      filename: id,
      sourceMaps: true,
      caller: {
        name: "solid-babel",
        supportsStaticESM: true,
      },
    });

    if (!result?.code) return;
    return {
      code: result.code,
      map: result.map,
    };
  },
});

export const workerCodePlugin = (): Plugin => {
  let workerCode = "";

  return {
    name: "offscreen-canvas-worker-code",
    async buildStart() {
      workerCodePromise ??= compileWorkerCode();
      workerCode = await workerCodePromise;
    },
    transform(source, id) {
      if (id.split("?")[0] !== NEW_OUTLINES_PATH) return;
      if (!source.includes(WORKER_CODE_DECLARATION)) {
        this.error(`Missing worker code declaration in ${id}`);
      }
      return {
        code: source.replace(
          WORKER_CODE_DECLARATION,
          `const workerCode = ${JSON.stringify(workerCode)};`,
        ),
        map: null,
      };
    },
  };
};

export const declarationsOnlyPlugin = (): Plugin => ({
  name: "declarations-only",
  generateBundle: {
    order: "post",
    handler(_outputOptions, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (!fileName.endsWith(".d.ts") && !fileName.endsWith(".d.mts")) {
          delete bundle[fileName];
        }
      }
    },
  },
});
