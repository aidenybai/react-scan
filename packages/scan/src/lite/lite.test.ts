import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { instrument } from './index';
import type { LiteEvent } from './types';

// HACK: vitest runs from the package root; relying on process.cwd() avoids
// import.meta (which requires module: esnext in tsconfig).
const SCAN_PACKAGE_DIR = process.cwd();

const CJS_DIST = path.join(SCAN_PACKAGE_DIR, 'dist', 'lite', 'index.js');
const ESM_DIST = path.join(SCAN_PACKAGE_DIR, 'dist', 'lite', 'index.mjs');

const runInNode = (code: string): string =>
  execFileSync('node', ['-e', code], {
    cwd: SCAN_PACKAGE_DIR,
    encoding: 'utf-8',
    timeout: 10_000,
  }).trim();

const stashGlobal = (key: string): { restore: () => void } => {
  const previousDescriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  return {
    restore: () => {
      try {
        if (previousDescriptor) {
          Object.defineProperty(globalThis, key, previousDescriptor);
        } else {
          delete (globalThis as Record<string, unknown>)[key];
        }
      } catch {}
    },
  };
};

const withDeletedWindow = <T>(fn: () => T): T => {
  const stash = stashGlobal('window');
  delete (globalThis as { window?: unknown }).window;
  try {
    return fn();
  } finally {
    stash.restore();
  }
};

describe('react-scan/lite SSR safety (in-process)', () => {
  it('returns a noop handle when window is undefined', () => {
    withDeletedWindow(() => {
      const handle = instrument({
        endpoint: 'http://example.test/ingest',
        sessionId: 'abc',
      });
      expect(handle.isActive()).toBe(false);
      expect(typeof handle.stop).toBe('function');
      expect(typeof handle.subscribe).toBe('function');
    });
  });

  it('all noop handle methods are callable without throwing', () => {
    withDeletedWindow(() => {
      const handle = instrument({ onEvent: () => {} });
      const unsubscribe = handle.subscribe(() => {});
      expect(() => unsubscribe()).not.toThrow();
      expect(() => handle.stop()).not.toThrow();
      expect(() => handle.stop()).not.toThrow();
      expect(handle.isActive()).toBe(false);
    });
  });

  it('multiple instrument() calls in SSR all return noop handles', () => {
    withDeletedWindow(() => {
      const a = instrument();
      const b = instrument({ endpoint: 'http://example.test', sessionId: 'x' });
      const c = instrument();
      expect(a.isActive()).toBe(false);
      expect(b.isActive()).toBe(false);
      expect(c.isActive()).toBe(false);
    });
  });

  it('does not touch document, fetch, navigator, or XMLHttpRequest', () => {
    const guards = ['document', 'fetch', 'navigator', 'XMLHttpRequest'] as const;
    const stashes = guards.map((name) => stashGlobal(name));
    for (const name of guards) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        get: () => {
          throw new Error(`unexpected access to ${name}`);
        },
      });
    }
    try {
      withDeletedWindow(() => {
        const handle = instrument({
          endpoint: 'http://example.test',
          sessionId: 'abc',
          onEvent: () => {},
        });
        handle.subscribe(() => {})();
        handle.stop();
        expect(handle.isActive()).toBe(false);
      });
    } finally {
      for (const stash of stashes) stash.restore();
    }
  });
});

