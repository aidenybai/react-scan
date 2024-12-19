import { useRef, useEffect, useCallback } from "preact/hooks";
import { getDisplayName } from 'bippy';
import { Store } from "../../../..";
import { getCompositeComponentFromElement, getOverrideMethods } from "../../inspect-element/utils";
import { replayComponent } from "../../inspect-element/view-state";
import { Icon } from "../icon";
import { debounce } from "../../utils/helpers";

const BtnReplay = () => {
  const refBtnReplay = useRef<HTMLButtonElement>(null);
  const refIsReplaying = useRef(false);
  const timeoutRef = useRef<number>();

  const { overrideProps, overrideHookState } = getOverrideMethods();
  const canEdit = !overrideProps;

  const handleReplay = useCallback((e: MouseEvent) => {
    e.stopPropagation();

    const inspectState = Store.inspectState.value;
    if (refIsReplaying.current || inspectState.kind !== 'focused') return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(inspectState.focusedDomElement);
    if (!parentCompositeFiber || !overrideProps || !overrideHookState) return;

    refIsReplaying.current = true;
    refBtnReplay.current?.classList.add('disabled');

    void replayComponent(parentCompositeFiber).finally(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const cleanup = () => {
        refIsReplaying.current = false;
        refBtnReplay.current?.classList.remove('disabled');
      };

      if (document.hidden) {
        cleanup();
      } else {
        timeoutRef.current = window.setTimeout(cleanup, 300);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!canEdit) return null;

  return (
    <button
      ref={refBtnReplay}
      title="Replay component"
      className="react-scan-replay-button"
      onClick={handleReplay}
    >
      <Icon name="icon-replay" />
    </button>
  );
};

export const Header = () => {
  const refComponentName = useRef<HTMLSpanElement>(null);
  const refMetrics = useRef<HTMLSpanElement>(null);

  const handleClose = useCallback(() => {
    if (Store.inspectState.value.propContainer) {
      Store.inspectState.value = {
        kind: 'inspect-off',
        propContainer: Store.inspectState.value.propContainer,
      };
    }
  }, []);

  const updateHeaderContent = useCallback(() => {
    const inspectState = Store.inspectState.value;
    if (inspectState.kind !== 'focused') return;

    const focusedDomElement = inspectState.focusedDomElement;
    if (!refComponentName.current || !refMetrics.current || !focusedDomElement) return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(focusedDomElement);
    if (!parentCompositeFiber) return;

    const currentComponentName = refComponentName.current.dataset.text;
    const currentMetrics = refMetrics.current.dataset.text;

    const fiber = parentCompositeFiber.alternate ?? parentCompositeFiber;
    const reportData = Store.reportData.get(fiber);
    const componentName = getDisplayName(parentCompositeFiber.type) ?? 'Unknown';

    if (componentName === currentComponentName && reportData?.count === 0) {
      return;
    }

    const renderCount = reportData?.count ?? 0;
    const renderTime = reportData?.time ?? 0;
    const newMetrics = renderCount > 0
      ? `${renderCount} renders${renderTime > 0 ? ` • ${renderTime.toFixed(2)}ms` : ''}`
      : '';

    if (componentName !== currentComponentName || newMetrics !== currentMetrics) {
      requestAnimationFrame(() => {
        if (!refComponentName.current || !refMetrics.current) return;
        refComponentName.current.dataset.text = componentName;
        refMetrics.current.dataset.text = newMetrics;
      });
    }
  }, []);

  useEffect(() => {
    const debouncedUpdate = debounce(updateHeaderContent, 16, { leading: true });

    const unsubscribeLastReportTime = Store.lastReportTime.subscribe(debouncedUpdate);
    const unsubscribeStoreInspectState = Store.inspectState.subscribe(state => {
      if (state.kind === 'focused') {
        debouncedUpdate();
      }
    });

    return () => {
      unsubscribeLastReportTime();
      unsubscribeStoreInspectState();
      debouncedUpdate.cancel?.();
    };
  }, [updateHeaderContent]);

  return (
    <div className="react-scan-header">
      <span
        ref={refComponentName}
        className="with-data-text"
      />
      <span
        ref={refMetrics}
        className="with-data-text mr-auto !overflow-visible text-xs text-[#888]"
      />

      <BtnReplay />

      <button
        title="Close"
        class="react-scan-close-button"
        onClick={handleClose}
      >
        <Icon name="icon-close" />
      </button>
    </div>
  );
};
