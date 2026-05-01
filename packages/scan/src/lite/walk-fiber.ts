import { type Fiber, getDisplayName, getFiberId } from 'bippy';
import { getChangeDescription, isCompositeTag } from './change-description';
import { getFiberSource, getOwnerName } from './fiber-source';
import type { LiteFiberSummary } from './types';

export interface WalkFiberOptions {
  maxFibers: number;
  minActualDurationMs: number;
  recordChangeDescriptions: boolean;
  includeFiberSource: boolean;
  includeFiberIdentity: boolean;
  /**
   * Optional cancellation predicate. If returns `true` mid-walk, we exit
   * early without finishing the tree. Lets `stop()` short-circuit walks
   * already in flight on a deep tree.
   */
  isCancelled?: () => boolean;
}

interface PendingFiber {
  fiber: Fiber;
  depth: number;
  // `true` if any composite ancestor in this fiber's path through the tree
  // already rendered in this commit. Snapshotted at sibling-spawn time so
  // backtracking restores the right value (siblings share their parent's
  // ancestor-cascade state, NOT each other's).
  hasCascadingAncestor: boolean;
}

const compositeFiberDidRender = (fiber: Fiber): boolean => {
  const actualDuration = fiber.actualDuration;
  return (
    actualDuration != null && actualDuration > 0 && isCompositeTag(fiber.tag)
  );
};

export const walkFiber = (
  rootFiber: Fiber | null | undefined,
  options: WalkFiberOptions,
): Array<LiteFiberSummary> => {
  const summaries: Array<LiteFiberSummary> = [];
  if (!rootFiber) return summaries;

  const pendingSiblings: Array<PendingFiber> = [];
  let currentFiber: Fiber | null = rootFiber;
  let currentDepth = 0;
  let hasCascadingAncestor = false;

  while (currentFiber || pendingSiblings.length > 0) {
    if (summaries.length >= options.maxFibers) return summaries;
    if (options.isCancelled?.()) return summaries;

    if (!currentFiber) {
      // HACK: cast guarded by length check above.
      const next = pendingSiblings.pop() as PendingFiber;
      currentFiber = next.fiber;
      currentDepth = next.depth;
      hasCascadingAncestor = next.hasCascadingAncestor;
      continue;
    }

    const actualDuration = currentFiber.actualDuration;
    if (actualDuration != null && actualDuration >= options.minActualDurationMs) {
      const summary: LiteFiberSummary = {
        name: getDisplayName(currentFiber.type) ?? 'Anonymous',
        depth: currentDepth,
        tag: currentFiber.tag,
        actualDuration,
        actualStartTime: currentFiber.actualStartTime ?? 0,
        selfBaseDuration: currentFiber.selfBaseDuration ?? 0,
        treeBaseDuration: currentFiber.treeBaseDuration ?? 0,
      };
      if (options.includeFiberIdentity) {
        summary.fiberId = getFiberId(currentFiber);
      }
      if (options.includeFiberSource) {
        summary.source = getFiberSource(currentFiber);
        summary.ownerName = getOwnerName(currentFiber);
      }
      if (options.recordChangeDescriptions) {
        summary.changeDescription = getChangeDescription(
          currentFiber,
          hasCascadingAncestor,
        );
      }
      summaries.push(summary);
    }

    if (currentFiber.sibling) {
      // Siblings see this fiber's ancestor-cascade state (their parent's),
      // NOT this fiber itself; siblings are not descendants of each other.
      pendingSiblings.push({
        fiber: currentFiber.sibling,
        depth: currentDepth,
        hasCascadingAncestor,
      });
    }

    if (currentFiber.child) {
      // Descendants see this fiber's contribution: if THIS fiber is a
      // composite that rendered, our descendants now have a cascading
      // ancestor (us). Only compute when consumers actually use it.
      if (
        options.recordChangeDescriptions &&
        !hasCascadingAncestor &&
        compositeFiberDidRender(currentFiber)
      ) {
        hasCascadingAncestor = true;
      }
      currentFiber = currentFiber.child;
      currentDepth = currentDepth + 1;
    } else {
      currentFiber = null;
    }
  }

  return summaries;
};
