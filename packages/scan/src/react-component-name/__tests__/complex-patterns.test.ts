import { describe, it, expect } from 'vitest';
import { transform } from './utils';

describe('complex component patterns', () => {
  it('handles components with hooks', async () => {
    const input = `
      const TodoList = () => {
        const [todos, setTodos] = useState([])
        useEffect(() => {
          fetchTodos().then(setTodos)
        }, [])
        return <ul>{todos.map(todo => <li key={todo.id}>{todo.text}</li>)}</ul>
      }
    `;
    const result = await transform(input);
    expect(result).toContain("TodoList.displayName = 'TodoList'");
  });

  it('handles components with multiple state updates', async () => {
    const input = `
      const Counter = () => {
        const [count, setCount] = useState(0)
        const increment = () => setCount(c => c + 1)
        const decrement = () => setCount(c => c - 1)
        return (
          <div>
            <button onClick={decrement}>-</button>
            <span>{count}</span>
            <button onClick={increment}>+</button>
          </div>
        )
      }
    `;
    const result = await transform(input);
    expect(result).toContain("Counter.displayName = 'Counter'");
  });

  it('handles components with render props', async () => {
    const input = `
      const DataFetcher = ({ children, url }) => {
        const [data, setData] = useState(null)
        useEffect(() => {
          fetch(url).then(setData)
        }, [url])
        return <>{children(data)}</>
      }
    `;
    const result = await transform(input);
    expect(result).toContain("DataFetcher.displayName = 'DataFetcher'");
  });

  it('handles higher-order components', async () => {
    const input = `
      const withData = (WrappedComponent) => {
        const WithData = (props) => {
          const [data, setData] = useState(null)
          return <WrappedComponent data={data} {...props} />
        }
        return WithData
      }
    `;
    const result = await transform(input);
    expect(result).toContain("WithData.displayName = 'WithData'");
  });
});
