'use client';

import { useState, useEffect } from "react";

export const TestDataTypes = () => {
  // Basic types
  const [text, setText] = useState("");
  const [num, setNum] = useState(0);
  const [bool, setBool] = useState(false);
  const [nullVal, setNullVal] = useState<string | null>(null);
  const [undefinedVal, setUndefinedVal] = useState<string | undefined>(undefined);

  // Object types
  const [map, setMap] = useState<Map<string, string>>(new Map());
  const [set, setSet] = useState<Set<string>>(new Set());
  const [array, setArray] = useState<Array<number>>([]);
  const [object, setObject] = useState({ a: 0, b: 0, c: { nested: false } });
  const [date, setDate] = useState<Date>(new Date(0));
  const [regex, setRegex] = useState(/test/g);
  const [error, setError] = useState(new Error(''));

  // Buffer types
  const [typedArray, setTypedArray] = useState(new Uint8Array());
  const [arrayBuffer, setArrayBuffer] = useState(new ArrayBuffer(0));
  const [dataView, setDataView] = useState(new DataView(new ArrayBuffer(0)));

  // Special types
  const [bigInt, setBigInt] = useState(BigInt(0));
  const [symbol, setSymbol] = useState(Symbol('initial'));
  const [promise, setPromise] = useState<Promise<string>>(Promise.resolve(''));
  const [weakMap, setWeakMap] = useState(new WeakMap());
  const [weakSet, setWeakSet] = useState(new WeakSet());

  // Keep track of objects we put in WeakMap/WeakSet
  const [weakMapRef, setWeakMapRef] = useState<{ obj: { id: number }, value: string } | null>(null);
  const [weakSetRef, setWeakSetRef] = useState<{ obj: { id: number } } | null>(null);

  // Track Promise state
  const [promiseState, setPromiseState] = useState<'pending' | 'resolved' | 'rejected'>('pending');

  // Update Promise state when it changes
  useEffect(() => {
    promise
      .then(() => setPromiseState('resolved'))
      .catch(() => setPromiseState('rejected'));
  }, [promise]);

  // Initialize all states on the client side only
  useEffect(() => {
    setText("Hello");
    setNum(42);
    setBool(true);
    setMap(new Map([['key1', 'value1'], ['key2', 'value2']]));
    setSet(new Set(['item1', 'item2']));
    setArray([1, 2, 3, 4, 5]);
    setObject({ a: 1, b: 2, c: { nested: true } });
    setDate(new Date());
    setRegex(/test/g);
    setError(new Error('Test error'));
    setTypedArray(new Uint8Array([1, 2, 3]));
    setArrayBuffer(new ArrayBuffer(8));
    setDataView(new DataView(new ArrayBuffer(8)));
    setBigInt(BigInt(9007199254740991));
    setSymbol(Symbol('test'));
    setPromise(Promise.resolve('test'));
  }, []);

  const randomizeValues = () => {
    // Basic types
    setText(Math.random().toString(36).substring(7));
    setNum(Math.floor(Math.random() * 1000));
    setBool(Math.random() > 0.5);
    setNullVal(Math.random() > 0.5 ? null : 'not null');
    setUndefinedVal(Math.random() > 0.5 ? undefined : 'defined');

    // Object types
    setMap(new Map([
      [`key${Math.random()}`, Math.random().toString()],
      [`key${Math.random()}`, Math.random().toString()]
    ]));
    setSet(new Set([
      Math.random().toString(),
      Math.random().toString()
    ]));
    setArray(Array.from({ length: 5 }, () => Math.floor(Math.random() * 100)));
    setObject({
      a: Math.random(),
      b: Math.random(),
      c: { nested: Math.random() > 0.5 }
    });
    setDate(new Date(Date.now() + Math.random() * 10000000));
    setRegex(new RegExp(`test${Math.floor(Math.random() * 100)}`, 'g'));
    setError(new Error(`Random error ${Math.random()}`));

    // Buffer types
    setTypedArray(new Uint8Array([
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255)
    ]));
    setArrayBuffer(new ArrayBuffer(Math.floor(Math.random() * 16)));
    setDataView(new DataView(new ArrayBuffer(8)));

    // Special types
    setBigInt(BigInt(Math.floor(Math.random() * 1000000)));
    setSymbol(Symbol(`test${Math.random()}`));
    setPromise(Promise.resolve(`test${Math.random()}`));

    // Reset Promise state when creating new Promise
    setPromiseState('pending');
    setPromise(Promise.resolve(`test${Math.random()}`));

    // Create new WeakMap with a random object
    setWeakMap(new WeakMap());
    setWeakMapRef({ obj: { id: Math.random() }, value: Math.random().toString() });

    // Create new WeakSet with a random object
    setWeakSet(new WeakSet());
    setWeakSetRef({ obj: { id: Math.random() } });
  };

  // Helper functions to check WeakMap/WeakSet contents
  const getWeakMapInfo = () => {
    if (!weakMapRef) return '[WeakMap: empty]';
    return weakMap.has(weakMapRef.obj)
      ? `[WeakMap: has entry {${weakMapRef.obj.id} => "${weakMapRef.value}"}]`
      : '[WeakMap: reference lost]';
  };

  const getWeakSetInfo = () => {
    if (!weakSetRef) return '[WeakSet: empty]';
    return weakSet.has(weakSetRef.obj)
      ? `[WeakSet: has object {id: ${weakSetRef.obj.id}}]`
      : '[WeakSet: reference lost]';
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Test Data Types</h1>
      <div
        onClick={randomizeValues}
        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Basic Types</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">text:</span> {text}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">num:</span> {num}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">bool:</span> {String(bool)}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">null:</span> {String(nullVal)}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">undefined:</span> {String(undefinedVal)}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Object Types</h2>
            <div className="space-y-2 text-sm">
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">map:</span> {JSON.stringify(Array.from(map.entries()))}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">set:</span> {JSON.stringify(Array.from(set))}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">array:</span> {JSON.stringify(array)}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">object:</span> {JSON.stringify(object)}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">date:</span> {date.toISOString()}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">regex:</span> {regex.toString()}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">error:</span> {error.message}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Buffer Types</h2>
            <div className="space-y-2 text-sm">
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">typedArray:</span> {Array.from(typedArray).join(',')}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">arrayBuffer:</span> (size: {arrayBuffer.byteLength})
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">dataView:</span> {' '}
                [{Array.from(new Uint8Array(dataView.buffer)).join(', ')}]
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Special Types</h2>
            <div className="space-y-2 text-sm">
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">bigInt:</span> {bigInt.toString()}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">symbol:</span> {symbol.toString()}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">promise:</span> [Promise {promiseState}]
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">weakMap:</span> {getWeakMapInfo()}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="font-medium">weakSet:</span> {getWeakSetInfo()}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          Click anywhere to randomize values
        </div>
      </div>
    </div>
  );
};
