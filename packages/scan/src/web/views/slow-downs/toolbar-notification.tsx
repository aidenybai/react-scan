import { useCallback } from "preact/hooks";
import { Store } from "~core/index";
import { Icon } from "~web/components/icon";
import { useDelayedValue } from "~web/hooks/use-mount-delay";
import { signalSlowDowns, signalWidget, signalWidgetViews } from "~web/state";
import { cn } from "~web/utils/helpers";

export const ToolbarNotification = () => {
  const slowDowns = signalSlowDowns.value.slowDowns;
  const hideNotification = signalSlowDowns.value.hideNotification;
  const isMounted = useDelayedValue(slowDowns > 0 && !hideNotification, 0, 200);
  const isOpen = useDelayedValue(isMounted && !hideNotification, 100, 100);

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  (window as any).slowDowns = signalSlowDowns;

  const handleOpen = useCallback(() => {
    Store.inspectState.value = {
      kind: 'inspect-off',
    };
    signalWidgetViews.value = {
      view: 'slow-downs'
    };
  }, []);

  const handleClose = useCallback((e: Event) => {
    e.stopPropagation();
    signalSlowDowns.value = {
      ...signalSlowDowns.value,
      hideNotification: true,
    };
  }, []);

  const corner = signalWidget.value.corner;
  const isWidgetTopOfTheScreen = ['top-left', 'top-right'].includes(corner);

  if (!isMounted) return null;

  return (
    <button
      type="button"
      id="react-scan-toolbar-notification"
      onClick={handleOpen}
      className={cn(
        'react-scan-toolbar-notification',
        {
          'position-top': isWidgetTopOfTheScreen,
          'position-bottom': !isWidgetTopOfTheScreen,
          'is-open': isOpen && signalWidgetViews.value.view !== 'slow-downs',
        }
      )}
    >
      <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-duration-200" />
      {slowDowns} Slow Down{slowDowns === 0 ? '' : 's'}
      <button
        type="button"
        className="ml-auto w-4 h-4 flex items-center justify-center text-neutral-300"
        onClick={handleClose}
      >
        <Icon name="icon-close" size={12} />
      </button>
    </button>
  );
};
