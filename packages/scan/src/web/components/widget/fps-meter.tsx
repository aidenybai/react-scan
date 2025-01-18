import { useEffect, useState } from 'preact/hooks';
import { getFPS } from '~core/instrumentation';
import { cn } from '~web/utils/helpers';

export const FpsMeter = () => {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFps(getFPS());
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  const getFpsColor = (fps: number | null) => {
    if (!fps) return '#fff';
    if (fps < 30) return '#f87171';
    if (fps < 50) return '#fbbf24';
    return '#fff';
  };

  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'end',
        gap: '4px',
        padding: '0 8px',
        height: '24px',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
        color: '#666',
        backgroundColor: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '3px',
        whiteSpace: 'nowrap',
        marginLeft: '12px',
        minWidth: '72px',
      }}
    >
      <span style={{ color: '#666', letterSpacing: '0.5px' }}>FPS</span>
      <span
        style={{
          color: getFpsColor(fps),
          transition: 'color 150ms ease',
          minWidth: '28px',
          textAlign: 'right',
          fontWeight: 500,
        }}
      >
        {fps}
      </span>
    </span>
  );
};

export default FpsMeter;
