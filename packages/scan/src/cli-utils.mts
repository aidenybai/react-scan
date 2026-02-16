import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';
type Framework = 'next' | 'vite' | 'tanstack' | 'webpack' | 'unknown';
type NextRouterType = 'app' | 'pages' | 'unknown';

interface ProjectInfo {
  packageManager: PackageManager;
  framework: Framework;
  nextRouterType: NextRouterType;
  projectRoot: string;
  hasReactScan: boolean;
}

interface TransformResult {
  success: boolean;
  filePath: string;
  message: string;
  originalContent?: string;
  newContent?: string;
  noChanges?: boolean;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

const FRAMEWORK_NAMES: Record<Framework, string> = {
  next: 'Next.js',
  vite: 'Vite',
  tanstack: 'TanStack Start',
  webpack: 'Webpack',
  unknown: 'Unknown',
};

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  npm: 'npm install -D',
  yarn: 'yarn add -D',
  pnpm: 'pnpm add -D',
  bun: 'bun add -D',
};

// --- Templates ---

const REACT_SCAN_SCRIPT_TAG = '<script src="https://unpkg.com/react-scan/dist/auto.global.js" crossorigin="anonymous"></script>';

const NEXT_APP_ROUTER_SCRIPT = `{process.env.NODE_ENV === "development" && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" crossOrigin="anonymous" />
        )}`;

const NEXT_PAGES_ROUTER_SCRIPT = `{process.env.NODE_ENV === "development" && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" crossOrigin="anonymous" />
        )}`;

const VITE_SCRIPT = `<script src="https://unpkg.com/react-scan/dist/auto.global.js" crossorigin="anonymous"></script>`;

const WEBPACK_IMPORT = `if (process.env.NODE_ENV === "development") {
  import("react-scan");
}`;

// --- Detection ---

const detectPackageManager = (projectRoot: string): PackageManager => {
  if (existsSync(join(projectRoot, 'bun.lockb')) || existsSync(join(projectRoot, 'bun.lock'))) return 'bun';
  if (existsSync(join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(projectRoot, 'yarn.lock'))) return 'yarn';
  return 'npm';
};

const detectFramework = (projectRoot: string): Framework => {
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(packageJsonPath)) return 'unknown';

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (allDeps['next']) return 'next';
    if (allDeps['@tanstack/react-start']) return 'tanstack';
    if (allDeps['vite']) return 'vite';
    if (allDeps['webpack'] || allDeps['react-scripts']) return 'webpack';

    return 'unknown';
  } catch {
    return 'unknown';
  }
};

const detectNextRouterType = (projectRoot: string): NextRouterType => {
  if (existsSync(join(projectRoot, 'app')) || existsSync(join(projectRoot, 'src', 'app'))) return 'app';
  if (existsSync(join(projectRoot, 'pages')) || existsSync(join(projectRoot, 'src', 'pages'))) return 'pages';
  return 'unknown';
};

const detectProject = (cwd: string): ProjectInfo => {
  const packageManager = detectPackageManager(cwd);
  const framework = detectFramework(cwd);
  const nextRouterType = framework === 'next' ? detectNextRouterType(cwd) : 'unknown';

  const packageJsonPath = join(cwd, 'package.json');
  let hasReactScan = false;
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      hasReactScan = Boolean(allDeps['react-scan']);
    } catch { /* */ }
  }

  return {
    packageManager,
    framework,
    nextRouterType,
    projectRoot: cwd,
    hasReactScan,
  };
};

// --- File Finding ---

const findLayoutFile = (
  projectRoot: string,
  routerType: NextRouterType,
): string | null => {
  if (routerType === 'app') {
    const candidates = [
      join(projectRoot, 'app', 'layout.tsx'),
      join(projectRoot, 'app', 'layout.jsx'),
      join(projectRoot, 'app', 'layout.js'),
      join(projectRoot, 'src', 'app', 'layout.tsx'),
      join(projectRoot, 'src', 'app', 'layout.jsx'),
      join(projectRoot, 'src', 'app', 'layout.js'),
    ];
    return candidates.find(existsSync) ?? null;
  }

  if (routerType === 'pages') {
    const candidates = [
      join(projectRoot, 'pages', '_document.tsx'),
      join(projectRoot, 'pages', '_document.jsx'),
      join(projectRoot, 'pages', '_document.js'),
      join(projectRoot, 'src', 'pages', '_document.tsx'),
      join(projectRoot, 'src', 'pages', '_document.jsx'),
      join(projectRoot, 'src', 'pages', '_document.js'),
    ];
    return candidates.find(existsSync) ?? null;
  }

  return null;
};

