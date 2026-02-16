import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
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
} from './cli-utils.mjs';

let tempDirectory: string;

beforeEach(() => {
  tempDirectory = mkdtempSync(join(tmpdir(), 'react-scan-cli-test-'));
});

afterEach(() => {
  rmSync(tempDirectory, { recursive: true, force: true });
});

const writePackageJson = (
  directory: string,
  dependencies: Record<string, string> = {},
  devDependencies: Record<string, string> = {},
) => {
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ dependencies, devDependencies }),
  );
};

// --- detectPackageManager ---

describe('detectPackageManager', () => {
  it('returns bun when bun.lockb exists', () => {
    writeFileSync(join(tempDirectory, 'bun.lockb'), '');
    expect(detectPackageManager(tempDirectory)).toBe('bun');
  });

  it('returns bun when bun.lock exists', () => {
    writeFileSync(join(tempDirectory, 'bun.lock'), '');
    expect(detectPackageManager(tempDirectory)).toBe('bun');
  });

  it('returns pnpm when pnpm-lock.yaml exists', () => {
    writeFileSync(join(tempDirectory, 'pnpm-lock.yaml'), '');
    expect(detectPackageManager(tempDirectory)).toBe('pnpm');
  });

  it('returns yarn when yarn.lock exists', () => {
    writeFileSync(join(tempDirectory, 'yarn.lock'), '');
    expect(detectPackageManager(tempDirectory)).toBe('yarn');
  });

  it('defaults to npm when no lock file exists', () => {
    expect(detectPackageManager(tempDirectory)).toBe('npm');
  });

  it('prefers bun over pnpm when both lock files exist', () => {
    writeFileSync(join(tempDirectory, 'bun.lockb'), '');
    writeFileSync(join(tempDirectory, 'pnpm-lock.yaml'), '');
    expect(detectPackageManager(tempDirectory)).toBe('bun');
  });

  it('prefers pnpm over yarn when both lock files exist', () => {
    writeFileSync(join(tempDirectory, 'pnpm-lock.yaml'), '');
    writeFileSync(join(tempDirectory, 'yarn.lock'), '');
    expect(detectPackageManager(tempDirectory)).toBe('pnpm');
  });
});

// --- detectFramework ---

describe('detectFramework', () => {
  it('detects Next.js from dependencies', () => {
    writePackageJson(tempDirectory, { next: '^14.0.0' });
    expect(detectFramework(tempDirectory)).toBe('next');
  });

  it('detects Next.js from devDependencies', () => {
    writePackageJson(tempDirectory, {}, { next: '^14.0.0' });
    expect(detectFramework(tempDirectory)).toBe('next');
  });

  it('detects Vite from dependencies', () => {
    writePackageJson(tempDirectory, {}, { vite: '^5.0.0' });
    expect(detectFramework(tempDirectory)).toBe('vite');
  });

  it('detects TanStack Start from dependencies', () => {
    writePackageJson(tempDirectory, { '@tanstack/react-start': '^1.0.0' });
    expect(detectFramework(tempDirectory)).toBe('tanstack');
  });

  it('detects Webpack from dependencies', () => {
    writePackageJson(tempDirectory, {}, { webpack: '^5.0.0' });
    expect(detectFramework(tempDirectory)).toBe('webpack');
  });

  it('detects Webpack via react-scripts', () => {
    writePackageJson(tempDirectory, { 'react-scripts': '^5.0.0' });
    expect(detectFramework(tempDirectory)).toBe('webpack');
  });

  it('returns unknown when no framework is detected', () => {
    writePackageJson(tempDirectory, { react: '^18.0.0' });
    expect(detectFramework(tempDirectory)).toBe('unknown');
  });

  it('returns unknown when no package.json exists', () => {
    expect(detectFramework(tempDirectory)).toBe('unknown');
  });

  it('returns unknown when package.json is malformed', () => {
    writeFileSync(join(tempDirectory, 'package.json'), 'not-json');
    expect(detectFramework(tempDirectory)).toBe('unknown');
  });

  it('prefers Next.js over Vite when both are present', () => {
    writePackageJson(tempDirectory, { next: '^14.0.0' }, { vite: '^5.0.0' });
    expect(detectFramework(tempDirectory)).toBe('next');
  });
});

// --- detectNextRouterType ---

