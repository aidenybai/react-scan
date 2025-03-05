import { cn } from '~web/utils/helpers';
import { type NotificationEvent, useNotificationsContext } from './data';
import { Popover } from './popover';
import { VolumeOffIcon, VolumeOnIcon } from './icons';
import { playNotificationSound } from '~core/utils';

export const NotificationTabs = ({
  selectedEvent: _,
}: {
  selectedEvent: NotificationEvent;
}) => {
  const { notificationState, setNotificationState, setRoute } =
    useNotificationsContext();
  return (
    <div className="flex w-full justify-between items-center px-3 py-2 text-xs">
      <div className="bg-[#18181B] flex items-center gap-x-1 p-1 rounded-sm">
        <button
          type="button"
          onClick={() => {
            setRoute({
              route: 'render-visualization',
              routeMessage: null,
            });
          }}
          className={cn([
            'w-1/2 flex items-center justify-center whitespace-nowrap py-[5px] px-1 gap-x-1',
            notificationState.route === 'render-visualization' ||
            notificationState.route === 'render-explanation'
              ? 'text-white bg-[#7521c8] rounded-sm'
              : 'text-[#6E6E77] bg-[#18181B] rounded-sm',
          ])}
        >
          Ranked
        </button>
        <button
          type="button"
          onClick={() => {
            setRoute({
              route: 'other-visualization',
              routeMessage: null,
            });
          }}
          className={cn([
            'w-1/2 flex items-center justify-center whitespace-nowrap py-[5px] px-1 gap-x-1',
            notificationState.route === 'other-visualization'
              ? 'text-white bg-[#7521c8] rounded-sm'
              : 'text-[#6E6E77] bg-[#18181B] rounded-sm',
          ])}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => {
            setRoute({
              route: 'optimize',
              routeMessage: null,
            });
          }}
          className={cn([
            'w-1/2 flex items-center justify-center whitespace-nowrap py-[5px] px-1 gap-x-1',
            notificationState.route === 'optimize'
              ? 'text-white bg-[#7521c8] rounded-sm'
              : 'text-[#6E6E77] bg-[#18181B] rounded-sm',
          ])}
        >
          <span>Prompts</span>
        </button>
      </div>
      <Popover
        triggerContent={
          <button
            type="button"
            className="ml-auto"
            onClick={() => {
              setNotificationState((prev) => {
                if (
                  prev.audioNotificationsOptions.enabled &&
                  prev.audioNotificationsOptions.audioContext.state !== 'closed'
                ) {
                  prev.audioNotificationsOptions.audioContext.close();
                }
                const prevEnabledState = prev.audioNotificationsOptions.enabled;
                localStorage.setItem(
                  'react-scan-notifications-audio',
                  String(!prevEnabledState),
                );

                const audioContext = new AudioContext();
                if (!prev.audioNotificationsOptions.enabled) {
                  playNotificationSound(audioContext);
                }
                if (prevEnabledState) {
                  audioContext.close();
                }
                return {
                  ...prev,
                  audioNotificationsOptions: prevEnabledState
                    ? {
                        audioContext: null,
                        enabled: false,
                      }
                    : {
                        audioContext,
                        enabled: true,
                      },
                };
              });
            }}
          >
            <div className="flex gap-x-2 justify-center items-center text-[#6E6E77]">
              <span>Alerts</span>
              {notificationState.audioNotificationsOptions.enabled ? (
                <VolumeOnIcon size={16} className="text-[#6E6E77]" />
              ) : (
                <VolumeOffIcon size={16} className="text-[#6E6E77]" />
              )}
            </div>
          </button>
        }
      >
        Play a chime when a slowdown is recorded
      </Popover>
    </div>
  );
};
