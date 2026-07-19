import { cleanRawCoverage } from "./capture";
import { COVERAGE_RAW_DIRECTORY } from "./config";

const setupCoverage = async (): Promise<void> => {
  cleanRawCoverage(COVERAGE_RAW_DIRECTORY);
};

export default setupCoverage;
