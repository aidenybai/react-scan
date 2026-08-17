import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const DIST_PATH = new URL("../dist/", import.meta.url);

const getDeclarationFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? getDeclarationFiles(entryPath) : entryPath;
    }),
  );
  return files.flat().filter((filePath) => /\.d\.(?:m)?ts$/.test(filePath));
};

const finalizeDeclarationFormat = async (declarationExtension, runtimeExtension) => {
  const internalDeclarationPath = new URL(`index${declarationExtension}`, DIST_PATH);
  const publicDeclarationPath = new URL(`index2${declarationExtension}`, DIST_PATH);
  const finalizedInternalPath = new URL(`internal-index${declarationExtension}`, DIST_PATH);
  const declarationFiles = await getDeclarationFiles(DIST_PATH.pathname);
  const importPattern = new RegExp(`((?:\\.\\./)+|\\./)index\\${runtimeExtension}`, "g");

  await Promise.all(
    declarationFiles.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      const nextSource = source.replace(importPattern, `$1internal-index${runtimeExtension}`);
      if (nextSource !== source) {
        await writeFile(filePath, nextSource);
      }
    }),
  );

  await rename(internalDeclarationPath, finalizedInternalPath);
  await rename(publicDeclarationPath, internalDeclarationPath);
};

await finalizeDeclarationFormat(".d.ts", ".js");
await finalizeDeclarationFormat(".d.mts", ".mjs");
