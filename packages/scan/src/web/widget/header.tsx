import { Store } from '~core/index';
import { Icon } from '~web/components/icon';
import { useDelayedValue } from '~web/hooks/use-delayed-value';
import { signalWidgetViews } from '~web/state';
import { cn } from '~web/utils/helpers';
import { HeaderInspect } from '~web/views/inspector/header';

export const Header = () => {
  const isInitialView = useDelayedValue(
    Store.inspectState.value.kind === 'focused',
    150,
    0,
  );
  const handleClose = () => {
    signalWidgetViews.value = {
      view: 'none',
    };
    Store.inspectState.value = {
      kind: 'inspect-off',
    };
  };

  const isHeaderIsNotifications =
    signalWidgetViews.value.view === 'notifications';

  if (isHeaderIsNotifications) {
    return;
  }

  return (
    <div className="react-scan-header">
      <div className="relative flex-1 h-full">
        <div
          className={cn(
            'react-scan-header-item is-visible',
            !isInitialView && '!duration-0',
          )}
        >
          <HeaderInspect />
        </div>
      </div>

      <button
        type="button"
        title="Close"
        className="react-scan-close-button"
        onClick={handleClose}
      >
        <Icon name="icon-close" />
      </button>
    </div>
  );
};
