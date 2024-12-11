import { scan } from 'react-scan/dist/index.mjs'; // force production build
import React, { useState, createContext } from 'react';
import ReactDOMClient from 'react-dom/client';

import './styles.css';

scan({
  enabled: true,
  // monitor: {
  //   url: 'https://localhost:3000/api/scan',
  // },
});

const TooltipContext = createContext({ tooltip: '' });

export const App = () => {
  const [tasks, setTasks] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
            Get started →
          </a>
          <p>
            <small>
              Psst... need something more advanced? Check out:{' '}
              <a href="https://million.dev" className="navbar-link">
                Million Lint
              </a>
            </small>
          </p>
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
    <App />
    {/* <Monitor apiKey="123" /> */}
  </>,
);
