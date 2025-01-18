import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Read the current version from scan package.json
const scanPackagePath = path.join(__dirname, '../package.json');
const scanPackage = JSON.parse(fs.readFileSync(scanPackagePath, 'utf8'));

// Bump patch version
const version = scanPackage.version.split('.');
version[2] = Number.parseInt(version[2]) + 1;
const newVersion = version.join('.');

// Update the version in package.json
scanPackage.version = newVersion;

// Write back to package.json
fs.writeFileSync(scanPackagePath, `${JSON.stringify(scanPackage, null, 2)}\n`);

// Get the tar file path
const tarFileName = `react-scan-${newVersion}.tgz`;
const tarFilePath = path.join(__dirname, '..', tarFileName);

// Copy to clipboard
execSync(`echo "${tarFilePath}" | pbcopy`);

// biome-ignore lint/suspicious/noConsole: Intended debug output
console.log(`Bumped version to ${newVersion}`);
// biome-ignore lint/suspicious/noConsole: Intended debug output
console.log(`Tar file path copied to clipboard: ${tarFilePath}`);
