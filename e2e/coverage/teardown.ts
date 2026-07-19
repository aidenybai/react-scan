import { relative } from "node:path";
import {
  COVERAGE_OUTPUT_DIRECTORY,
  COVERAGE_RAW_DIRECTORY,
  isReactScanSource,
  REPOSITORY_ROOT,
} from "./config";
import { generateCoverageReport } from "./report";

const teardownCoverage = async (): Promise<void> => {
  try {
    const summary = await generateCoverageReport({
      rawDirectory: COVERAGE_RAW_DIRECTORY,
      outputDirectory: COVERAGE_OUTPUT_DIRECTORY,
      baseDirectory: REPOSITORY_ROOT,
      name: "React Scan coverage",
      sourceFilter: isReactScanSource,
    });

    if (!summary) {
      console.warn("No V8 coverage was captured.");
      return;
    }

    console.log(
      `\nReact Scan line coverage: ${summary.percentageLines.toFixed(2)}% (${summary.coveredLines}/${summary.totalLines} lines across ${summary.fileCount} files)`,
    );
    console.log(`Reports written to ${relative(process.cwd(), COVERAGE_OUTPUT_DIRECTORY)}`);
  } catch (error) {
    console.warn("Failed to generate coverage report:", error);
  }
};

export default teardownCoverage;
