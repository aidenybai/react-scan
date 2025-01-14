'use client';

import { useState, useEffect, useCallback } from 'react';

interface Todo {
  id: number;
  text: string;
  timestamp: Date;
}

function TodoInput({
  value: input,
  onChange: setInput,
  onAdd: addTodo,
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mb-4 flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        className="flex-1 border p-2"
        placeholder="Add task..."
      />
      <AddButton onClick={addTodo} />
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-black px-4 py-2 text-white"
    >
      Add +
    </button>
  );
}

function TodoList({ items, onDelete }: {
  items: Array<Todo>;
  onDelete: (id: number) => void;
}) {
  return (
    <ul className="space-y-2">
      {items.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={() => onDelete(todo.id)}
        />
      ))}
    </ul>
  );
}

function TodoItem({ todo, onDelete }: {
  todo: Todo;
  onDelete: () => void;
}) {
  return (
    <li className="group flex items-center justify-between border p-2">
      <div>
        <div>{todo.text}</div>
        <div className="text-xs text-gray-500">
          {todo.timestamp.toLocaleTimeString()}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="px-2 text-red-500 opacity-0 group-hover:opacity-100"
      >
        ×
      </button>
    </li>
  );
}

export default function TodoDemo({ closeAction }: { closeAction: () => void }) {
  const [todos, setTodos] = useState<Array<Todo>>([]);
  const [input, setInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addTodo = useCallback(() => {
    if (!input.trim()) return;
    setTodos([...todos, {
      id: Date.now(),
      text: input,
      timestamp: new Date()
    }]);
    setInput('');
  }, [input, todos]);

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const mobileClasses = "p-4 bg-white border border-gray-200 rounded-lg w-full";
  const desktopClasses = "p-4 bg-white border-l border-gray-200 w-[400px] h-full fixed right-0 top-0 shadow-lg";

  return (
    <div className={isMobile ? mobileClasses : desktopClasses}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Demo</h2>
        <button
          onClick={closeAction}
          className="text-2xl text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      <div className="mb-4 text-sm text-gray-600">
        {todos.length} task{todos.length !== 1 ? 's' : ''}
      </div>
      <TodoInput
        value={input}
        onChange={setInput}
        onAdd={addTodo}
      />
      <TodoList items={todos} onDelete={deleteTodo} />
    </div>
  );
}
