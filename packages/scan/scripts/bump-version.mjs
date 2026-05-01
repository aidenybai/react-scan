import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scanPackagePath = path.join(__dirname, "../package.json");
const scanPackage = JSON.parse(fs.readFileSync(scanPackagePath, "utf8"));

const version = scanPackage.version.split(".");
version[2] = Number.parseInt(version[2]) + 1;
const newVersion = version.join(".");

scanPackage.version = newVersion;
fs.writeFileSync(scanPackagePath, `${JSON.stringify(scanPackage, null, 2)}\n`);

const tarFileName = `react-scan-${newVersion}.tgz`;
const tarFilePath = path.join(__dirname, "..", tarFileName);

execSync(`echo "${tarFilePath}" | pbcopy`);

// oxlint-disable-next-line no-console
console.log(`Bumped version to ${newVersion}`);
// oxlint-disable-next-line no-console
console.log(`Tar file path copied to clipboard: ${tarFilePath}`);
