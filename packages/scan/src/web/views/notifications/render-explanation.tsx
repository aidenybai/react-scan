import { cn } from '~web/utils/helpers';
import { type NotificationEvent, useNotificationsContext } from './data';
import { useLayoutEffect, useState } from 'preact/hooks';
import { ArrowLeft, CloseIcon } from './icons';
import { getIsProduction } from '~core/index';

export const RenderExplanation = ({
  selectedEvent: _,
  selectedFiber,
}: {
  selectedFiber: NotificationEvent['groupedFiberRenders'][number];
  selectedEvent: NotificationEvent;
}) => {
  const { setRoute } = useNotificationsContext();
  const [tipisShown, setTipIsShown] = useState(true);
  const [isProduction] = useState(getIsProduction());

  useLayoutEffect(() => {
    const res = localStorage.getItem('react-scan-tip-shown');
    const asBool = res === 'true' ? true : res === 'false' ? false : null;
    if (asBool === null) {
      setTipIsShown(true);
      localStorage.setItem('react-scan-tip-is-shown', 'true');
      return;
    }
    if (!asBool) {
      setTipIsShown(false);
    }
  }, []);
  const isMemoizable =
    selectedFiber.changes.context.length === 0 &&
    selectedFiber.changes.props.length === 0 &&
    selectedFiber.changes.state.length === 0;
  return (
    <div
      className={cn([
        'w-full min-h-fit h-full flex flex-col py-4 pt-0 rounded-sm',
      ])}
    >
      <div className={cn(['flex items-start gap-x-4 '])}>
        <button
          type="button"
          onClick={() => {
            setRoute({
              route: 'render-visualization',
              routeMessage: null,
            });
          }}
          className={cn([
            'text-white hover:bg-[#34343b] flex gap-x-1 justify-center items-center mb-4 w-fit px-2.5 py-1.5 text-xs rounded-sm bg-[#18181B]',
          ])}
        >
          <ArrowLeft size={14} /> <span>Overview</span>
        </button>
        <div className={cn(['flex flex-col gap-y-1'])}>
          <div
            className={cn(['text-sm font-bold text-white overflow-x-hidden'])}
          >
            <div className="flex items-center gap-x-2 truncate">
              {selectedFiber.name}
            </div>
          </div>
          <div className={cn(['flex gap-x-2'])}>
            {
              !isProduction && (
                <div className="text-xs text-gray-400">
                  • Render time: {selectedFiber.totalTime.toFixed(0)}ms
                </div>
              )
            }
            <div className="text-xs text-gray-400 mb-4">
              • Renders: {selectedFiber.count}x
            </div>
          </div>
        </div>
      </div>
      {tipisShown && !isMemoizable && (
        <div
          className={cn([
            'w-full mb-4 bg-[#0A0A0A] border border-[#27272A] rounded-sm overflow-hidden flex relative',
          ])}
        >
          <button
            type="button"
            onClick={() => {
              setTipIsShown(false);

              localStorage.setItem('react-scan-tip-shown', 'false');
            }}
            className={cn([
              'absolute right-2 top-2 rounded-sm p-1 hover:bg-[#18181B]',
            ])}
          >
            <CloseIcon size={12} />
          </button>
          <div className={cn(['w-1 bg-[#d36cff]'])} />
          <div className={cn(['flex-1'])}>
            <div
              className={cn(['px-3 py-2 text-gray-100 text-xs font-semibold'])}
            >
              How to stop renders
            </div>
            <div className={cn(['px-3 pb-2 text-gray-400 text-[10px]'])}>
              Stop the following props, state and context from changing between
              renders, and wrap the component in React.memo if not already
            </div>
          </div>
        </div>
      )}

      {isMemoizable && (
        <div
          className={cn([
            'w-full mb-4 bg-[#0A0A0A] border border-[#27272A] rounded-sm overflow-hidden flex',
          ])}
        >
          <div className={cn(['w-1 bg-[#d36cff]'])} />
          <div className={cn(['flex-1'])}>
            <div
              className={cn(['px-3 py-2 text-gray-100 text-sm font-semibold'])}
            >
              No changes detected
            </div>
            <div className={cn(['px-3 pb-2 text-gray-400 text-xs'])}>
              This component would not of rendered if it was memoized
            </div>
          </div>
        </div>
      )}
      <div className={cn(['flex w-full'])}>
        <div
          className={cn([
            'flex flex-col border border-[#27272A] rounded-l-sm overflow-hidden w-1/3',
          ])}
        >
          <div
            className={cn([
              'text-[14px] font-semibold px-2 py-2 bg-[#18181B] text-white flex justify-center',
            ])}
          >
            Changed Props
          </div>
          {selectedFiber.changes.props.length > 0 ? (
            selectedFiber.changes.props
              .toSorted((a, b) => b.count - a.count)
              .map((change) => (
                <div
                  key={change.name}
                  className={cn([
                    'flex flex-col justify-between items-center border-t overflow-x-auto border-[#27272A] px-1 py-1 text-wrap bg-[#0A0A0A] text-[10px]',
                  ])}
                >
                  <span className={cn(['text-white '])}>{change.name}</span>
                  <div
                    className={cn([' text-[8px]  text-[#d36cff] pl-1 py-1 '])}
                  >
                    {change.count}/{selectedFiber.count}x
                  </div>
                </div>
              ))
          ) : (
            <div
              className={cn([
                'flex items-center justify-center h-full bg-[#0A0A0A] text-[#A1A1AA] border-t border-[#27272A]',
              ])}
            >
              No changes
            </div>
          )}
        </div>
        <div
          className={cn([
            'flex flex-col border border-[#27272A] border-l-0 overflow-hidden w-1/3',
          ])}
        >
          <div
            className={cn([
              ' text-[14px] font-semibold px-2 py-2 bg-[#18181B] text-white flex justify-center',
            ])}
          >
            Changed State
          </div>
          {selectedFiber.changes.state.length > 0 ? (
            selectedFiber.changes.state
              .toSorted((a, b) => b.count - a.count)
              .map((change) => (
                <div
                  key={change.index}
                  className={cn([
                    'flex flex-col justify-between items-center border-t overflow-x-auto border-[#27272A] px-1 py-1 text-wrap bg-[#0A0A0A] text-[10px]',
                  ])}
                >
                  <span className={cn(['text-white '])}>
                    index {change.index}
                  </span>
                  <div
                    className={cn([
                      'rounded-full  text-[#d36cff] pl-1 py-1 text-[8px]',
                    ])}
                  >
                    {change.count}/{selectedFiber.count}x
                  </div>
                </div>
              ))
          ) : (
            <div
              className={cn([
                'flex items-center justify-center h-full bg-[#0A0A0A] text-[#A1A1AA] border-t border-[#27272A]',
              ])}
            >
              No changes
            </div>
          )}
        </div>
        <div
          className={cn([
            'flex flex-col border border-[#27272A] border-l-0 rounded-r-sm overflow-hidden w-1/3',
          ])}
        >
          <div
            className={cn([
              ' text-[14px] font-semibold px-2 py-2 bg-[#18181B] text-white flex justify-center',
            ])}
          >
            Changed Context
          </div>
          {selectedFiber.changes.context.length > 0 ? (
            selectedFiber.changes.context

              .toSorted((a, b) => b.count - a.count)
              .map((change) => (
                <div
                  key={change.name}
                  className={cn([
                    'flex flex-col justify-between items-center border-t  border-[#27272A] px-1 py-1 bg-[#0A0A0A] text-[10px] overflow-x-auto',
                  ])}
                >
                  <span className={cn(['text-white '])}>{change.name}</span>
                  <div
                    className={cn([
                      'rounded-full text-[#d36cff] pl-1 py-1 text-[8px] text-wrap',
                    ])}
                  >
                    {change.count}/{selectedFiber.count}x
                  </div>
                </div>
              ))
          ) : (
            <div
              className={cn([
                'flex items-center justify-center h-full bg-[#0A0A0A] text-[#A1A1AA] border-t border-[#27272A] py-2',
              ])}
            >
              No changes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
