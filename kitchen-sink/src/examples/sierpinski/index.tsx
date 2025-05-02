/**
 *  Modified version of https://github.com/ryansolid/solid-sierpinski-triangle-demo
 **/
// import { Analytics } from '@vercel/analytics/react';
import { useEffect, useMemo, useState } from 'react';
import { scan, Store } from 'react-scan';

import './styles.css';

Store.isInIframe.value = false;
scan({
  enabled: true,
  dangerouslyForceRunInProduction: true,
});

const TARGET = 50;

const TriangleDemo = () => {
  const [elapsed, setElapsed] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const scale = useMemo(() => {
    const e = (elapsed / 1000) % 10;
    return 1 + (e > 5 ? 10 - e : e) / 10;
  }, [elapsed]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s % 10) + 1), 1000);

    let f: number;
    const start = Date.now();
    const update = () => {
      setElapsed(Date.now() - start);
      f = requestAnimationFrame(update);
    };
    f = requestAnimationFrame(update);

    return () => {
      clearInterval(t);
      cancelAnimationFrame(f);
    };
  }, []);

  return (
    <div
      className="container"
      style={{
        transform: 'scaleX(' + scale / 2.1 + ') scaleY(0.7) translateZ(0.1px)',
      }}
    >
      <Triangle x={0} y={0} s={1000} seconds={seconds} />
    </div>
  );
};

interface SlowTriangleProps {
  x: number;
  y: number;
  s: number;
  seconds: number;
}

const SlowTriangle = ({ x, y, s, seconds }: SlowTriangleProps) => {
  s = s / 2;

  const slow = useMemo(() => {
    const e = performance.now() + 0.8;
    // Artificially long execution time.
    while (performance.now() < e) {}
    return seconds;
  }, [seconds]);

  return (
    <>
      <Triangle x={x} y={y - s / 2} s={s} seconds={slow} />
      <Triangle x={x - s} y={y + s / 2} s={s} seconds={slow} />
      <Triangle x={x + s} y={y + s / 2} s={s} seconds={slow} />
    </>
  );
};

interface TriangleProps {
  x: number;
  y: number;
  s: number;
  seconds: number;
}

const Triangle = ({ x, y, s, seconds }: TriangleProps) => {
  if (s <= TARGET) {
    return (
      <Dot x={x - TARGET / 2} y={y - TARGET / 2} s={TARGET} text={seconds} />
    );
  }
  return <SlowTriangle x={x} y={y} s={s} seconds={seconds} />;
};

interface DotProps {
  x: number;
  y: number;
  s: number;
  text: number;
}

const Dot = ({ x, y, s, text }: DotProps) => {
  const [hover, setHover] = useState(false);
  const onEnter = () => setHover(true);
  const onExit = () => setHover(false);

  return (
    <div
      className="dot"
      style={{
        width: s + 'px',
        height: s + 'px',
        left: x + 'px',
        top: y + 'px',
        borderRadius: s / 2 + 'px',
        lineHeight: s + 'px',
        background: hover ? '#ff0' : '#61dafb',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onExit}
    >
      {hover ? '**' + text + '**' : text}
    </div>
  );
};

export default function App(): JSX.Element {
  return (
    <>
      {/* <Analytics /> */}
      <TriangleDemo />
    </>
  );
}
