import type { ReactNode } from 'preact/compat';
import { useEffect, useRef } from 'preact/hooks';
import { Store } from '~core/index';
import { signalWidgetViews } from '~web/state';
import { cn, toggleMultipleClasses } from '~web/utils/helpers';
import { Header } from '~web/widget/header';
import { ViewInspector } from './inspector';
import { ViewSlowDowns } from './slow-downs';
import { Toolbar } from './toolbar';

export const Content = () => {
  const refContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeStoreInspectState = Store.inspectState.subscribe(
      (state) => {
        if (!refContainer.current) return;
        if (state.kind === 'inspecting') {
          toggleMultipleClasses(refContainer.current, [
            'opacity-0',
            'duration-0',
            'delay-0',
          ]);
        }
      },
    );

    return unsubscribeStoreInspectState;
  }, []);

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
        ref={refContainer}
        className={cn(
          'relative',
          'flex-1',
          'flex flex-col',
          'rounded-t-lg',
          'overflow-hidden',
          'opacity-100',
          'transition-[opacity]',
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
            'border-b border-white/10',
          )}
        >

          <ContentView isOpen={signalWidgetViews.value.view === 'inspector'}>
            <ViewInspector />
          </ContentView>

          <ContentView isOpen={signalWidgetViews.value.view === 'slow-downs'}>
            <ViewSlowDowns />
          </ContentView>
        </div>
      </div>
      <Toolbar />
    </div>
  );
};

interface ContentViewProps {
  isOpen: boolean;
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
        {
          'opacity-100 delay-150 pointer-events-auto': isOpen,
        },
      )}
    >
      <div className="absolute inset-0 flex">
        {children}
      </div>
    </div>
  );
};
