import { ReactNode, useEffect, useRef, useState } from 'preact/compat';
import { playNotificationSound } from '~core/utils';
import { signalNotificationsOpen, signalSettingsOpen } from '~web/state';
import { cn } from '~web/utils/helpers';
import { useNotificationsContext } from './data';
import { CloseIcon } from './icons';
import { NotificationTabs } from './notification-tabs';
import { Optimize } from './optimize';
import { OtherVisualization } from './other-visualization';
import { RenderBarChart } from './render-bar-chart';
import { RenderExplanation } from './render-explanation';

export const DetailsRoutes = () => {
  const { notificationState, setNotificationState } = useNotificationsContext();
  const [dots, setDots] = useState('...');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!notificationState.selectedEvent) {
    return (
      <div
        ref={containerRef}
        className={cn([
          'h-full w-full flex flex-col items-center justify-center relative py-2 px-4',
        ])}
      >
        <div
          className={cn([
            'p-2 flex justify-center items-center border-[#27272A] absolute top-0 right-0',
          ])}
        >
          <button
            onClick={() => {
              signalSettingsOpen.value = false;
              signalNotificationsOpen.value = false;
            }}
          >
            <CloseIcon size={18} className="text-[#6F6F78]" />
          </button>
        </div>
        <div
          className={cn([
            'flex flex-col items-start pt-5 bg-[#0A0A0A] p-5 rounded-sm max-w-md',
            ' shadow-lg',
          ])}
        >
          <div className={cn(['flex flex-col items-start gap-y-4'])}>
            <div className={cn(['flex items-center'])}>
              <span className={cn(['text-zinc-400 font-medium text-[17px]'])}>
                Scanning for slowdowns
                {dots}
              </span>
            </div>
            {notificationState.events.length !== 0 && (
              <p className={cn(['text-xs'])}>
                Click on an item in the{' '}
                <span className={cn(['text-purple-400'])}>History</span> list to
                get started
              </p>
            )}
            <p className={cn(['text-zinc-600 text-xs'])}>
              You don't need to keep this panel open for React Scan to record
              slowdowns
            </p>
            <p className={cn(['text-zinc-600 text-xs'])}>
              Enable audio alerts to hear a delightful ding every time a large
              slowdown is recorded
            </p>
            <button
              onClick={() => {
                if (notificationState.audioNotificationsOptions.enabled) {
                  setNotificationState((prev) => {
                    if (
                      prev.audioNotificationsOptions.audioContext?.state !==
                      'closed'
                    ) {
                      prev.audioNotificationsOptions.audioContext?.close();
                    }
                    return {
                      ...prev,
                      audioNotificationsOptions: {
                        audioContext: null,
                        enabled: false,
                      },
                    };
                  });
                  return;
                }
                localStorage.setItem('react-scan-notifications-audio', 'true');
                const audioContext = new AudioContext();
                playNotificationSound(audioContext);
                setNotificationState((prev) => ({
                  ...prev,
                  audioNotificationsOptions: {
                    enabled: true,
                    audioContext,
                  },
                }));
              }}
              className={cn([
                'px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-sm w-full',
                ' text-sm flex items-center gap-x-2 justify-center',
              ])}
            >
              {notificationState.audioNotificationsOptions.enabled ? (
                <>
                  <span className="flex items-center gap-x-1">
                    Disable audio alerts
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-x-1">
                    Enable audio alerts
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  switch (notificationState.route) {
    case 'render-visualization': {
      return (
        <TabLayout>
          <RenderBarChart selectedEvent={notificationState.selectedEvent} />
        </TabLayout>
      );
    }
    case 'render-explanation': {
      if (!notificationState.selectedFiber) {
        // todo: dev only
        throw new Error(
          'Invariant: must have selected fiber when viewing render explanation',
        );
      }
      return (
        <TabLayout>
          <RenderExplanation
            selectedFiber={notificationState.selectedFiber}
            selectedEvent={notificationState.selectedEvent}
          />
        </TabLayout>
      );
    }

    case 'other-visualization': {
      return (
        <TabLayout>
          <OtherVisualization selectedEvent={notificationState.selectedEvent} />
        </TabLayout>
      );
    }
    case 'optimize': {
      return (
        <TabLayout>
          <Optimize selectedEvent={notificationState.selectedEvent} />
        </TabLayout>
      );
    }
  }
  // exhaustive verification
  notificationState.route satisfies never;
};

const TabLayout = ({ children }: { children: ReactNode }) => {
  const { notificationState } = useNotificationsContext();
  if (!notificationState.selectedEvent) {
    // todo: dev only
    throw new Error(
      'Invariant: d must have selected event when viewing render explanation',
    );
  }
  return (
    <div className={cn([`w-full h-full flex flex-col gap-y-2`])}>
      <div className={cn(['h-[50px] w-full'])}>
        <NotificationTabs selectedEvent={notificationState.selectedEvent} />
      </div>
      <div
        id="overview-scroll-container"
        className={cn(['h-calc(100%-50px) flex flex-col overflow-y-auto px-3'])}
      >
        {children}
      </div>
    </div>
  );
};
