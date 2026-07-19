import { useState, useContext, createContext, memo, type JSX } from "react";
import { scan, setOptions, Store } from "react-scan";

Store.isInIframe.value = false;
scan({
  enabled: true,
  dangerouslyForceRunInProduction: true,
  useOffscreenCanvasWorker:
    new URLSearchParams(window.location.search).get("outlines") !== "main-thread",
});

const ThemeContext = createContext("light");

function Counter(): JSX.Element {
  const [count, setCount] = useState(0);
  return (
    <div data-testid="counter">
      <span data-testid="count">{count}</span>
      <button data-testid="increment" type="button" onClick={() => setCount((c) => c + 1)}>
        Increment
      </button>
    </div>
  );
}

function UnstableProps(): JSX.Element {
  const [tick, setTick] = useState(0);
  return (
    <div data-testid="unstable-section">
      <button data-testid="trigger-unstable" type="button" onClick={() => setTick((t) => t + 1)}>
        Trigger ({tick})
      </button>
      <MemoChild style={{ color: "red" }} onClick={() => {}} label="unstable" />
    </div>
  );
}

const MemoChild = memo(function MemoChild({
  style,
  onClick,
  label,
}: {
  style: { color: string };
  onClick: () => void;
  label: string;
}): JSX.Element {
  return (
    <div data-testid="memo-child" style={style} onClick={onClick}>
      MemoChild: {label}
    </div>
  );
});

function ContextConsumer(): JSX.Element {
  const theme = useContext(ThemeContext);
  return <div data-testid="context-value">Theme: {theme}</div>;
}

function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext.Provider value={theme}>
      <div data-testid="theme-section">
        <button
          data-testid="toggle-theme"
          type="button"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        >
          Toggle Theme
        </button>
        <ContextConsumer />
      </div>
    </ThemeContext.Provider>
  );
}

function SlowComponent(): JSX.Element {
  const [rendering, setRendering] = useState(false);

  if (rendering) {
    const start = performance.now();
    while (performance.now() - start < 100) {
      continue;
    }
  }

  const triggerSlowRender = () => {
    setRendering(true);
    setTimeout(() => setRendering(false), 0);
  };

  return (
    <div data-testid="slow-section">
      <button data-testid="trigger-slow" type="button" onClick={triggerSlowRender}>
        Trigger Slow Render
      </button>
      <span data-testid="slow-status">{rendering ? "Rendering..." : "Idle"}</span>
    </div>
  );
}

function RapidUpdater(): JSX.Element {
  const [count, setCount] = useState(0);

  const triggerRapid = () => {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => setCount((c) => c + 1), i * 16);
    }
  };

  return (
    <div data-testid="rapid-section">
      <button data-testid="trigger-rapid" type="button" onClick={triggerRapid}>
        Rapid Updates
      </button>
      <span data-testid="rapid-count">{count}</span>
    </div>
  );
}

const SlowInput = (): JSX.Element => {
  const [value, setValue] = useState("");

  return (
    <input
      data-testid="slow-input"
      value={value}
      onKeyDown={() => {
        const start = performance.now();
        while (performance.now() - start < 100) {
          continue;
        }
      }}
      onChange={(event) => setValue(event.currentTarget.value)}
    />
  );
};

export default function E2EFixture(): JSX.Element {
  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 data-testid="heading">React Scan E2E Fixture</h1>
      <hr />
      <section>
        <h2>Counter</h2>
        <Counter />
      </section>
      <hr />
      <section>
        <h2>Unstable Props (memo bypass)</h2>
        <UnstableProps />
      </section>
      <hr />
      <section>
        <h2>Context</h2>
        <ThemeToggle />
      </section>
      <hr />
      <section>
        <h2>Slow Render</h2>
        <SlowComponent />
      </section>
      <hr />
      <section>
        <h2>Rapid Updates</h2>
        <RapidUpdater />
      </section>
      <hr />
      <section>
        <h2>Runtime Controls</h2>
        <button
          data-testid="hide-toolbar"
          type="button"
          onClick={() => setOptions({ showToolbar: false })}
        >
          Hide Toolbar
        </button>
        <button
          data-testid="show-toolbar"
          type="button"
          onClick={() => setOptions({ showToolbar: true })}
        >
          Show Toolbar
        </button>
      </section>
      <hr />
      <section>
        <h2>Slow Keyboard Input</h2>
        <SlowInput />
      </section>
    </div>
  );
}