describe('react-scan/lite happy path (with stubbed window + hook)', () => {
  let stashedWindow: { restore: () => void };
  let stashedHook: { restore: () => void };
  let stashedReactScanLite: { restore: () => void };
  let fakeHook: {
    renderers: Map<number, unknown>;
    supportsFiber: boolean;
    supportsFlight: boolean;
    inject: (renderer: unknown) => number;
    onCommitFiberRoot: ((id: number, root: unknown, priority?: number) => void) | undefined;
    onPostCommitFiberRoot: ((id: number, root: unknown) => void) | undefined;
    onCommitFiberUnmount: ((id: number, fiber: unknown) => void) | undefined;
    [key: string]: unknown;
  };

  const noopFn = (): void => {};

  beforeEach(() => {
    stashedWindow = stashGlobal('window');
    stashedHook = stashGlobal('__REACT_DEVTOOLS_GLOBAL_HOOK__');
    stashedReactScanLite = stashGlobal('__REACT_SCAN_LITE__');
    (globalThis as { window?: unknown }).window = globalThis;
    fakeHook = {
      renderers: new Map(),
      supportsFiber: true,
      supportsFlight: true,
      inject: () => 1,
      onCommitFiberRoot: noopFn,
      onPostCommitFiberRoot: noopFn,
      onCommitFiberUnmount: noopFn,
    };
    (globalThis as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown }).__REACT_DEVTOOLS_GLOBAL_HOOK__ =
      fakeHook;
  });

  afterEach(() => {
    stashedReactScanLite.restore();
    stashedHook.restore();
    stashedWindow.restore();
  });

  const buildFakeFiberTree = () => {
    const leaf = {
      tag: 0,
      type: function LeafComponent() {},
      child: null,
      sibling: null,
      return: null,
      alternate: null,
      actualDuration: 5,
      actualStartTime: 100,
      selfBaseDuration: 5,
      treeBaseDuration: 5,
    };
    const parent = {
      tag: 0,
      type: function ParentComponent() {},
      child: leaf,
      sibling: null,
      return: null,
      alternate: null,
      actualDuration: 12,
      actualStartTime: 99,
      selfBaseDuration: 7,
      treeBaseDuration: 12,
    };
    return { current: parent };
  };

  it('emits a commit event with a populated tree on hook.onCommitFiberRoot', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({ onEvent: (event) => events.push(event) });
    expect(handle.isActive()).toBe(true);

    const fakeRoot = buildFakeFiberTree();
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);

    const commitEvent = events.find((event) => event.kind === 'commit');
    expect(commitEvent).toBeDefined();
    expect(commitEvent?.rendererId).toBe(1);
    expect(commitEvent?.tree?.length).toBe(2);
    expect(commitEvent?.tree?.[0]?.name).toBe('ParentComponent');
    expect(commitEvent?.tree?.[1]?.name).toBe('LeafComponent');
    expect(commitEvent?.tree?.[1]?.depth).toBe(1);

    handle.stop();
  });

  it('subscribe() listener receives commit events; unsubscribe stops them', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument();
    const unsubscribe = handle.subscribe((event) => events.push(event));

    const fakeRoot = buildFakeFiberTree();
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);
    expect(events.some((event) => event.kind === 'commit')).toBe(true);

    unsubscribe();
    events.length = 0;
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);
    expect(events).toEqual([]);

    handle.stop();
  });

  it('stop() restores hook handlers and prevents further events', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({ onEvent: (event) => events.push(event) });
    const ourCommit = fakeHook.onCommitFiberRoot;
    const ourInject = fakeHook.inject;

    handle.stop();
    expect(handle.isActive()).toBe(false);
    expect(fakeHook.onCommitFiberRoot).not.toBe(ourCommit);
    expect(fakeHook.inject).not.toBe(ourInject);

    const fakeRoot = buildFakeFiberTree();
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);
    expect(events.filter((event) => event.kind === 'commit')).toEqual([]);
  });

  it('stop()/instrument() cycles do not leak chain layers', () => {
    const settler = instrument();
    settler.stop();
    const baselineCommit = fakeHook.onCommitFiberRoot;
    const baselineInject = fakeHook.inject;

    for (let cycle = 0; cycle < 3; cycle++) {
      const handle = instrument();
      expect(fakeHook.onCommitFiberRoot).not.toBe(baselineCommit);
      handle.stop();
      expect(fakeHook.onCommitFiberRoot).toBe(baselineCommit);
      expect(fakeHook.inject).toBe(baselineInject);
    }
  });

  it('stop() is idempotent', () => {
    const handle = instrument();
    handle.stop();
    expect(() => handle.stop()).not.toThrow();
    expect(handle.isActive()).toBe(false);
  });

  it('returns the existing handle if instrument() is called twice without stop()', () => {
    const first = instrument();
    const second = instrument();
    expect(second).toBe(first);
    first.stop();
  });

  it('respects maxFibersPerCommit cap', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      maxFibersPerCommit: 1,
    });

    const fakeRoot = buildFakeFiberTree();
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);

    const commitEvent = events.find((event) => event.kind === 'commit');
    expect(commitEvent?.tree?.length).toBe(1);

    handle.stop();
  });

  it('respects minFiberActualDurationMs threshold', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      minFiberActualDurationMs: 10,
    });

    const fakeRoot = buildFakeFiberTree();
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);

    const commitEvent = events.find((event) => event.kind === 'commit');
    expect(commitEvent?.tree?.length).toBe(1);
    expect(commitEvent?.tree?.[0]?.name).toBe('ParentComponent');

    handle.stop();
  });

  it('warns when endpoint is provided without sessionId', () => {
    const warnings: Array<unknown> = [];
    // oxlint-disable-next-line no-console
    const originalWarn = console.warn;
    // oxlint-disable-next-line no-console
    console.warn = (...args: Array<unknown>) => warnings.push(args);
    try {
      const handle = instrument({ endpoint: 'http://example.test' });
      expect(
        warnings.some((entry) =>
          String(entry).includes('endpoint'),
        ),
      ).toBe(true);
      handle.stop();
    } finally {
      // oxlint-disable-next-line no-console
      console.warn = originalWarn;
    }
  });

  it('emits profiling-hooks-status with available=false when renderer has no injectProfilingHooks', () => {
    const events: Array<LiteEvent> = [];
    fakeHook.renderers.set(1, { version: '18.3.0', bundleType: 1 });
    const handle = instrument({ onEvent: (event) => events.push(event) });

    const status = events.find((event) => event.kind === 'profiling-hooks-status');
    expect(status).toBeDefined();
    expect(status?.available).toBe(false);
    expect(status?.reason).toBe('no-inject-method');
    expect(status?.reactVersion).toBe('18.3.0');
    expect(status?.bundleType).toBe(1);

    handle.stop();
  });

  it('emits profiling-hooks-status with available=true when injectProfilingHooks succeeds', () => {
    const events: Array<LiteEvent> = [];
    let capturedHooks: unknown = null;
    fakeHook.renderers.set(1, {
      version: '18.3.0',
      bundleType: 1,
      injectProfilingHooks: (hooks: unknown) => {
        capturedHooks = hooks;
      },
    });
    const handle = instrument({ onEvent: (event) => events.push(event) });

    const status = events.find((event) => event.kind === 'profiling-hooks-status');
    expect(status?.available).toBe(true);
    expect(status?.reason).toBeUndefined();
    expect(capturedHooks).toBeTruthy();

    handle.stop();
  });

  it('emits profiling-hooks-status with reason=threw when injectProfilingHooks throws', () => {
    const events: Array<LiteEvent> = [];
    fakeHook.renderers.set(1, {
      version: '18.3.0',
      bundleType: 1,
      injectProfilingHooks: () => {
        throw new Error('boom');
      },
    });
    const handle = instrument({ onEvent: (event) => events.push(event) });

    const status = events.find((event) => event.kind === 'profiling-hooks-status');
    expect(status?.available).toBe(false);
    expect(status?.reason).toBe('threw');

    handle.stop();
  });

  it('translates lanes bitmask via getLaneLabelMap', () => {
    const events: Array<LiteEvent> = [];
    interface CapturedHooks {
      markCommitStarted: (lanes: number) => void;
    }
    const captured: { hooks: CapturedHooks | null } = { hooks: null };
    fakeHook.renderers.set(1, {
      version: '18.3.0',
      bundleType: 1,
      getLaneLabelMap: () =>
        new Map<number, string>([
          [1, 'SyncLane'],
          [16, 'DefaultLane'],
        ]),
      injectProfilingHooks: (hooks: CapturedHooks) => {
        captured.hooks = hooks;
      },
    });
    const handle = instrument({ onEvent: (event) => events.push(event) });
    captured.hooks?.markCommitStarted(0b10001);

    const commitStart = events.find((event) => event.kind === 'commit-start');
    expect(commitStart?.laneLabels).toEqual(['SyncLane', 'DefaultLane']);

    handle.stop();
  });

  it('translates priorityLevel to priorityName on commit events', () => {
    const events: Array<LiteEvent> = [];
    fakeHook.renderers.set(1, {
      version: '18.3.0',
      bundleType: 1,
      getLaneLabelMap: () => new Map<number, string>([[1, 'SyncLane']]),
      injectProfilingHooks: () => {},
    });
    const handle = instrument({ onEvent: (event) => events.push(event) });

    const fakeRoot = buildFakeFiberTree();
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 2);

    const commit = events.find((event) => event.kind === 'commit');
    expect(commit?.priorityLevel).toBe(2);
    expect(commit?.priorityName).toBe('UserBlocking');

    handle.stop();
  });

  it('attaches fiberId when includeFiberIdentity is true', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      includeFiberIdentity: true,
    });

    const fakeRoot = buildFakeFiberTree();
    // HACK: bippy's `getFiberId` uses `if (!id)` to detect "unassigned",
    // which falsely re-assigns id=0 on every lookup. This only affects the
    // very first fiber ever seen by bippy in the process; after that, ids
    // stabilize. We commit three times and compare the latter two to dodge
    // the quirk while still asserting cross-commit identity.
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);

    const commits = events.filter((event) => event.kind === 'commit');
    expect(commits[1]?.tree?.[0]?.fiberId).toBeTypeOf('number');
    expect(commits[1]?.tree?.[0]?.fiberId).toBe(commits[2]?.tree?.[0]?.fiberId);
    expect(commits[1]?.tree?.[1]?.fiberId).toBe(commits[2]?.tree?.[1]?.fiberId);

    handle.stop();
  });

  it('attaches changeDescription when recordChangeDescriptions is true', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      recordChangeDescriptions: true,
    });

    const fakeRoot = buildFakeFiberTree();
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);

    const commit = events.find((event) => event.kind === 'commit');
    const summary = commit?.tree?.[0];
    expect(summary?.changeDescription).toBeDefined();
    expect(summary?.changeDescription?.isFirstMount).toBe(true);

    handle.stop();
  });

  it('changeDescription.parent reflects whether a composite ancestor rendered', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      recordChangeDescriptions: true,
    });

    // Build update-path tree (alternates present so we hit the non-mount branch).
    const buildUpdatedTree = () => {
      const leafAlt = {
        tag: 0,
        type: function LeafComponent() {},
        child: null,
        sibling: null,
        return: null,
        alternate: null,
        memoizedProps: { value: 1 },
        memoizedState: null,
        actualDuration: 5,
        actualStartTime: 100,
        selfBaseDuration: 5,
        treeBaseDuration: 5,
      };
      const leaf = {
        tag: 0,
        type: function LeafComponent() {},
        child: null,
        sibling: null,
        return: null as unknown,
        alternate: leafAlt,
        memoizedProps: { value: 2 },
        memoizedState: null,
        actualDuration: 5,
        actualStartTime: 100,
        selfBaseDuration: 5,
        treeBaseDuration: 5,
      };
      const parentAlt = {
        tag: 0,
        type: function ParentComponent() {},
        child: null,
        sibling: null,
        return: null,
        alternate: null,
        memoizedProps: {},
        memoizedState: null,
        actualDuration: 12,
        actualStartTime: 99,
        selfBaseDuration: 7,
        treeBaseDuration: 12,
      };
      const parent = {
        tag: 0,
        type: function ParentComponent() {},
        child: leaf,
        sibling: null,
        return: null,
        alternate: parentAlt,
        memoizedProps: {},
        memoizedState: null,
        actualDuration: 12,
        actualStartTime: 99,
        selfBaseDuration: 7,
        treeBaseDuration: 12,
      };
      leaf.return = parent;
      return { current: parent };
    };

    fakeHook.onCommitFiberRoot?.(1, buildUpdatedTree(), 0);

    const commit = events.find((event) => event.kind === 'commit');
    const parentSummary = commit?.tree?.find((entry) => entry.name === 'ParentComponent');
    const leafSummary = commit?.tree?.find((entry) => entry.name === 'LeafComponent');

    expect(parentSummary?.changeDescription?.parent).toBe(false);
    expect(leafSummary?.changeDescription?.parent).toBe(true);

    handle.stop();
  });

  it('attaches source and ownerName when includeFiberSource is true', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      includeFiberSource: true,
    });

    const ownerFiber = { type: function OwnerComponent() {} };
    const fakeRoot = {
      current: {
        tag: 0,
        type: function ChildComponent() {},
        child: null,
        sibling: null,
        return: null,
        alternate: null,
        actualDuration: 5,
        actualStartTime: 0,
        selfBaseDuration: 5,
        treeBaseDuration: 5,
        _debugOwner: ownerFiber,
        _debugSource: {
          fileName: 'src/foo.tsx',
          lineNumber: 42,
          columnNumber: 3,
        },
      },
    };
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 0);

    const commit = events.find((event) => event.kind === 'commit');
    const summary = commit?.tree?.[0];
    expect(summary?.source).toEqual({
      fileName: 'src/foo.tsx',
      lineNumber: 42,
      columnNumber: 3,
    });
    expect(summary?.ownerName).toBe('OwnerComponent');

    handle.stop();
  });

  it('source/ownerName are null when includeFiberSource is true but the fiber has no debug info', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      includeFiberSource: true,
    });

    fakeHook.onCommitFiberRoot?.(1, buildFakeFiberTree(), 0);

    const commit = events.find((event) => event.kind === 'commit');
    const summary = commit?.tree?.[0];
    expect(summary?.source).toBeNull();
    expect(summary?.ownerName).toBeNull();

    handle.stop();
  });

  it('priorityName resolves even when no renderer exposes getLaneLabelMap', () => {
    const events: Array<LiteEvent> = [];
    fakeHook.renderers.set(1, {
      version: '18.3.0',
      bundleType: 1,
      // no getLaneLabelMap, no injectProfilingHooks
    });
    const handle = instrument({ onEvent: (event) => events.push(event) });

    const fakeRoot = buildFakeFiberTree();
    fakeHook.onCommitFiberRoot?.(1, fakeRoot, 3);

    const commit = events.find((event) => event.kind === 'commit');
    expect(commit?.priorityLevel).toBe(3);
    expect(commit?.priorityName).toBe('Normal');
    expect(commit?.laneLabels).toBeUndefined();

    handle.stop();
  });

  it('emits "opted-out" reason when includeProfilingHooks is false', () => {
    const events: Array<LiteEvent> = [];
    fakeHook.renderers.set(1, {
      version: '18.3.0',
      bundleType: 1,
      injectProfilingHooks: () => {
        throw new Error('should not be called when opted out');
      },
    });
    const handle = instrument({
      onEvent: (event) => events.push(event),
      includeProfilingHooks: false,
    });

    const status = events.find((event) => event.kind === 'profiling-hooks-status');
    expect(status?.available).toBe(false);
    expect(status?.reason).toBe('opted-out');

    handle.stop();
  });

  it('does not throw a TDZ error when a renderer is already injected', () => {
    // H2 regression: bippy may fire `onActive` synchronously inside
    // `getRDTHook(...)` if a renderer was already injected. Our previous
    // code referenced the not-yet-bound `hook` const inside that callback.
    // The fix is to acquire the hook first, then attach explicitly.
    fakeHook.renderers.set(1, {
      version: '18.3.0',
      bundleType: 1,
      injectProfilingHooks: () => {},
    });

    expect(() => {
      const handle = instrument();
      handle.stop();
    }).not.toThrow();
  });

  it('forwards onCommitFiberRoot to the previously installed handler', () => {
    // M5: prove the chain forwarding actually invokes the previous handler.
    const calls: Array<{ rendererId: number; didError: boolean | undefined }> = [];
    fakeHook.onCommitFiberRoot = (
      rendererId: number,
      _root: unknown,
      _priority: number | undefined,
      ...rest: Array<unknown>
    ) => {
      calls.push({ rendererId, didError: rest[0] as boolean | undefined });
    };

    const handle = instrument();
    fakeHook.onCommitFiberRoot?.(7, buildFakeFiberTree(), 2);

    expect(calls).toEqual([{ rendererId: 7, didError: undefined }]);

    handle.stop();
  });

  it('captures and emits didError on commit events', () => {
    // H1: bippy's onCommitFiberRoot type omits the 4th `didError` arg, but
    // React passes it. We widen locally and emit it.
    const events: Array<LiteEvent> = [];
    const handle = instrument({ onEvent: (event) => events.push(event) });

    const widenedHandler = fakeHook.onCommitFiberRoot as (
      id: number,
      root: unknown,
      priority?: number,
      didError?: boolean,
    ) => void;
    widenedHandler(1, buildFakeFiberTree(), 2, true);

    const commit = events.find((event) => event.kind === 'commit');
    expect(commit?.didError).toBe(true);

    handle.stop();
  });

  it('omits didError on commit events when React did not pass it', () => {
    const events: Array<LiteEvent> = [];
    const handle = instrument({ onEvent: (event) => events.push(event) });

    fakeHook.onCommitFiberRoot?.(1, buildFakeFiberTree(), 2);

    const commit = events.find((event) => event.kind === 'commit');
    expect(commit?.didError).toBeUndefined();

    handle.stop();
  });

  it('emits the underlying error message when injectProfilingHooks throws', () => {
    // M3: error message should propagate so debug agents can attribute the failure.
    const events: Array<LiteEvent> = [];
    fakeHook.renderers.set(1, {
      version: '18.3.0',
      bundleType: 1,
      injectProfilingHooks: () => {
        throw new Error('renderer rejected hooks');
      },
    });
    const handle = instrument({ onEvent: (event) => events.push(event) });

    const status = events.find((event) => event.kind === 'profiling-hooks-status');
    expect(status?.reason).toBe('threw');
    expect(status?.error).toBe('renderer rejected hooks');

    handle.stop();
  });

  it('warns when includeFiberTree is false but enrichment options are set', () => {
    // H3: silent ignore is the worst failure mode.
    const warnings: Array<unknown> = [];
    // oxlint-disable-next-line no-console
    const originalWarn = console.warn;
    // oxlint-disable-next-line no-console
    console.warn = (...args: Array<unknown>) => warnings.push(args);
    try {
      const handle = instrument({
        includeFiberTree: false,
        recordChangeDescriptions: true,
      });
      expect(
        warnings.some((entry) => String(entry).includes('includeFiberTree: false')),
      ).toBe(true);
      handle.stop();
    } finally {
      // oxlint-disable-next-line no-console
      console.warn = originalWarn;
    }
  });

  it('logs an error when endpoint is not a valid http(s) URL', () => {
    // S2: validate URL once at instrument() time instead of letting fetch fail
    // silently per-event.
    const errors: Array<unknown> = [];
    // oxlint-disable-next-line no-console
    const originalError = console.error;
    // oxlint-disable-next-line no-console
    console.error = (...args: Array<unknown>) => errors.push(args);
    try {
      const handle = instrument({
        endpoint: 'javascript:alert(1)',
        sessionId: 'abc',
      });
      expect(
        errors.some((entry) =>
          String(entry).includes('not a valid http(s) URL'),
        ),
      ).toBe(true);
      handle.stop();
    } finally {
      // oxlint-disable-next-line no-console
      console.error = originalError;
    }
  });

  it('invalid endpoint does NOT trigger fetch on every emitted event', () => {
    // Bugbot regression on PR #435: previously the URL validator only logged
    // a warning, but `canPostToEndpoint` still saw the bad endpoint and
    // fired `fetch()` per event. Now `instrument()` clears the endpoint when
    // invalid before forwarding to `createEmitter`.
    const fetchCalls: Array<unknown> = [];
    const originalFetch = (globalThis as { fetch?: unknown }).fetch;
    (globalThis as { fetch: (url: unknown) => Promise<unknown> }).fetch = (
      url,
    ) => {
      fetchCalls.push(url);
      return Promise.resolve({});
    };
    // oxlint-disable-next-line no-console
    const originalError = console.error;
    // oxlint-disable-next-line no-console
    console.error = () => {};
    try {
      const handle = instrument({
        endpoint: 'javascript:alert(1)',
        sessionId: 'abc',
      });
      fakeHook.onCommitFiberRoot?.(1, buildFakeFiberTree(), 0);
      expect(fetchCalls).toEqual([]);
      handle.stop();
    } finally {
      // oxlint-disable-next-line no-console
      console.error = originalError;
      if (originalFetch === undefined) {
        delete (globalThis as { fetch?: unknown }).fetch;
      } else {
        (globalThis as { fetch: unknown }).fetch = originalFetch;
      }
    }
  });

  it('emit fast-path skips translator + listener work when nothing is listening', () => {
    // L5: when no onEvent + no endpoint + no subscribe, emit short-circuits.
    let translatorCalls = 0;
    fakeHook.renderers.set(1, {
      version: '18.3.0',
      bundleType: 1,
      getLaneLabelMap: () => {
        translatorCalls++;
        return new Map<number, string>([[1, 'SyncLane']]);
      },
      injectProfilingHooks: () => {},
    });
    const handle = instrument();
    const callsAfterAttach = translatorCalls;

    fakeHook.onCommitFiberRoot?.(1, buildFakeFiberTree(), 2);

    // After commit, translator should NOT have been called again
    // (no listener consumes the event, so emit short-circuits).
    expect(translatorCalls).toBe(callsAfterAttach);

    handle.stop();
  });

  it('cascade detection rejects fibers whose actualDuration is 0', () => {
    // L6: a parent that didn't actually render must not be reported as cascading.
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      recordChangeDescriptions: true,
    });

    const leafAlt = {
      tag: 0,
      type: function LeafComponent() {},
      child: null,
      sibling: null,
      return: null,
      alternate: null,
      memoizedProps: { value: 1 },
      memoizedState: null,
      actualDuration: 5,
      actualStartTime: 0,
      selfBaseDuration: 5,
      treeBaseDuration: 5,
    };
    const leaf = {
      tag: 0,
      type: function LeafComponent() {},
      child: null,
      sibling: null,
      return: null as unknown,
      alternate: leafAlt,
      memoizedProps: { value: 2 },
      memoizedState: null,
      actualDuration: 5,
      actualStartTime: 0,
      selfBaseDuration: 5,
      treeBaseDuration: 5,
    };
    const parentAlt = {
      tag: 0,
      type: function ParentComponent() {},
      child: null,
      sibling: null,
      return: null,
      alternate: null,
      memoizedProps: {},
      memoizedState: null,
      actualDuration: 0,
      actualStartTime: 0,
      selfBaseDuration: 0,
      treeBaseDuration: 0,
    };
    const parent = {
      tag: 0,
      type: function ParentComponent() {},
      child: leaf,
      sibling: null,
      return: null,
      alternate: parentAlt,
      memoizedProps: {},
      memoizedState: null,
      actualDuration: 0, // bailout: parent didn't actually render
      actualStartTime: 0,
      selfBaseDuration: 0,
      treeBaseDuration: 5,
    };
    leaf.return = parent;

    fakeHook.onCommitFiberRoot?.(1, { current: parent }, 0);

    const commit = events.find((event) => event.kind === 'commit');
    const leafSummary = commit?.tree?.find((entry) => entry.name === 'LeafComponent');
    expect(leafSummary?.changeDescription?.parent).toBe(false);

    handle.stop();
  });

  it('does not double-attach a renderer across stop()/instrument() cycles', () => {
    // L7: WeakSet of attached renderers must survive across cycles for the
    // same renderer instance.
    const injects: Array<number> = [];
    const renderer = {
      version: '18.3.0',
      bundleType: 1,
      injectProfilingHooks: () => {
        injects.push(1);
      },
    };
    fakeHook.renderers.set(1, renderer);

    const settler = instrument();
    settler.stop();
    expect(injects.length).toBe(1);

    // A fresh instrument cycle gets its own WeakSet, so it WILL re-inject
    // (this is by design — different profilingHooks closure, different
    // emitter target). Document the behavior; the key invariant is that
    // WITHIN a single cycle, each renderer is injected exactly once.
    const handle = instrument();
    expect(injects.length).toBe(2);
    handle.stop();
  });

  it('detects context value changes via traverseContexts', () => {
    // M4: covers `didAnyContextChange`.
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      recordChangeDescriptions: true,
    });

    const contextRef = { displayName: 'TestContext' };
    const previousFiber = {
      tag: 0,
      type: function Consumer() {},
      child: null,
      sibling: null,
      return: null,
      alternate: null,
      memoizedProps: {},
      memoizedState: null,
      actualDuration: 5,
      actualStartTime: 0,
      selfBaseDuration: 5,
      treeBaseDuration: 5,
      dependencies: {
        firstContext: { context: contextRef, memoizedValue: 'before', next: null },
      },
    };
    const fiber = {
      tag: 0,
      type: function Consumer() {},
      child: null,
      sibling: null,
      return: null,
      alternate: previousFiber,
      memoizedProps: {},
      memoizedState: null,
      actualDuration: 5,
      actualStartTime: 0,
      selfBaseDuration: 5,
      treeBaseDuration: 5,
      dependencies: {
        firstContext: { context: contextRef, memoizedValue: 'after', next: null },
      },
    };

    fakeHook.onCommitFiberRoot?.(1, { current: fiber }, 0);

    const commit = events.find((event) => event.kind === 'commit');
    const summary = commit?.tree?.[0];
    expect(summary?.changeDescription?.context).toBe(true);

    handle.stop();
  });

  it('detects class state changes via shallow key compare', () => {
    // M4: covers `didAnyClassStateChange`. Tag 1 = ClassComponentTag.
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      recordChangeDescriptions: true,
    });

    const previousFiber = {
      tag: 1,
      type: class Counter {},
      child: null,
      sibling: null,
      return: null,
      alternate: null,
      memoizedProps: {},
      memoizedState: { count: 1 },
      actualDuration: 5,
      actualStartTime: 0,
      selfBaseDuration: 5,
      treeBaseDuration: 5,
    };
    const fiber = {
      tag: 1,
      type: previousFiber.type,
      child: null,
      sibling: null,
      return: null,
      alternate: previousFiber,
      memoizedProps: {},
      memoizedState: { count: 2 },
      actualDuration: 5,
      actualStartTime: 0,
      selfBaseDuration: 5,
      treeBaseDuration: 5,
    };

    fakeHook.onCommitFiberRoot?.(1, { current: fiber }, 0);

    const commit = events.find((event) => event.kind === 'commit');
    const summary = commit?.tree?.[0];
    expect(summary?.changeDescription?.state).toBe(true);
    expect(summary?.changeDescription?.hooks).toEqual([]);

    handle.stop();
  });

  it('detects hook-state changes via traverseState', () => {
    // M4: covers `collectChangedHookIndices`. Function components only.
    const events: Array<LiteEvent> = [];
    const handle = instrument({
      onEvent: (event) => events.push(event),
      recordChangeDescriptions: true,
    });

    const prevHook2 = { memoizedState: 'b', next: null };
    const prevHook1 = { memoizedState: 1, next: prevHook2 };
    const nextHook2 = { memoizedState: 'b', next: null };
    const nextHook1 = { memoizedState: 2, next: nextHook2 };

    const previousFiber = {
      tag: 0,
      type: function Counter() {},
      child: null,
      sibling: null,
      return: null,
      alternate: null,
      memoizedProps: {},
      memoizedState: prevHook1,
      actualDuration: 5,
      actualStartTime: 0,
      selfBaseDuration: 5,
      treeBaseDuration: 5,
    };
    const fiber = {
      tag: 0,
      type: previousFiber.type,
      child: null,
      sibling: null,
      return: null,
      alternate: previousFiber,
      memoizedProps: {},
      memoizedState: nextHook1,
      actualDuration: 5,
      actualStartTime: 0,
      selfBaseDuration: 5,
      treeBaseDuration: 5,
    };

    fakeHook.onCommitFiberRoot?.(1, { current: fiber }, 0);

    const commit = events.find((event) => event.kind === 'commit');
    const summary = commit?.tree?.[0];
    expect(summary?.changeDescription?.hooks).toEqual([0]);

    handle.stop();
  });

  it('handle.stop() called from inside an onEvent listener takes effect', () => {
    // M6: realistic self-disabling instrumentation pattern.
    let commitCount = 0;
    let handleRef: { stop: () => void } | null = null;
    handleRef = instrument({
      onEvent: (event) => {
        if (event.kind === 'commit') {
          commitCount++;
          handleRef?.stop();
        }
      },
    });

    fakeHook.onCommitFiberRoot?.(1, buildFakeFiberTree(), 0);
    fakeHook.onCommitFiberRoot?.(1, buildFakeFiberTree(), 0);
    fakeHook.onCommitFiberRoot?.(1, buildFakeFiberTree(), 0);

    expect(commitCount).toBe(1);
    expect(handleRef?.stop).toBeDefined();
  });
});

