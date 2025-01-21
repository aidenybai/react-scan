import { useState } from 'preact/hooks';
import { cn } from '~web/utils/helpers';
import { Icon } from '../icon';

import {
  type Fiber,
  type ReactContext,
  getFiberId,
  getFiberStack,
} from 'bippy';
import type { FC } from 'react';
import { inspectorState } from '.';
import { collectInspectorData } from './overlay/utils';

// Sync with
// https://github.com/facebook/react/blob/b158439a5bfac90289e63cd51e8064c455bea27c/packages/react-reconciler/src/ReactWorkTags.js#L42
const enum WorkTag {
  Function = 0,
  Class = 1,
  HostRoot = 3,
  HostPortal = 4,
  HostComponent = 5,
  HostText = 6,
  Fragment = 7,
  Mode = 8,
  ContextConsumer = 9,
  ContextProvider = 10,
  ForwardRef = 11,
  Profiler = 12,
  Suspense = 13,
  Memo = 14,
  SimpleMemo = 15,
  Lazy = 16,
  IncompleteClass = 17,
  DehydratedFragment = 18,
  SuspenseList = 19,
  Scope = 21,
  Offscreen = 22,
  LegacyHidden = 23,
  Cache = 24,
  TracingMarker = 25,
  HostHoistable = 26,
  HostSingleton = 27,
  IncompleteFunction = 28,
  Throw = 29,
  ViewTransition = 30,
}

function getWrappedName(
  outerType: FC<any>,
  innerType: FC<any>,
  wrapperName: string,
): string {
  const functionName = innerType.displayName || innerType.name || '';
  return (
    outerType.displayName ||
    (functionName !== '' ? `${wrapperName}(${functionName})` : wrapperName)
  );
}

function getContextName(type: ReactContext<any>) {
  return type.displayName || 'Context';
}

function getComponentNameFromFiber(fiber: Fiber): string | null {
  const { tag, type } = fiber;
  switch (tag as number) {
    case WorkTag.HostHoistable:
    case WorkTag.HostSingleton:
    case WorkTag.HostComponent:
      // Host component type is the display name (e.g. "div", "View")
      return type;
    case WorkTag.HostPortal:
      return 'Portal';
    case WorkTag.HostRoot:
      return 'Root';
    case WorkTag.HostText:
      return 'Text';
    case WorkTag.Fragment:
      return 'Fragment';
    case WorkTag.DehydratedFragment:
      return 'DehydratedFragment';
    case WorkTag.Cache:
      return 'Cache';
    case WorkTag.Offscreen:
      return 'Offscreen';
    case WorkTag.Profiler:
      return 'Profiler';
    case WorkTag.Scope:
      return 'Scope';
    case WorkTag.Suspense:
      return 'Suspense';
    case WorkTag.SuspenseList:
      return 'SuspenseList';
    case WorkTag.TracingMarker:
      return 'TracingMarker';
    case WorkTag.ViewTransition:
      return 'ViewTransition';
    case WorkTag.LegacyHidden:
      return 'LegacyHidden';
    case WorkTag.IncompleteClass:
    case WorkTag.IncompleteFunction:
    case WorkTag.Function:
    case WorkTag.Class:
    case WorkTag.Memo:
    case WorkTag.SimpleMemo: {
      if (typeof type === 'function') {
        return type.displayName || type.name || null;
      }
      if (typeof type === 'string') {
        return type;
      }
      return null;
    }
    case WorkTag.ContextProvider:
      if ('_context' in type) {
        return getContextName(type._context) + '.Provider';
      }
      return getContextName(type) + '.Provider';
    case WorkTag.ContextConsumer:
      if ('_context' in type) {
        return getContextName(type._context) + '.Consumer';
      }
      return getContextName(type) + '.Consumer';
    case WorkTag.ForwardRef:
      return getWrappedName(type, type.render, 'ForwardRef');
    case WorkTag.Lazy:
      return 'Lazy';
    case WorkTag.Mode:
      return 'Mode';
    case WorkTag.Throw:
      return null;
    default:
      return null;
  }
}

const ComponentStackListItem = ({ fiber }: { fiber: Fiber }) => {
  const onClick = () => {
    // TODO set inspector focus
    const { fiberProps, fiberState, fiberContext } =
      collectInspectorData(fiber);

    inspectorState.value = {
      fiber,
      fiberProps: {
        ...fiberProps,
        changes: new Set(),
      },
      fiberState: {
        ...fiberState,
        changes: new Set(),
      },
      fiberContext: {
        ...fiberContext,
        changes: new Set(),
      },
    };
  };

  return (
    <div key={getFiberId(fiber)} className="react-scan-property">
      <div className="react-scan-property-content">
        <div className="react-scan-preview-line">
          <button onClick={onClick} className="react-scan-key">
            {getComponentNameFromFiber(fiber)}
          </button>
        </div>
      </div>
    </div>
  );
};

const ComponentStackList = ({ fiber }: { fiber: Fiber }) => {
  const stack = getFiberStack(fiber).reverse();

  return (
    <div>
      {stack.map((node) => (
        <ComponentStackListItem key={getFiberId(node)} fiber={node} />
      ))}
    </div>
  );
};

export const ComponentStack = () => {
  const { fiber } = inspectorState.value;
  const [isExpanded, setIsExpanded] = useState(true);

  if (!fiber) {
    return null;
  }

  return (
    <div class="react-scan-section">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center w-full"
      >
        <Icon
          name="icon-chevron-right"
          size={12}
          className={cn({
            'rotate-90': isExpanded,
          })}
        />
        <span className="ml-1">Component Stack</span>
      </button>
      <div
        className={cn('react-scan-expandable', {
          'react-scan-expanded': isExpanded,
        })}
      >
        <ComponentStackList fiber={fiber} />
      </div>
    </div>
  );
};
