import { scan, printReport } from 'react-scan/dist/index.mjs'; // force production build
import React, { useEffect, useState, createContext } from 'react';
import ReactDOMClient from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { highlight } from 'sugar-high';

import './styles.css';

scan({
  enabled: true,
  // report: true,
  // log: true,
  // clearLog: true,
  // playSound: true,
  // renderCountThreshold: 100,
  runInProduction: true,
});


const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    const button = document.querySelector('.copy-button');
    if (button) {
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    }
  });
};

const TooltipContext = createContext({ tooltip: '' });

export const App = () => {
  const [tasks, setTasks] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('nextjs-pages');

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // useEffect(() => {
  //   printReport(['Button', 'AddTaskBar']);
  // }, [tasks, activeTab]);

  return (
    <TooltipContext.Provider value={{ tooltip: 'Hello' }}>
      <div className="app-container">
        <div className="main-content">
          <nav className="navbar">
            <a href="/" className="navbar-brand">
              <img
                src="/logo.svg"
                alt="react-scan-logo"
                width="30"
                height="30"
              />
              <h3>
                <strong style={{ fontFamily: 'Geist Mono, monospace' }}>
                  React Scan
                </strong>
              </h3>
            </a>
            <div className="navbar-links">
              <a
                href="https://github.com/aidenybai/react-scan#readme"
                className="navbar-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                install
              </a>
              <a
                href="https://github.com/aidenybai/react-scan"
                className="navbar-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                github
              </a>
            </div>
          </nav>

          <p>
            React Scan "scans" your React app for slow renders. It's just
            JavaScript, so you drop it in anywhere – script tag, npm, you name
            it!
          </p>

          {isMobile ? (
            <div className="demo-section">
              <img src="/demo.gif" alt="React Scan Demo" className="demo-gif" />
            </div>
          ) : (
            <div className="task-section">
              <p>Try interacting with this input to see it in action:</p>
              <AddTaskBar
                onCreate={(value) => {
                  if (!value) return;
                  setTasks([...tasks, value]);
                }}
              />
              <TaskList
                tasks={tasks}
                onDelete={(value) =>
                  setTasks(tasks.filter((task) => task !== value))
                }
              />
            </div>
          )}
        </div>

        <div className="sticky-footer">
          <br />
          <a
            href="https://github.com/aidenybai/react-scan#readme"
            className="cta-button"
          >
            View source →
          </a>
          <p>
            <small>
              Psst... need something more advanced? Check out:{' '}
              <a href="https://million.dev" className="navbar-link">
                Million Lint
              </a>
            </small>
          </p>

          <div className="installation-section">
            <h3>Install</h3>
            <p>Get started by adding this script to your app:</p>
            <div className="code-container">
              <code>
                &lt;script
                src=&quot;https://unpkg.com/react-scan/dist/auto.global.js&quot;&gt;&lt;/script&gt;
              </code>
              <button
                className="copy-button"
                onClick={() =>
                  copyToClipboard(
                    '<script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>',
                  )
                }
              >
                Copy
              </button>
            </div>
            <p>
              <small>
                <strong>Important:</strong> Add this before any other scripts
                run!
              </small>
            </p>
            <div className="framework-instructions">
              <div className="tabs">
                <button
                  className={`tab-button ${activeTab === 'nextjs-pages' ? 'active' : ''}`}
                  onClick={() => setActiveTab('nextjs-pages')}
                >
                  Next.js (pages)
                </button>
                <button
                  className={`tab-button ${activeTab === 'nextjs-app' ? 'active' : ''}`}
                  onClick={() => setActiveTab('nextjs-app')}
                >
                  Next.js (app)
                </button>
                <button
                  className={`tab-button ${activeTab === 'vite' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vite')}
                >
                  Other
                </button>
              </div>

              <div className="tab-content">
                <div
                  className={`tab-panel ${activeTab === 'nextjs-pages' ? 'active' : ''}`}
                >
                  <h4>Next.js (Pages Router)</h4>
                  <p>
                    Add script tag to <code>_document.tsx</code> in{' '}
                    <code>&lt;head&gt;</code>:
                  </p>
                  <div className="code-container">
                    <pre
                      style={{
                        width: '100%',
                        padding: '1rem',
                      }}
                    >
                      <code
                        dangerouslySetInnerHTML={{
                          __html: highlight(
                            `import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async></script>
        {/* rest of your scripts go under */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}`.trim(),
                          ),
                        }}
                      ></code>
                    </pre>
                  </div>
                </div>

                <div
                  className={`tab-panel ${activeTab === 'nextjs-app' ? 'active' : ''}`}
                >
                  <h4>Next.js (App Router)</h4>
                  <p>
                    Add to script tag to <code>layout.tsx</code> in{' '}
                    <code>&lt;head&gt;</code>:
                  </p>
                  <div className="code-container">
                    <pre
                      style={{
                        width: '100%',
                        padding: '1rem',
                      }}
                    >
                      <code
                        dangerouslySetInnerHTML={{
                          __html:
                            highlight(`export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async></script>
        {/* rest of your scripts go under */}
      </head>
      <body>{children}</body>
    </html>
  )
}`),
                        }}
                      ></code>
                    </pre>
                  </div>
                </div>

                <div
                  className={`tab-panel ${activeTab === 'vite' ? 'active' : ''}`}
                >
                  <h4>Other</h4>
                  <p>
                    Add to <code>index.html</code> in <code>&lt;head&gt;</code>:
                  </p>
                  <div className="code-container">
                    <pre
                      style={{
                        width: '100%',
                        padding: '1rem',
                      }}
                    >
                      <code
                        dangerouslySetInnerHTML={{
                          __html: highlight(`<!DOCTYPE html>
<html lang="en">
  <head>
    <script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>
    <!-- rest of your scripts go under -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>`),
                        }}
                      ></code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipContext.Provider>
  );
};

export const TaskList = ({ tasks, onDelete }) => {
  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem key={task} task={task} onDelete={onDelete} />
      ))}
    </ul>
  );
};

export const TaskItem = ({ task, onDelete }) => {
  const { tooltip } = React.useContext(TooltipContext);
  return (
    <li className="task-item" tooltip={tooltip}>
      {task}
      <Button onClick={() => onDelete(task)}>Delete</Button>
    </li>
  );
};

export const Text = ({ children }) => {
  return <span>{children}</span>;
};

export const Button = ({ onClick, children }) => {
  return (
    <button onClick={onClick}>
      <Text>{children}</Text>
    </button>
  );
};

export const AddTaskBar = ({ onCreate }) => {
  const [value, setValue] = useState('');
  const [id, setId] = useState(0);
  return (
    <div className="add-task-container">
      <Input
        onChange={(value) => setValue(value)}
        onEnter={(value) => {
          onCreate(`${value} (${id})`);
          setValue('');
          setId(id + 1);
        }}
        value={value}
      />
      <Button
        onClick={() => {
          onCreate(value);
          setValue('');
        }}
      >
        Add Task
      </Button>
    </div>
  );
};

export const Input = ({ onChange, onEnter, value }) => {
  return (
    <input
      type="text"
      className="input"
      placeholder="Today I will..."
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onEnter(e.target.value);
        }
      }}
      value={value}
    />
  );
};

ReactDOMClient.createRoot(document.getElementById('root')).render(
  <>
    <Analytics />
    <App />
  </>,
);
