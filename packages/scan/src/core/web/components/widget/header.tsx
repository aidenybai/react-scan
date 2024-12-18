import { useRef, useEffect, useCallback } from "preact/hooks";
import { getDisplayName } from 'bippy';
import { Store } from "../../../..";
import { getCompositeComponentFromElement, getOverrideMethods } from "../../inspect-element/utils";
import { replayComponent } from "../../inspect-element/view-state";
import { Icon } from "../icon";

const BtnReplay = () => {
  const refBtnReplay = useRef<HTMLButtonElement>(null);
  const refIsReplaying = useRef(false);

  const { overrideProps, overrideHookState } = getOverrideMethods();
  const canEdit = !overrideProps;

  const handleReplay = useCallback((e: MouseEvent) => {
    e.stopPropagation();

    const inspectState = Store.inspectState.value;
    if (refIsReplaying.current || inspectState.kind !== 'focused') return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(inspectState.focusedDomElement);
    if (!parentCompositeFiber || !overrideProps || !overrideHookState) return;

    refIsReplaying.current = true;
    refBtnReplay.current?.classList.toggle('disabled');

    void replayComponent(parentCompositeFiber).finally(() => {
      setTimeout(() => {
        refIsReplaying.current = false;
        refBtnReplay.current?.classList.toggle('disabled');
      }, 300);
    });
  }, []);

  if (canEdit) {
    return (
      <button
        ref={refBtnReplay}
        title="Replay component"
        className="react-scan-replay-button"
        onClick={handleReplay}
      >
        <Icon name="icon-replay" />
      </button>
    )
  }

  return null;
}

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

    if (!refComponentName.current || !refMetrics.current) return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(focusedDomElement);
    if (!parentCompositeFiber) return;

    const reportDataFiber =
      Store.reportData.get(parentCompositeFiber) ??
      (parentCompositeFiber.alternate
        ? Store.reportData.get(parentCompositeFiber.alternate)
        : null);

    const componentName = getDisplayName(parentCompositeFiber.type) ?? 'Unknown';
    const renderCount = reportDataFiber?.count ?? 0;
    const renderTime = reportDataFiber?.time ?? 0;

    // Update both text content and dataset in a single batch
    requestAnimationFrame(() => {
      if (!refComponentName.current || !refMetrics.current) return;

      refComponentName.current.dataset.text = componentName;
      refMetrics.current.dataset.text = renderCount > 0
        ? `${renderCount} renders${renderTime > 0 ? ` • ${renderTime.toFixed(2)}ms` : ''}`
        : '';
    });
  }, []);

  useEffect(() => {
    const unsubscribeLastReportTime = Store.lastReportTime.subscribe(updateHeaderContent);

    const unsubscribeStoreInspectState = Store.inspectState.subscribe(state => {
      if (state.kind === 'focused') {
        updateHeaderContent();
      }
    });

    return () => {
      unsubscribeLastReportTime();
      unsubscribeStoreInspectState();
    };
  }, []);

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
