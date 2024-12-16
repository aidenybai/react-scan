import { useState, useEffect } from 'preact/hooks';
import { getFPS } from '../../../instrumentation';
import { cn } from '@web-utils/helpers';

export const FpsMeter = () => {
  const [fps, setFps] = useState(getFPS());

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(getFPS());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  let textColor = 'text-white';
  let bgColor = 'bg-neutral-700';

  if (fps < 10) {
    textColor = 'text-white';
    bgColor = 'bg-red-500';
  } else if (fps < 30) {
    textColor = 'text-black';
    bgColor = 'bg-yellow-300';
  }

  return (
    <span
      className={cn(
        'flex gap-1 items-center ml-2 px-2 py-1 rounded-full text-xs font-mono',
        bgColor,
        textColor,
        'whitespace-nowrap',
      )}
    >
      {fps} <span className="text-[0.5rem]">FPS</span>
    </span>
  );
};

export default FpsMeter;
