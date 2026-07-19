import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { V8CoverageEntry } from "./capture";

const SOURCE_MAP_PATTERN = /\/\/[#@]\s*sourceMappingURL=(\S+)/;
const DEFAULT_REPORTS = ["v8", "console-details", "lcovonly"];

interface ScriptCoverage {
  functions: unknown[];
}

interface MergeV8Coverage {
  (scriptCoverages: ScriptCoverage[]): ScriptCoverage;
}

interface MonocartUtility {
  mergeV8Coverage: MergeV8Coverage;
}

interface CoverageAccumulator {
  source: string;
  mergedCoverage: ScriptCoverage;
}

interface SourceMapData {
  sources?: string[];
  sourceRoot?: string;
}

export interface CoverageSummary {
  fileCount: number;
  coveredLines: number;
  totalLines: number;
  percentageLines: number;
}

export interface GenerateCoverageReportOptions {
  rawDirectory: string;
  outputDirectory: string;
  baseDirectory: string;
  name: string;
  sourceFilter: (sourcePath: string) => boolean;
}

const urlToLocalPath = (url: string): string | null => {
  if (url.startsWith("file://")) {
    try {
      return fileURLToPath(url);
    } catch {
      return null;
    }
  }

  try {
    const pathname = new URL(url).pathname;
    const fileSystemMarker = "/@fs";
    const fileSystemMarkerIndex = pathname.indexOf(`${fileSystemMarker}/`);

    if (fileSystemMarkerIndex !== -1) {
      return decodeURIComponent(pathname.slice(fileSystemMarkerIndex + fileSystemMarker.length));
    }
  } catch {
    return isAbsolute(url) && existsSync(url) ? url : null;
  }

  if (isAbsolute(url) && existsSync(url)) return url;
  return null;
};

const inlineSourceMap = (source: string, sourceMap: string): string => {
  const sourceMapDataUrl = `data:application/json;base64,${Buffer.from(sourceMap).toString("base64")}`;

  if (SOURCE_MAP_PATTERN.test(source)) {
    return source.replace(SOURCE_MAP_PATTERN, `//# sourceMappingURL=${sourceMapDataUrl}`);
  }

  return `${source}\n//# sourceMappingURL=${sourceMapDataUrl}`;
};

const absolutizeSourceMap = (sourceMapJson: string, sourceMapPath: string): string => {
  const sourceMap = JSON.parse(sourceMapJson) as SourceMapData;
  const sourceMapDirectory = dirname(sourceMapPath);
  const sourceRoot = sourceMap.sourceRoot ?? "";

  sourceMap.sources = (sourceMap.sources ?? []).map((sourcePath) =>
    isAbsolute(sourcePath) ? sourcePath : resolve(sourceMapDirectory, sourceRoot, sourcePath),
  );
  sourceMap.sourceRoot = "";

  return JSON.stringify(sourceMap);
};

const mergeRawCoverage = (
  rawDirectory: string,
  mergeV8Coverage: MergeV8Coverage,
): Map<string, CoverageAccumulator> => {
  const coverageByPath = new Map<string, CoverageAccumulator>();
  let rawCoverageFiles: string[];

  try {
    rawCoverageFiles = readdirSync(rawDirectory);
  } catch {
    return coverageByPath;
  }

  for (const rawCoverageFile of rawCoverageFiles) {
    if (!rawCoverageFile.endsWith(".json")) continue;

    let coverageEntries: V8CoverageEntry[];
    try {
      coverageEntries = JSON.parse(readFileSync(join(rawDirectory, rawCoverageFile), "utf8"));
    } catch {
      continue;
    }

    if (!Array.isArray(coverageEntries)) continue;

    for (const coverageEntry of coverageEntries) {
      if (!coverageEntry.url || typeof coverageEntry.source !== "string") {
        continue;
      }

      const localPath = urlToLocalPath(coverageEntry.url);
      if (!localPath || !existsSync(`${localPath}.map`)) continue;

      const scriptCoverage: ScriptCoverage = {
        functions: coverageEntry.functions ?? [],
      };
      const accumulator = coverageByPath.get(localPath);

      if (accumulator) {
        accumulator.mergedCoverage = mergeV8Coverage([accumulator.mergedCoverage, scriptCoverage]);
      } else {
        coverageByPath.set(localPath, {
          source: coverageEntry.source,
          mergedCoverage: scriptCoverage,
        });
      }
    }
  }

  return coverageByPath;
};

const createReportEntries = (
  coverageByPath: Map<string, CoverageAccumulator>,
): V8CoverageEntry[] => {
  const reportEntries: V8CoverageEntry[] = [];

  for (const [localPath, accumulator] of coverageByPath) {
    const sourceMapPath = `${localPath}.map`;

    try {
      const sourceMap = absolutizeSourceMap(readFileSync(sourceMapPath, "utf8"), sourceMapPath);
      reportEntries.push({
        url: localPath,
        source: inlineSourceMap(accumulator.source, sourceMap),
        scriptId: "0",
        functions: accumulator.mergedCoverage.functions,
      });
    } catch {
      continue;
    }
  }

  return reportEntries;
};

export const generateCoverageReport = async (
  options: GenerateCoverageReportOptions,
): Promise<CoverageSummary | null> => {
  const { default: createCoverageReport } = await import("monocart-coverage-reports");
  const monocartUtility = createCoverageReport.Util as unknown as MonocartUtility;
  const coverageByPath = mergeRawCoverage(options.rawDirectory, monocartUtility.mergeV8Coverage);

  if (coverageByPath.size === 0) return null;

  const coverageReport = createCoverageReport({
    name: options.name,
    outputDir: options.outputDirectory,
    baseDir: options.baseDirectory,
    reports: DEFAULT_REPORTS,
    cleanCache: true,
    sourceFilter: options.sourceFilter,
  });

  await coverageReport.add(createReportEntries(coverageByPath));
  const results = await coverageReport.generate();
  if (!results) return null;

  const lineSummary = results.summary.lines;
  const percentageLines = typeof lineSummary.pct === "number" ? lineSummary.pct : 0;

  return {
    fileCount: results.files.length,
    coveredLines: lineSummary.covered,
    totalLines: lineSummary.total,
    percentageLines,
  };
};