describe('detectNextRouterType', () => {
  it('detects app router from root app directory', () => {
    mkdirSync(join(tempDirectory, 'app'));
    expect(detectNextRouterType(tempDirectory)).toBe('app');
  });

  it('detects app router from src/app directory', () => {
    mkdirSync(join(tempDirectory, 'src', 'app'), { recursive: true });
    expect(detectNextRouterType(tempDirectory)).toBe('app');
  });

  it('detects pages router from root pages directory', () => {
    mkdirSync(join(tempDirectory, 'pages'));
    expect(detectNextRouterType(tempDirectory)).toBe('pages');
  });

  it('detects pages router from src/pages directory', () => {
    mkdirSync(join(tempDirectory, 'src', 'pages'), { recursive: true });
    expect(detectNextRouterType(tempDirectory)).toBe('pages');
  });

  it('returns unknown when no router directories exist', () => {
    expect(detectNextRouterType(tempDirectory)).toBe('unknown');
  });

  it('prefers app router when both app and pages directories exist', () => {
    mkdirSync(join(tempDirectory, 'app'));
    mkdirSync(join(tempDirectory, 'pages'));
    expect(detectNextRouterType(tempDirectory)).toBe('app');
  });
});

// --- detectProject ---

describe('detectProject', () => {
  it('detects a Next.js app router project with pnpm', () => {
    writePackageJson(tempDirectory, { next: '^14.0.0', react: '^18.0.0' });
    writeFileSync(join(tempDirectory, 'pnpm-lock.yaml'), '');
    mkdirSync(join(tempDirectory, 'app'));

    const project = detectProject(tempDirectory);
    expect(project.packageManager).toBe('pnpm');
    expect(project.framework).toBe('next');
    expect(project.nextRouterType).toBe('app');
    expect(project.projectRoot).toBe(tempDirectory);
    expect(project.hasReactScan).toBe(false);
  });

  it('detects hasReactScan from dependencies', () => {
    writePackageJson(tempDirectory, { 'react-scan': '^0.4.0', vite: '^5.0.0' });
    const project = detectProject(tempDirectory);
    expect(project.hasReactScan).toBe(true);
  });

  it('detects hasReactScan from devDependencies', () => {
    writePackageJson(tempDirectory, { vite: '^5.0.0' }, { 'react-scan': '^0.4.0' });
    const project = detectProject(tempDirectory);
    expect(project.hasReactScan).toBe(true);
  });

  it('sets nextRouterType to unknown for non-Next.js frameworks', () => {
    writePackageJson(tempDirectory, {}, { vite: '^5.0.0' });
    mkdirSync(join(tempDirectory, 'app'));
    const project = detectProject(tempDirectory);
    expect(project.nextRouterType).toBe('unknown');
  });
});

// --- hasReactScanCode ---

describe('hasReactScanCode', () => {
  it('detects react-scan in content', () => {
    expect(hasReactScanCode('import("react-scan")')).toBe(true);
  });

  it('detects react_scan in content', () => {
    expect(hasReactScanCode('window.react_scan = true')).toBe(true);
  });

  it('returns false when not present', () => {
    expect(hasReactScanCode('import React from "react"')).toBe(false);
  });

  it('detects react-scan in script tag', () => {
    expect(hasReactScanCode('<script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>')).toBe(true);
  });
});

// --- findLayoutFile ---

describe('findLayoutFile', () => {
  it('finds app/layout.tsx for app router', () => {
    mkdirSync(join(tempDirectory, 'app'));
    const layoutPath = join(tempDirectory, 'app', 'layout.tsx');
    writeFileSync(layoutPath, '');
    expect(findLayoutFile(tempDirectory, 'app')).toBe(layoutPath);
  });

  it('finds src/app/layout.tsx for app router', () => {
    mkdirSync(join(tempDirectory, 'src', 'app'), { recursive: true });
    const layoutPath = join(tempDirectory, 'src', 'app', 'layout.tsx');
    writeFileSync(layoutPath, '');
    expect(findLayoutFile(tempDirectory, 'app')).toBe(layoutPath);
  });

  it('finds app/layout.jsx for app router', () => {
    mkdirSync(join(tempDirectory, 'app'));
    const layoutPath = join(tempDirectory, 'app', 'layout.jsx');
    writeFileSync(layoutPath, '');
    expect(findLayoutFile(tempDirectory, 'app')).toBe(layoutPath);
  });

  it('finds pages/_document.tsx for pages router', () => {
    mkdirSync(join(tempDirectory, 'pages'));
    const documentPath = join(tempDirectory, 'pages', '_document.tsx');
    writeFileSync(documentPath, '');
    expect(findLayoutFile(tempDirectory, 'pages')).toBe(documentPath);
  });

  it('finds src/pages/_document.tsx for pages router', () => {
    mkdirSync(join(tempDirectory, 'src', 'pages'), { recursive: true });
    const documentPath = join(tempDirectory, 'src', 'pages', '_document.tsx');
    writeFileSync(documentPath, '');
    expect(findLayoutFile(tempDirectory, 'pages')).toBe(documentPath);
  });

  it('returns null when no layout file exists for app router', () => {
    expect(findLayoutFile(tempDirectory, 'app')).toBeNull();
  });

  it('returns null when no document file exists for pages router', () => {
    expect(findLayoutFile(tempDirectory, 'pages')).toBeNull();
  });

  it('returns null for unknown router type', () => {
    expect(findLayoutFile(tempDirectory, 'unknown')).toBeNull();
  });
});

