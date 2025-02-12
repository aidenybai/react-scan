import { type ReadonlySignal, useComputed } from '@preact/signals';
import type { ReactNode } from 'preact/compat';
import { Store } from '~core/index';
import { signalWidgetViews } from '~web/state';
import { cn } from '~web/utils/helpers';
import { Header } from '~web/widget/header';
import { ViewInspector } from './inspector';
import { ViewSlowDowns } from './slow-downs';
import { Toolbar } from './toolbar';

export const Content = () => {
  const isInspecting = useComputed(
    () => Store.inspectState.value.kind === 'inspecting',
  );

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
      <div
        className={useComputed(() =>
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
        )}
      >
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
          <ContentView
            isOpen={useComputed(
              () => signalWidgetViews.value.view === 'inspector',
            )}
          >
            <ViewInspector />
          </ContentView>

          <ContentView
            isOpen={useComputed(
              () => signalWidgetViews.value.view === 'slow-downs',
            )}
          >
            <ViewSlowDowns />
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
      className={useComputed(() =>
        cn(
          'flex-1',
          'opacity-0',
          'overflow-y-auto overflow-x-hidden',
          'transition-opacity delay-0',
          'pointer-events-none',
          {
            'opacity-100 delay-150 pointer-events-auto': isOpen.value,
          },
        ),
      )}
    >
      <div className="absolute inset-0 flex">{children}</div>
    </div>
  );
};
