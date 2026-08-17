import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const E2E_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const REPOSITORY_ROOT = resolve(E2E_DIRECTORY, "..");
export const COVERAGE_OUTPUT_DIRECTORY = resolve(REPOSITORY_ROOT, "coverage");
export const COVERAGE_RAW_DIRECTORY = resolve(REPOSITORY_ROOT, ".coverage-v8");

export const isReactScanSource = (sourcePath: string): boolean => {
  const normalizedSourcePath = sourcePath.replaceAll("\\", "/");
  return (
    !normalizedSourcePath.includes("/node_modules/") &&
    normalizedSourcePath.includes("packages/scan/src/")
  );
};
