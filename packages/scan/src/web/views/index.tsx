import { type ReadonlySignal, computed } from '@preact/signals';
import type { ReactNode } from 'preact/compat';
import { Store } from '~core/index';
import { signalWidgetViews } from '~web/state';
import { cn } from '~web/utils/helpers';
import { Header } from '~web/widget/header';
import { ViewInspector } from './inspector';
import { Toolbar } from './toolbar';
import { NotificationWrapper } from './notifications/notifications';

const isInspecting = computed(
  () => Store.inspectState.value.kind === 'inspecting',
);

const headerClassName = computed(() =>
  cn(
    'relative',
    'flex-1',
    'flex flex-col',
    'rounded-t-lg',
    'overflow-hidden',
    'opacity-100',
    'transition-[opacity]',
    isInspecting.value && 'opacity-0 duration-0 delay-0',
  ),
);

const isInspectorViewOpen = computed(
  () => signalWidgetViews.value.view === 'inspector',
);
const isNotificationsViewOpen = computed(
  () => signalWidgetViews.value.view === 'notifications',
);

export const Content = () => {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col',
        'overflow-hidden z-10',
        'rounded-lg',
        'bg-black',
        'opacity-100',
        'transition-[border-radius]',
        'peer-hover/left:rounded-l-none',
        'peer-hover/right:rounded-r-none',
        'peer-hover/top:rounded-t-none',
        'peer-hover/bottom:rounded-b-none',
      )}
    >
      <div className={headerClassName}>
        <Header />
        <div
          className={cn(
            'relative',
            'flex-1 flex',
            'text-white',
            'bg-[#0A0A0A]',
            'transition-opacity delay-150',
            'overflow-hidden',
            'border-b border-[#222]',
          )}
        >
          <ContentView isOpen={isInspectorViewOpen}>
            <ViewInspector />
          </ContentView>

          <ContentView isOpen={isNotificationsViewOpen}>
            <NotificationWrapper />
          </ContentView>
        </div>
      </div>
      <Toolbar />
    </div>
  );
};

interface ContentViewProps {
  isOpen: ReadonlySignal<boolean>;
  children: ReactNode;
}

const ContentView = ({ isOpen, children }: ContentViewProps) => {
  return (
    <div
      className={cn(
        'flex-1',
        'opacity-0',
        'overflow-y-auto overflow-x-hidden',
        'transition-opacity delay-0',
        'pointer-events-none',
        isOpen.value && 'opacity-100 delay-150 pointer-events-auto',
      )}
    >
      <div className="absolute inset-0 flex">{children}</div>
    </div>
  );
};
