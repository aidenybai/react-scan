import { type Fiber, getDisplayName } from "bippy";
import { type FiberSource, formatOwnerStack, hasDebugStack, parseStack } from "bippy/source";

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
  // Reading `_debugSource` into a local narrows it to NonNullable, so direct
  // access is safe. `_debugStack` is narrowed via `hasDebugStack`, whose guard
  // lives in `bippy/source` because the underlying field is version-dependent
  // and bippy is the canonical place to know what shape it takes.
  //
  // ASSUMPTION: bippy's Fiber type keeps `_debugSource.fileName` as a `string`
  // and `lineNumber` as a `number` whenever `_debugSource` is present
  // (verified in bippy 0.6.0). If a future bippy loosens this
  // (e.g. narrows to `fileName?: string`), the resulting `FiberSource` would
  // violate `bippy/source`'s `FiberSource.fileName: string` contract. Re-check
  // this file when bumping bippy.
  const debugSource = fiber._debugSource;
  if (debugSource) {
    return {
      fileName: debugSource.fileName,
      lineNumber: debugSource.lineNumber,
      columnNumber: debugSource.columnNumber,
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
