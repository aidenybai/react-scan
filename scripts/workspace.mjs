/* eslint-disable no-console */
import { execSync, spawn } from 'node:child_process';

const runCommand = (command, filters = []) => {
  const filterArgs = filters.map((filter) => `--filter ${filter}`).join(' ');
  execSync(`WORKSPACE_BUILD=1 pnpm ${filterArgs} ${command}`, { stdio: 'inherit' });
};

const buildAll = () => {
  runCommand('build', ['react-scan']);
  runCommand('build', ['./packages/*', '!react-scan']);
}

const devAll = () => {
  // Start scan build with pipe to capture output
  const scanProcess = spawn('pnpm', ['--filter', 'react-scan', 'dev'], {
    stdio: ['inherit', 'pipe', 'inherit'], // Pipe stdout, inherit others
    shell: true,
    env: { ...process.env, WORKSPACE_BUILD: '1' }
  });

  // Forward stdout while watching for build success
  let isFirstBuild = true;
  scanProcess.stdout?.on('data', (data) => {
    process.stdout.write(data); // Forward output

    if (isFirstBuild && data.toString().includes('⚡️ Build success')) {
      isFirstBuild = false;

      // Start other processes after initial build
      const otherProcess = spawn('pnpm', [
        '--filter',
        '"./packages/*"',
        '--filter',
        '"!react-scan"',
        '--parallel',
        'dev'
      ], {
        stdio: 'inherit',
        shell: true
      });

      // Handle Ctrl+C for both processes
      process.on('SIGINT', () => {
        scanProcess.kill('SIGINT');
        otherProcess.kill('SIGINT');
        process.exit(0);
      });
    }
  });
}

const packAll = () => {
  runCommand('pack', ['react-scan']);
  runCommand('--parallel pack', ['./packages/*', '!react-scan']);
}

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.includes('build')) buildAll();
else if (args.includes('dev')) devAll();
else if (args.includes('pack')) packAll();
else console.error('Invalid command. Use: node workspace.mjs [build|dev|pack]');