const findIndexHtml = (projectRoot: string): string | null => {
  const candidates = [
    join(projectRoot, 'index.html'),
    join(projectRoot, 'public', 'index.html'),
    join(projectRoot, 'src', 'index.html'),
  ];
  return candidates.find(existsSync) ?? null;
};

const findEntryFile = (projectRoot: string): string | null => {
  const candidates = [
    join(projectRoot, 'src', 'index.tsx'),
    join(projectRoot, 'src', 'index.ts'),
    join(projectRoot, 'src', 'index.jsx'),
    join(projectRoot, 'src', 'index.js'),
    join(projectRoot, 'src', 'main.tsx'),
    join(projectRoot, 'src', 'main.ts'),
    join(projectRoot, 'src', 'main.jsx'),
    join(projectRoot, 'src', 'main.js'),
  ];
  return candidates.find(existsSync) ?? null;
};

const hasReactScanCode = (content: string): boolean => {
  return content.includes('react-scan') || content.includes('react_scan');
};

// --- Transform ---

const transformNextAppRouter = (
  projectRoot: string,
  routerType: NextRouterType,
): TransformResult => {
  const layoutPath = findLayoutFile(projectRoot, routerType);
  if (!layoutPath) {
    return {
      success: false,
      filePath: '',
      message: 'Could not find app/layout.tsx',
    };
  }

  const originalContent = readFileSync(layoutPath, 'utf-8');

  if (hasReactScanCode(originalContent)) {
    return {
      success: true,
      filePath: layoutPath,
      message: 'React Scan is already installed.',
      noChanges: true,
    };
  }

  let newContent = originalContent;

  const headOpenMatch = newContent.match(/<head[^>]*>/);
  if (headOpenMatch) {
    const injection = `\n        ${NEXT_APP_ROUTER_SCRIPT}\n`;
    newContent = newContent.replace(
      headOpenMatch[0],
      `${headOpenMatch[0]}${injection}`,
    );
  } else {
    const bodyMatch = newContent.match(/<body[\s\S]*?>/);
    if (bodyMatch) {
      const injection = `\n        ${NEXT_APP_ROUTER_SCRIPT}`;
      newContent = newContent.replace(
        bodyMatch[0],
        `${bodyMatch[0]}${injection}`,
      );
    }
  }

  return {
    success: true,
    filePath: layoutPath,
    message: 'Success',
    originalContent,
    newContent,
  };
};

const transformNextPagesRouter = (
  projectRoot: string,
  routerType: NextRouterType,
): TransformResult => {
  const documentPath = findLayoutFile(projectRoot, routerType);
  if (!documentPath) {
    return {
      success: false,
      filePath: '',
      message: 'Could not find pages/_document.tsx',
    };
  }

  const originalContent = readFileSync(documentPath, 'utf-8');

  if (hasReactScanCode(originalContent)) {
    return {
      success: true,
      filePath: documentPath,
      message: 'React Scan is already installed.',
      noChanges: true,
    };
  }

  let newContent = originalContent;
  const injection = `\n        ${NEXT_PAGES_ROUTER_SCRIPT}`;

  const headMatch = newContent.match(/<Head>([\s\S]*?)<\/Head>/);
  if (headMatch) {
    newContent = newContent.replace('<Head>', `<Head>${injection}`);
  } else {
    const selfClosingHeadMatch = newContent.match(/<Head\s*\/>/);
    if (selfClosingHeadMatch) {
      newContent = newContent.replace(
        selfClosingHeadMatch[0],
        `<Head>${injection}\n      </Head>`,
      );
    }
  }

  if (newContent === originalContent) {
    return {
      success: false,
      filePath: documentPath,
      message:
        'Could not find <Head> component in _document file to inject React Scan script.',
    };
  }

  return {
    success: true,
    filePath: documentPath,
    message: 'Success',
    originalContent,
    newContent,
  };
};

const transformVite = (projectRoot: string): TransformResult => {
  const indexHtml = findIndexHtml(projectRoot);
  if (!indexHtml) {
    return {
      success: false,
      filePath: '',
      message: 'Could not find index.html',
    };
  }

  const originalContent = readFileSync(indexHtml, 'utf-8');

  if (hasReactScanCode(originalContent)) {
    return {
      success: true,
      filePath: indexHtml,
      message: 'React Scan is already installed.',
      noChanges: true,
    };
  }

  const headOpenMatch = originalContent.match(/<head[^>]*>/);
  if (!headOpenMatch) {
    return {
      success: false,
      filePath: indexHtml,
      message: 'Could not find <head> tag in index.html',
    };
  }

  const newContent = originalContent.replace(
    headOpenMatch[0],
    `${headOpenMatch[0]}\n    ${VITE_SCRIPT}`,
  );

  return {
    success: true,
    filePath: indexHtml,
    message: 'Success',
    originalContent,
    newContent,
  };
};