// --- findIndexHtml ---

describe('findIndexHtml', () => {
  it('finds root index.html', () => {
    const indexPath = join(tempDirectory, 'index.html');
    writeFileSync(indexPath, '');
    expect(findIndexHtml(tempDirectory)).toBe(indexPath);
  });

  it('finds public/index.html', () => {
    mkdirSync(join(tempDirectory, 'public'));
    const indexPath = join(tempDirectory, 'public', 'index.html');
    writeFileSync(indexPath, '');
    expect(findIndexHtml(tempDirectory)).toBe(indexPath);
  });

  it('finds src/index.html', () => {
    mkdirSync(join(tempDirectory, 'src'));
    const indexPath = join(tempDirectory, 'src', 'index.html');
    writeFileSync(indexPath, '');
    expect(findIndexHtml(tempDirectory)).toBe(indexPath);
  });

  it('prefers root index.html over public/index.html', () => {
    const rootPath = join(tempDirectory, 'index.html');
    writeFileSync(rootPath, '');
    mkdirSync(join(tempDirectory, 'public'));
    writeFileSync(join(tempDirectory, 'public', 'index.html'), '');
    expect(findIndexHtml(tempDirectory)).toBe(rootPath);
  });

  it('returns null when no index.html exists', () => {
    expect(findIndexHtml(tempDirectory)).toBeNull();
  });
});

// --- findEntryFile ---

describe('findEntryFile', () => {
  it('finds src/index.tsx', () => {
    mkdirSync(join(tempDirectory, 'src'));
    const entryPath = join(tempDirectory, 'src', 'index.tsx');
    writeFileSync(entryPath, '');
    expect(findEntryFile(tempDirectory)).toBe(entryPath);
  });

  it('finds src/main.tsx', () => {
    mkdirSync(join(tempDirectory, 'src'));
    const entryPath = join(tempDirectory, 'src', 'main.tsx');
    writeFileSync(entryPath, '');
    expect(findEntryFile(tempDirectory)).toBe(entryPath);
  });

  it('finds src/index.js', () => {
    mkdirSync(join(tempDirectory, 'src'));
    const entryPath = join(tempDirectory, 'src', 'index.js');
    writeFileSync(entryPath, '');
    expect(findEntryFile(tempDirectory)).toBe(entryPath);
  });

  it('prefers src/index.tsx over src/main.tsx', () => {
    mkdirSync(join(tempDirectory, 'src'));
    const indexPath = join(tempDirectory, 'src', 'index.tsx');
    writeFileSync(indexPath, '');
    writeFileSync(join(tempDirectory, 'src', 'main.tsx'), '');
    expect(findEntryFile(tempDirectory)).toBe(indexPath);
  });

  it('returns null when no entry file exists', () => {
    expect(findEntryFile(tempDirectory)).toBeNull();
  });
});

// --- transformNextAppRouter ---

describe('transformNextAppRouter', () => {
  const LAYOUT_WITH_BODY = `export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`;

  const LAYOUT_WITH_HEAD = `export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head><title>App</title></head>
      <body>{children}</body>
    </html>
  );
}`;

  it('returns failure when no layout file exists', () => {
    const result = transformNextAppRouter(tempDirectory, 'app');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Could not find');
  });

  it('injects script after body tag when no head tag exists', () => {
    mkdirSync(join(tempDirectory, 'app'));
    writeFileSync(join(tempDirectory, 'app', 'layout.tsx'), LAYOUT_WITH_BODY);

    const result = transformNextAppRouter(tempDirectory, 'app');
    expect(result.success).toBe(true);
    expect(result.newContent).toContain('react-scan');
    expect(result.newContent).toContain('<body>');
  });

  it('reports already installed when react-scan is in content', () => {
    mkdirSync(join(tempDirectory, 'app'));
    writeFileSync(
      join(tempDirectory, 'app', 'layout.tsx'),
      'import "react-scan";\n' + LAYOUT_WITH_BODY,
    );

    const result = transformNextAppRouter(tempDirectory, 'app');
    expect(result.success).toBe(true);
    expect(result.noChanges).toBe(true);
    expect(result.message).toContain('already installed');
  });

  it('preserves original content', () => {
    mkdirSync(join(tempDirectory, 'app'));
    writeFileSync(join(tempDirectory, 'app', 'layout.tsx'), LAYOUT_WITH_BODY);

    const result = transformNextAppRouter(tempDirectory, 'app');
    expect(result.originalContent).toBe(LAYOUT_WITH_BODY);
  });
});

