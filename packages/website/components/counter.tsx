import { createContext, useContext, useState, ReactNode } from 'react';

interface CounterContextType {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const CounterContext = createContext<CounterContextType | undefined>(undefined);

export const CounterProvider = ({ children }: { children: ReactNode }) => {
  const [count, setCount] = useState(0);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(0);

  const value = {
    count,
    increment,
    decrement,
    reset,
  };

  return (
    <CounterContext.Provider value={value}>
      {children}
    </CounterContext.Provider>
  );
}

const useCounter = () => {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error('useCounter must be used within a CounterProvider');
  }
  return context;
}

const CounterDisplay = () => {
  const { count } = useCounter();
  return <h2 className="text-2xl font-bold">Counter: {count}</h2>;
}

const CounterButton = ({
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseClasses = "px-4 py-2 text-white rounded hover:opacity-90";
  const variantClasses = variant === 'primary'
    ? 'bg-blue-500 hover:bg-blue-600'
    : 'bg-gray-500 hover:bg-gray-600';

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    />
  );
}

const IncrementButton = () => {
  const { increment } = useCounter();
  return <CounterButton onClick={increment}>+</CounterButton>;
}

const DecrementButton = () => {
  const { decrement } = useCounter();
  return <CounterButton onClick={decrement}>-</CounterButton>;
}

const ResetButton = () => {
  const { reset } = useCounter();
  return <CounterButton onClick={reset} variant="secondary">Reset</CounterButton>;
}

const CounterControls = () => {
  return (
    <div className="flex gap-2">
      <DecrementButton />
      <IncrementButton />
      <ResetButton />
    </div>
  );
}

export const Counter = () => {
  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-sm">
      <CounterDisplay />
      <CounterControls />
    </div>
  );
}

export const CounterExample = () => {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  );
}
