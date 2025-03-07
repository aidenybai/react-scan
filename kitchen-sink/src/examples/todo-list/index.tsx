import { useState } from 'react';
import { scan, Store } from 'react-scan';
import './styles.css';


Store.isInIframe.value = false;
scan({
  enabled: true,
  dangerouslyForceRunInProduction: true,
});

interface TodoItem {
  id: number;
  message: string;
  done: boolean;
}

interface TodoListItemProps {
  setList: (action: (list: TodoItem[]) => TodoItem[]) => void;
  item: TodoItem;
}

function TodoListItem({ item, setList }: TodoListItemProps): JSX.Element {
  return (
    <div className={`todo-item ${item.done ? 'complete' : 'pending'}`}>
      <div className="todo-item-content">{item.message}</div>
      <div className="todo-item-actions">
        <button
          type="button"
          className={`todo-item-toggle ${item.done ? 'complete' : 'pending'}`}
          onClick={(): void => {
            setList(list =>
              list.map(value => {
                if (value === item) {
                  return {
                    ...value,
                    done: !item.done,
                  };
                }
                return value;
              }),
            );
          }}
        >
          {item.done ? 'Completed' : 'Pending'}
        </button>
        <button
          type="button"
          className="todo-item-delete"
          onClick={(): void => {
            setList(list => list.filter(value => value.id !== item.id));
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

interface TodoListFormProps {
  index: number;
  setIndex: (update: number) => void;
  setList: (action: (list: TodoItem[]) => TodoItem[]) => void;
}

function TodoListForm({
  setList,
  index,
  setIndex,
}: TodoListFormProps): JSX.Element {
  const [message, setMessage] = useState('');

  return (
    <form
      className="todo-list-form"
      onSubmit={(e): void => {
        e.preventDefault();

        setList(list => [
          ...list,
          {
            done: false,
            message,
            id: index,
          },
        ]);
        setIndex(index + 1);
        setMessage('');
      }}
    >
      <input
        type="text"
        value={message}
        onInput={(e): void => {
          setMessage((e.target as HTMLInputElement).value);
        }}
      />
      <button type="submit" disabled={message === ''}>
        Add
      </button>
    </form>
  );
}

function TodoList(): JSX.Element {
  const [list, setList] = useState<TodoItem[]>([]);
  const [index, setIndex] = useState(0);
  return (
    <>
      <TodoListForm setList={setList} index={index} setIndex={setIndex} />
      <div className="todo-list">
        {list.map(item => (
          <TodoListItem key={item.id} item={item} setList={setList} />
        ))}
      </div>
    </>
  );
}

export default function App(): JSX.Element {
  return (
    <div className="app">
      <h1>Todo List</h1>
      <TodoList />
    </div>
  );
}