// --- transformNextPagesRouter ---

describe('transformNextPagesRouter', () => {
  const DOCUMENT_WITH_HEAD = `import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head></Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}`;

  it('returns failure when no _document file exists', () => {
    const result = transformNextPagesRouter(tempDirectory, 'pages');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Could not find');
  });

  it('injects script inside Head tag', () => {
    mkdirSync(join(tempDirectory, 'pages'));
    writeFileSync(join(tempDirectory, 'pages', '_document.tsx'), DOCUMENT_WITH_HEAD);

    const result = transformNextPagesRouter(tempDirectory, 'pages');
    expect(result.success).toBe(true);
    expect(result.newContent).toContain('react-scan');
    expect(result.newContent).toContain('<Head>');
  });

  it('reports already installed when react-scan is in content', () => {
    mkdirSync(join(tempDirectory, 'pages'));
    writeFileSync(
      join(tempDirectory, 'pages', '_document.tsx'),
      DOCUMENT_WITH_HEAD.replace('<Head>', '<Head><script src="react-scan" />'),
    );

    const result = transformNextPagesRouter(tempDirectory, 'pages');
    expect(result.success).toBe(true);
    expect(result.noChanges).toBe(true);
  });
});

// --- transformVite ---

describe('transformVite', () => {
  const VITE_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  it('returns failure when no index.html exists', () => {
    const result = transformVite(tempDirectory);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Could not find index.html');
  });

  it('injects script inside head tag', () => {
    writeFileSync(join(tempDirectory, 'index.html'), VITE_INDEX_HTML);

    const result = transformVite(tempDirectory);
    expect(result.success).toBe(true);
    expect(result.newContent).toContain(VITE_SCRIPT);
    expect(result.newContent).toContain('<head>');
  });

  it('reports already installed when react-scan is in content', () => {
    writeFileSync(
      join(tempDirectory, 'index.html'),
      VITE_INDEX_HTML.replace('<head>', `<head>\n    ${VITE_SCRIPT}`),
    );

    const result = transformVite(tempDirectory);
    expect(result.success).toBe(true);
    expect(result.noChanges).toBe(true);
  });

  it('preserves rest of the html', () => {
    writeFileSync(join(tempDirectory, 'index.html'), VITE_INDEX_HTML);

    const result = transformVite(tempDirectory);
    expect(result.newContent).toContain('<div id="root"></div>');
    expect(result.newContent).toContain('src="/src/main.tsx"');
  });
});

// --- transformWebpack ---

