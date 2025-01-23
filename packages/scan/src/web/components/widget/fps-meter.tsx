import { useComputed, useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { getFPS } from '~core/instrumentation';
import { constant } from '~web/utils/preact/constant';

export const FpsMeter = constant(() => {
  const fps = useSignal<number | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fps.value = getFPS();
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  const fpsColor = useComputed(() => {
    const current = fps.value;
    if (!current) return '#fff';
    if (current < 30) return '#f87171';
    if (current < 50) return '#fbbf24';
    return '#fff';
  });

  const fpsStyle = useComputed(() => ({
    color: fpsColor.value,
    transition: 'color 150ms ease',
    minWidth: '28px',
    textAlign: 'right',
    fontWeight: 500,
  }));

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
      <span style={fpsStyle}>{fps}</span>
    </span>
  );
});
