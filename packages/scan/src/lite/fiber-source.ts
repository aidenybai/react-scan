import { type Fiber, getDisplayName } from 'bippy';
import {
  type FiberSource,
  formatOwnerStack,
  hasDebugSource,
  hasDebugStack,
  parseStack,
} from 'bippy/source';

/**
 * Synchronous source extraction. We deliberately avoid `bippy/source`'s
 * async `getSource` because it walks the owner stack and source-map
 * symbolicates over the network. Way too heavy for per-commit walking.
 *
 * Resolution order:
 *   1. `_debugSource` (React 16/17/18 dev builds): a plain object.
 *   2. `_debugStack` (React 19+ dev builds): an `Error` whose stack we
 *      format and parse. The first frame is the JSX call site of this
 *      element. Bundled URLs only; callers must symbolicate offline.
 */
export const getFiberSource = (fiber: Fiber): FiberSource | null => {
  // `hasDebugSource` narrows `_debugSource` to NonNullable, so direct access
  // is safe. Same for `_debugStack` via `hasDebugStack`. Both guards live in
  // `bippy/source` because the underlying fields are version-dependent and
  // bippy is the canonical place to know what shape they take.
  //
  // ASSUMPTION: bippy's guards are tight — `hasDebugSource(fiber) === true`
  // implies `fiber._debugSource.fileName` is a `string` and `lineNumber` is
  // a `number` (verified in bippy 0.5.39). If a future bippy loosens this
  // (e.g. narrows to `fileName?: string`), the resulting `FiberSource` would
  // violate `bippy/source`'s `FiberSource.fileName: string` contract. Re-check
  // this file when bumping bippy.
  if (hasDebugSource(fiber)) {
    return {
      fileName: fiber._debugSource.fileName,
      lineNumber: fiber._debugSource.lineNumber,
      columnNumber: fiber._debugSource.columnNumber,
    };
  }

  if (hasDebugStack(fiber)) {
    try {
      const ownerStack = formatOwnerStack(fiber._debugStack.stack);
      if (ownerStack) {
        const firstFrame = parseStack(ownerStack)[0];
        if (firstFrame?.fileName) {
          return {
            fileName: firstFrame.fileName,
            lineNumber: firstFrame.lineNumber,
            columnNumber: firstFrame.columnNumber,
            functionName: firstFrame.functionName,
          };
        }
      }
    } catch {}
  }

  return null;
};

/**
 * Display name of `_debugOwner.type`: the parent component that rendered
 * this one in JSX, not the parent in the fiber tree (those differ when an
 * element is created in one component and rendered as a child of another).
 */
export const getOwnerName = (fiber: Fiber): string | null => {
  const owner = fiber._debugOwner;
  if (!owner) return null;
  return getDisplayName(owner.type);
};
