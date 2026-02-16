import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';
import prompts from 'prompts';
import {
  type DiffLine,
  type PackageManager,
  FRAMEWORK_NAMES,
  INSTALL_COMMANDS,
  detectProject,
  generateDiff,
  previewTransform,
} from './cli-utils.mjs';

const VERSION = process.env.NPM_PACKAGE_VERSION ?? '0.0.0';

// --- Diff ---

const printDiff = (filePath: string, original: string, updated: string): void => {
  const diff = generateDiff(original, updated);
  const contextLines = 3;
  const changedIndices = diff
    .map((line: DiffLine, i: number) => (line.type !== 'unchanged' ? i : -1))
    .filter((i: number) => i !== -1);

  if (changedIndices.length === 0) {
    console.log(pc.dim('  No changes'));
    return;
  }

  console.log(`\n${pc.bold(`File: ${filePath}`)}`);
  console.log(pc.dim('─'.repeat(60)));

  let lastPrintedIdx = -1;

  for (const changedIdx of changedIndices) {
    const start = Math.max(0, changedIdx - contextLines);
    const end = Math.min(diff.length - 1, changedIdx + contextLines);

    if (start > lastPrintedIdx + 1 && lastPrintedIdx !== -1) {
      console.log(pc.dim('  ...'));
    }

    for (let i = Math.max(start, lastPrintedIdx + 1); i <= end; i++) {
      const line = diff[i];
      if (line.type === 'added') {
        console.log(pc.green(`+ ${line.content}`));
      } else if (line.type === 'removed') {
        console.log(pc.red(`- ${line.content}`));
      } else {
        console.log(pc.dim(`  ${line.content}`));
      }
      lastPrintedIdx = i;
    }
  }

  console.log(pc.dim('─'.repeat(60)));
};

// --- Install ---

const installPackages = (
  packages: string[],
  packageManager: PackageManager,
  projectRoot: string,
): void => {
  if (packages.length === 0) return;

  const command = `${INSTALL_COMMANDS[packageManager]} ${packages.join(' ')}`;
  console.log(pc.dim(`  Running: ${command}\n`));

  execSync(command, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
};

// --- Main ---

const program = new Command()
  .name('react-scan')
  .description('React Scan CLI')
  .version(VERSION);

program
  .command('init')
  .description('Set up React Scan in your project')
  .option('-y, --yes', 'skip confirmation prompts', false)
  .option('-c, --cwd <cwd>', 'working directory', process.cwd())
  .option('--skip-install', 'skip package installation', false)
  .action(async (opts) => {
    console.log(`\n${pc.magenta('[·]')} ${pc.bold('React Scan')} ${pc.dim(`v${VERSION}`)}\n`);

    try {
      const cwd = resolve(opts.cwd);

      if (!existsSync(cwd)) {
        console.error(pc.red(`Directory does not exist: ${cwd}`));
        process.exit(1);
      }

      if (!existsSync(join(cwd, 'package.json'))) {
        console.error(pc.red('No package.json found. Run this command from a project root.'));
        process.exit(1);
      }

      console.log(pc.dim('  Detecting project...\n'));

      const project = detectProject(cwd);

      if (project.framework === 'unknown') {
        console.error(pc.red('  Could not detect a supported framework.'));
        console.log(pc.dim('  React Scan supports Next.js, Vite, and Webpack projects.'));
        console.log(pc.dim('  Visit https://github.com/aidenybai/react-scan#install for manual setup.\n'));
        process.exit(1);
      }

      console.log(`  Framework:       ${pc.cyan(FRAMEWORK_NAMES[project.framework])}`);
      if (project.framework === 'next') {
        console.log(`  Router:          ${pc.cyan(project.nextRouterType === 'app' ? 'App Router' : 'Pages Router')}`);
      }
      console.log(`  Package manager: ${pc.cyan(project.packageManager)}`);
      console.log();

      if (project.hasReactScan) {
        console.log(pc.green('  React Scan is already installed in package.json.'));
        console.log(pc.dim('  Checking if code setup is needed...\n'));
      }

      const result = previewTransform(cwd, project.framework, project.nextRouterType);

      if (!result.success) {
        console.error(pc.red(`  ${result.message}\n`));
        process.exit(1);
      }

      if (result.noChanges) {
        console.log(pc.green('  React Scan is already set up in your project.\n'));
        process.exit(0);
      }

      if (result.originalContent && result.newContent) {
        printDiff(
          relative(cwd, result.filePath),
          result.originalContent,
          result.newContent,
        );

        console.log();
        console.log(pc.yellow('  Auto-detection may not be 100% accurate.'));
        console.log(pc.yellow('  Please verify the changes before committing.\n'));

        if (!opts.yes) {
          const { proceed } = await prompts({
            type: 'confirm',
            name: 'proceed',
            message: 'Apply these changes?',
            initial: true,
          });

          if (!proceed) {
            console.log(pc.dim('\n  Changes cancelled.\n'));
            process.exit(0);
          }
        }
      }

      if (!opts.skipInstall && !project.hasReactScan) {
        console.log(pc.dim('\n  Installing react-scan...\n'));
        installPackages(['react-scan'], project.packageManager, cwd);
        console.log();
      }

      if (result.newContent) {
        writeFileSync(result.filePath, result.newContent, 'utf-8');
        console.log(pc.green(`  Updated ${relative(cwd, result.filePath)}`));
      }

      console.log();
      console.log(`${pc.green('  Success!')} React Scan has been installed.`);
      console.log(pc.dim('  You may now start your development server.\n'));
    } catch (error) {
      console.error(pc.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

program.parse();
