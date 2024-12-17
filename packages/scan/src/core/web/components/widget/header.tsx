import { useRef, useEffect, useCallback, useState } from "preact/hooks";
import { getDisplayName } from 'bippy';
import { cn } from "@web-utils/helpers";
import { Store } from "../../../..";
import { getCompositeComponentFromElement, getOverrideMethods } from "../../inspect-element/utils";
import { replayComponent } from "../../inspect-element/view-state";
import { Icon } from "../icon";

export const Header = () => {
  const inspectState = Store.inspectState.value;
  const refComponentName = useRef<HTMLSpanElement>(null);
  const refMetrics = useRef<HTMLSpanElement>(null);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      if (!refComponentName.current || !refMetrics.current) return;
      if (inspectState.kind !== 'focused') return;

      if (!document.contains(inspectState.focusedDomElement)) {
        if (Store.inspectState.value.propContainer) {
          Store.inspectState.value = {
            kind: 'inspect-off',
            propContainer: Store.inspectState.value.propContainer,
          };
        }
        return;
      }


      const { parentCompositeFiber } = getCompositeComponentFromElement(inspectState.focusedDomElement);

      if (!parentCompositeFiber) return;

      const reportDataFiber =
        Store.reportData.get(parentCompositeFiber) ??
        (parentCompositeFiber.alternate
          ? Store.reportData.get(parentCompositeFiber.alternate)
          : null);

      const componentName = getDisplayName(parentCompositeFiber.type) ?? 'Unknown';

      const renderCount = reportDataFiber?.count ?? 0;
      const renderTime = reportDataFiber?.time ?? 0;

      refComponentName.current.textContent = componentName;
      refMetrics.current.textContent = renderCount > 0
        ? `${renderCount} renders${renderTime > 0 ? ` • ${renderTime.toFixed(2)}ms` : ''}`
        : '';
    };

    const unsubscribe = Store.lastReportTime.subscribe(updateMetrics);

    return () => {
      unsubscribe();
    };
  }, [inspectState]);

  const handleClose = useCallback(() => {
    if (Store.inspectState.value.propContainer) {
      Store.inspectState.value = {
        kind: 'inspect-off',
        propContainer: Store.inspectState.value.propContainer,
      };
    }
  }, []);

  const handleReplay = useCallback((e: MouseEvent) => {
    void (async () => {
      e.stopPropagation();
      if (isReplaying || inspectState.kind !== 'focused') return;

      const { parentCompositeFiber } = getCompositeComponentFromElement(inspectState.focusedDomElement);
      if (!parentCompositeFiber) return;

      const { overrideProps, overrideHookState } = getOverrideMethods();
      if (!overrideProps || !overrideHookState) return;

      setIsReplaying(true);

      try {
        await replayComponent(parentCompositeFiber);
      } finally {
        setTimeout(() => {
          setIsReplaying(false);
        }, 300);
      }
    })();
  }, [inspectState, isReplaying]);

  const { overrideProps } = getOverrideMethods();
  const canEdit = !!overrideProps;

  return (
    <div
      className={cn(
        "react-scan-header",
        "flex",
        "min-h-9",
        'whitespace-nowrap',
        "overflow-hidden",
      )}
    >
      <div className="react-scan-header-left overflow-hidden">
        <span ref={refComponentName} className="react-scan-component-name" />
        <span ref={refMetrics} className="react-scan-metrics" />
      </div>
      <div class="react-scan-header-right">
        {canEdit && (
          <button
            title="Replay component"
            class={`react-scan-replay-button${isReplaying ? ' disabled' : ''}`}
            onClick={handleReplay}
          >
            <Icon name="icon-replay" />
          </button>
        )}
        <button
          title="Close"
          class="react-scan-close-button"
          onClick={handleClose}
        >
          <Icon name="icon-close" />
        </button>
      </div>
    </div>
  );
};