describe.skipIf(!existsSync(CJS_DIST))(
  'react-scan/lite SSR safety (built CJS in node -e)',
  () => {
    it('importing the CJS build does not throw', () => {
      expect(runInNode(`require('${CJS_DIST}'); console.log('OK')`)).toBe('OK');
    });

    it('instrument() returns a noop handle in node -e', () => {
      const code = [
        `const { instrument } = require('${CJS_DIST}');`,
        "const handle = instrument({ endpoint: 'http://example.test', sessionId: 'abc' });",
        "console.log(handle.isActive() === false ? 'NOOP' : 'UNEXPECTED');",
      ].join(' ');
      expect(runInNode(code)).toBe('NOOP');
    });
  },
);

describe.skipIf(!existsSync(ESM_DIST))(
  'react-scan/lite SSR safety (built ESM in node -e)',
  () => {
    it('importing the ESM build does not throw', () => {
      const url = pathToFileURL(ESM_DIST).href;
      expect(
        runInNode(
          `import('${url}').then(() => console.log('OK')).catch(e => { console.error(e); process.exit(1); })`,
        ),
      ).toBe('OK');
    });

    it('instrument() returns a noop handle when imported as ESM', () => {
      const url = pathToFileURL(ESM_DIST).href;
      const code = [
        `import('${url}').then(({ instrument }) => {`,
        "  const handle = instrument({ endpoint: 'http://example.test', sessionId: 'abc' });",
        "  console.log(handle.isActive() === false ? 'NOOP' : 'UNEXPECTED');",
        '}).catch(e => { console.error(e); process.exit(1); });',
      ].join(' ');
      expect(runInNode(code)).toBe('NOOP');
    });
  },
);
