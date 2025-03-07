import { useEffect, useState } from 'preact/hooks';
import { getFPS } from '~core/instrumentation';
import { cn } from '~web/utils/helpers';

export const FpsMeterInner = ({fps}:{fps: number}) => {


  const getColor = (fps: number) => {
    if (fps < 30) return '#EF4444';
    if (fps < 50) return '#F59E0B';
    return 'rgb(214,132,245)';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-x-1 px-2 w-full',
        'h-6',
        'rounded-md',
        'font-mono leading-none',
        'bg-[#141414]',
        'ring-1 ring-white/[0.08]',
      )}
    >
      <div
        style={{ color: getColor(fps) }}
        className="text-sm font-semibold tracking-wide transition-colors ease-in-out w-full flex justify-center items-center"
      >
        {fps}
      </div>
      <span className="text-white/30 text-[11px] font-medium tracking-wide ml-auto min-w-fit">
        FPS
      </span>
    </div>
  );
};


export const FPSMeter = () => {
  const [fps, setFps] = useState<null | number>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFps(getFPS());
    }, 200);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={cn(
        'flex items-center justify-end gap-x-2 px-1 ml-1 w-[72px]',
        'whitespace-nowrap text-sm text-white',
      )}
    >
      {/* fixme: default fps state*/}
      {fps === null ? <>️</> : <FpsMeterInner fps={fps} />}
    </div>
  );
};