const transformWebpack = (projectRoot: string): TransformResult => {
  const indexHtml = findIndexHtml(projectRoot);
  if (indexHtml) {
    const originalContent = readFileSync(indexHtml, 'utf-8');
    if (hasReactScanCode(originalContent)) {
      return {
        success: true,
        filePath: indexHtml,
        message: 'React Scan is already installed.',
        noChanges: true,
      };
    }

    const headOpenMatch = originalContent.match(/<head[^>]*>/);
    if (!headOpenMatch) {
      return {
        success: false,
        filePath: indexHtml,
        message: 'Could not find <head> tag in index.html',
      };
    }

    const newContent = originalContent.replace(
      headOpenMatch[0],
      `${headOpenMatch[0]}\n    ${REACT_SCAN_SCRIPT_TAG}`,
    );

    return {
      success: true,
      filePath: indexHtml,
      message: 'Success',
      originalContent,
      newContent,
    };
  }

  const entryFile = findEntryFile(projectRoot);
  if (!entryFile) {
    return {
      success: false,
      filePath: '',
      message: 'Could not find entry file or index.html',
    };
  }

  const originalContent = readFileSync(entryFile, 'utf-8');
  if (hasReactScanCode(originalContent)) {
    return {
      success: true,
      filePath: entryFile,
      message: 'React Scan is already installed.',
      noChanges: true,
    };
  }

  const newContent = `${WEBPACK_IMPORT}\n\n${originalContent}`;

  return {
    success: true,
    filePath: entryFile,
    message: 'Success',
    originalContent,
    newContent,
  };
};

const previewTransform = (
  projectRoot: string,
  framework: Framework,
  nextRouterType: NextRouterType,
): TransformResult => {
  switch (framework) {
    case 'next':
      return nextRouterType === 'pages'
        ? transformNextPagesRouter(projectRoot, nextRouterType)
        : transformNextAppRouter(projectRoot, nextRouterType);
    case 'vite':
      return transformVite(projectRoot);
    case 'webpack':
      return transformWebpack(projectRoot);
    case 'tanstack':
    case 'unknown':
    default:
      return {
        success: false,
        filePath: '',
        message: `Framework "${framework}" is not yet supported by automatic setup. Visit https://github.com/aidenybai/react-scan#install for manual setup.`,
      };
  }
};

// --- Diff ---

const generateDiff = (original: string, updated: string): DiffLine[] => {
  const originalLines = original.split('\n');
  const newLines = updated.split('\n');
  const diff: DiffLine[] = [];

  let originalIdx = 0;
  let newIdx = 0;

  while (originalIdx < originalLines.length || newIdx < newLines.length) {
    const originalLine = originalLines[originalIdx];
    const newLine = newLines[newIdx];

    if (originalLine === newLine) {
      diff.push({ type: 'unchanged', content: originalLine });
      originalIdx++;
      newIdx++;
    } else if (originalLine === undefined) {
      diff.push({ type: 'added', content: newLine });
      newIdx++;
    } else if (newLine === undefined) {
      diff.push({ type: 'removed', content: originalLine });
      originalIdx++;
    } else {
      const originalInNew = newLines.indexOf(originalLine, newIdx);
      const newInOriginal = originalLines.indexOf(newLine, originalIdx);

      if (originalInNew !== -1 && (newInOriginal === -1 || originalInNew - newIdx < newInOriginal - originalIdx)) {
        while (newIdx < originalInNew) {
          diff.push({ type: 'added', content: newLines[newIdx] });
          newIdx++;
        }
      } else if (newInOriginal !== -1) {
        while (originalIdx < newInOriginal) {
          diff.push({ type: 'removed', content: originalLines[originalIdx] });
          originalIdx++;
        }
      } else {
        diff.push({ type: 'removed', content: originalLine });
        diff.push({ type: 'added', content: newLine });
        originalIdx++;
        newIdx++;
      }
    }
  }

  return diff;
};

export {
  type DiffLine,
  type Framework,
  type NextRouterType,
  type PackageManager,
  type ProjectInfo,
  type TransformResult,
  FRAMEWORK_NAMES,
  INSTALL_COMMANDS,
  NEXT_APP_ROUTER_SCRIPT,
  NEXT_PAGES_ROUTER_SCRIPT,
  REACT_SCAN_SCRIPT_TAG,
  VITE_SCRIPT,
  WEBPACK_IMPORT,
  detectFramework,
  detectNextRouterType,
  detectPackageManager,
  detectProject,
  findEntryFile,
  findIndexHtml,
  findLayoutFile,
  generateDiff,
  hasReactScanCode,
  previewTransform,
  transformNextAppRouter,
  transformNextPagesRouter,
  transformVite,
  transformWebpack,
};
