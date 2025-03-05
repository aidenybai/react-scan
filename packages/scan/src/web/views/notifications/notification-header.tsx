import { cn } from '~web/utils/helpers';
import {
  type NotificationEvent,
  getComponentName,
  getEventSeverity,
  getTotalTime,
} from './data';
import { CloseIcon } from './icons';
import { signalWidgetViews } from '~web/state';

export const NotificationHeader = ({
  selectedEvent,
}: {
  selectedEvent: NotificationEvent;
}) => {
  const severity = getEventSeverity(selectedEvent);
  switch (selectedEvent.kind) {
    case 'interaction': {
      return (
        // h-[48px] is a hack to adjust for header size
        <div className="w-full flex border-b border-[#27272A] min-h-[48px]">
          {/* todo: make css variables for colors */}
          <div className="min-w-fit w-full justify-start flex items-center border-[#27272A] pl-5 pr-2 text-sm gap-x-4">
            <div className="flex items-center gap-x-2 ">
              <span className="text-[#5a5a5a] mr-0.5">
                {selectedEvent.type === 'click' ? 'Clicked ' : 'Typed in '}
              </span>
              <span>{getComponentName(selectedEvent.componentPath)}</span>
              <div
                className={cn([
                  'w-fit flex items-center justify-center h-fit text-white px-1 rounded-sm font-semibold text-[10px] whitespace-nowrap',
                  severity === 'low' && 'bg-green-500/50',
                  severity === 'needs-improvement' && 'bg-[#b77116]',
                  severity === 'high' && 'bg-[#b94040]',
                ])}
              >
                {getTotalTime(selectedEvent.timing).toFixed(0)}ms processing
                time
              </div>
            </div>
            <div className="flex items-center gap-x-2  justify-end ml-auto">
              <div className="p-2 flex justify-center items-center border-[#27272A]">
                <button
                  type="button"
                  onClick={() => {
                    signalWidgetViews.value = {
                      view: 'none',
                    };
                  }}
                >
                  <CloseIcon size={18} className="text-[#6F6F78]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    case 'dropped-frames': {
      return (
        <div className="w-full flex border-b border-[#27272A] min-h-[48px]">
          <div className="min-w-fit w-full justify-start flex items-center border-[#27272A] pl-5 pr-2 text-sm gap-x-4">
            <div className="flex items-center gap-x-2">
              FPS Drop
              <div
                className={cn([
                  'w-fit flex items-center justify-center h-fit text-white px-1 rounded-sm font-semibold text-[10px] whitespace-nowrap',
                  severity === 'low' && 'bg-green-500/50',
                  severity === 'needs-improvement' && 'bg-[#b77116]',
                  severity === 'high' && 'bg-[#b94040]',
                ])}
              >
                dropped to {selectedEvent.fps} FPS
              </div>
            </div>

            <div className="flex items-center gap-x-2 w-2/4 justify-end ml-auto">
              <div className="p-2 flex justify-center items-center border-[#27272A]">
                <button
                  type="button"
                  onClick={() => {
                    signalWidgetViews.value = {
                      view: 'none',
                    };
                  }}
                >
                  <CloseIcon size={18} className="text-[#6F6F78]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
};
