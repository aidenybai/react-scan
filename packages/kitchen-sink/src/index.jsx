import React, { createContext, useState } from 'react';
import ReactDOMClient from 'react-dom/client';
import { scan } from 'react-scan/lite'; // force production build

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
              onCreate={(task) => {
                if (!task) return;
                setTasks([...tasks, task]);
              }}
            />
            <TaskList
              tasks={tasks}
              onDelete={(task) => {
                setTasks(tasks.filter((t) => t.id !== task.id));
              }}
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
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onDelete={onDelete} />
      ))}
    </ul>
  );
};

export const TaskItem = ({ task, onDelete }) => {
  const { tooltip } = React.useContext(TooltipContext);
  return (
    <li className="task-item" tooltip={tooltip}>
      {task.text}
      <Button onClick={() => onDelete(task)}>Delete</Button>
    </li>
  );
};

export const Text = ({ children }) => {
  return <span>{children}</span>;
};

export const Button = ({ onClick, children }) => {
  return (
    <button type="button" onClick={onClick}>
      <Text>{children}</Text>
    </button>
  );
};

export const AddTaskBar = ({ onCreate }) => {
  const [value, setValue] = useState('');
  const [id, setId] = useState(0);

  const handleCreate = () => {
    if (value.length === 0) return;
    onCreate({ id: `item-${id}`, text: `${value} (${id})` });
    setValue('');
    setId(id + 1);
  };

  return (
    <div className="add-task-container">
      <Input
        onChange={(value) => setValue(value)}
        onEnter={() => {
          handleCreate();
        }}
        value={value}
      />
      <Button
        onClick={() => {
          handleCreate();
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
          onEnter();
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
