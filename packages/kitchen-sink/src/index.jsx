import { scan } from 'react-scan/dist/index.mjs'; // force production build
import React, { useState, createContext } from 'react';
import ReactDOMClient from 'react-dom/client';

import './styles.css';

scan({
  enabled: true,
  dangerouslyForceRunInProduction: true,
  // monitor: {
  //   url: 'https://localhost:3000/api/scan',
  // },
});

const TooltipContext = createContext({ tooltip: '' });

export const App = () => {
  const [tasks, setTasks] = useState([]);

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
          </nav>

          <div className="task-section">
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
        </div>
      </div>
    </TooltipContext.Provider>
  );
};

export const TaskList = ({ tasks, onDelete }) => {
  return (
    <ul>
      {tasks.map((task, i) => (
        <TaskItem key={`${task}_${i}`} task={task} onDelete={onDelete} />
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
          if (e.target.value.length === 0) return;
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