describe('transformWebpack', () => {
  const WEBPACK_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

  const WEBPACK_ENTRY = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`;

  it('injects script tag into index.html when it exists', () => {
    mkdirSync(join(tempDirectory, 'public'));
    writeFileSync(join(tempDirectory, 'public', 'index.html'), WEBPACK_INDEX_HTML);

    const result = transformWebpack(tempDirectory);
    expect(result.success).toBe(true);
    expect(result.newContent).toContain(REACT_SCAN_SCRIPT_TAG);
  });

  it('falls back to entry file import when no index.html exists', () => {
    mkdirSync(join(tempDirectory, 'src'));
    writeFileSync(join(tempDirectory, 'src', 'index.tsx'), WEBPACK_ENTRY);

    const result = transformWebpack(tempDirectory);
    expect(result.success).toBe(true);
    expect(result.newContent).toContain(WEBPACK_IMPORT);
    expect(result.newContent).toContain(WEBPACK_ENTRY);
  });

  it('returns failure when no index.html or entry file exists', () => {
    const result = transformWebpack(tempDirectory);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Could not find');
  });

  it('reports already installed via index.html', () => {
    mkdirSync(join(tempDirectory, 'public'));
    writeFileSync(
      join(tempDirectory, 'public', 'index.html'),
      WEBPACK_INDEX_HTML.replace('<head>', `<head>\n    ${REACT_SCAN_SCRIPT_TAG}`),
    );

    const result = transformWebpack(tempDirectory);
    expect(result.success).toBe(true);
    expect(result.noChanges).toBe(true);
  });

  it('reports already installed via entry file', () => {
    mkdirSync(join(tempDirectory, 'src'));
    writeFileSync(
      join(tempDirectory, 'src', 'index.tsx'),
      `import("react-scan");\n${WEBPACK_ENTRY}`,
    );

    const result = transformWebpack(tempDirectory);
    expect(result.success).toBe(true);
    expect(result.noChanges).toBe(true);
  });
});

// --- previewTransform ---

describe('previewTransform', () => {
  it('routes to Next.js app router transform', () => {
    mkdirSync(join(tempDirectory, 'app'));
    writeFileSync(
      join(tempDirectory, 'app', 'layout.tsx'),
      '<html><body></body></html>',
    );

    const result = previewTransform(tempDirectory, 'next', 'app');
    expect(result.success).toBe(true);
    expect(result.newContent).toContain('react-scan');
  });

  it('routes to Next.js pages router transform', () => {
    mkdirSync(join(tempDirectory, 'pages'));
    writeFileSync(
      join(tempDirectory, 'pages', '_document.tsx'),
      '<Html><Head></Head><body></body></Html>',
    );

    const result = previewTransform(tempDirectory, 'next', 'pages');
    expect(result.success).toBe(true);
    expect(result.newContent).toContain('react-scan');
  });

  it('routes to Vite transform', () => {
    writeFileSync(
      join(tempDirectory, 'index.html'),
      '<html><head></head><body></body></html>',
    );

    const result = previewTransform(tempDirectory, 'vite', 'unknown');
    expect(result.success).toBe(true);
    expect(result.newContent).toContain('react-scan');
  });

  it('routes to Webpack transform', () => {
    mkdirSync(join(tempDirectory, 'public'));
    writeFileSync(
      join(tempDirectory, 'public', 'index.html'),
      '<html><head></head><body></body></html>',
    );

    const result = previewTransform(tempDirectory, 'webpack', 'unknown');
    expect(result.success).toBe(true);
    expect(result.newContent).toContain('react-scan');
  });

  it('returns failure for tanstack framework', () => {
    const result = previewTransform(tempDirectory, 'tanstack', 'unknown');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not yet supported');
  });

  it('returns failure for unknown framework', () => {
    const result = previewTransform(tempDirectory, 'unknown', 'unknown');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not yet supported');
  });
});

// --- generateDiff ---

describe('generateDiff', () => {
  it('returns empty diff for identical strings', () => {
    const diff = generateDiff('hello\nworld', 'hello\nworld');
    expect(diff).toEqual([
      { type: 'unchanged', content: 'hello' },
      { type: 'unchanged', content: 'world' },
    ]);
  });

  it('detects added lines', () => {
    const diff = generateDiff('line1\nline3', 'line1\nline2\nline3');
    const addedLines = diff.filter((diffLine) => diffLine.type === 'added');
    expect(addedLines.length).toBeGreaterThan(0);
    expect(addedLines.some((diffLine) => diffLine.content === 'line2')).toBe(true);
  });

  it('detects removed lines', () => {
    const diff = generateDiff('line1\nline2\nline3', 'line1\nline3');
    const removedLines = diff.filter((diffLine) => diffLine.type === 'removed');
    expect(removedLines.length).toBeGreaterThan(0);
    expect(removedLines.some((diffLine) => diffLine.content === 'line2')).toBe(true);
  });

  it('detects replaced lines', () => {
    const diff = generateDiff('hello', 'goodbye');
    expect(diff).toEqual([
      { type: 'removed', content: 'hello' },
      { type: 'added', content: 'goodbye' },
    ]);
  });

  it('handles empty original', () => {
    const diff = generateDiff('', 'new line');
    expect(diff).toEqual([
      { type: 'removed', content: '' },
      { type: 'added', content: 'new line' },
    ]);
  });

  it('handles empty updated', () => {
    const diff = generateDiff('old line', '');
    expect(diff).toEqual([
      { type: 'removed', content: 'old line' },
      { type: 'added', content: '' },
    ]);
  });

  it('handles multi-line additions in the middle', () => {
    const original = '<head>\n</head>';
    const updated = '<head>\n  <script src="react-scan"></script>\n</head>';
    const diff = generateDiff(original, updated);

    const addedLines = diff.filter((diffLine) => diffLine.type === 'added');
    expect(addedLines.length).toBe(1);
    expect(addedLines[0].content).toContain('react-scan');
  });
});
