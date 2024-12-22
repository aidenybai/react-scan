import { describe, it, expect } from 'vitest';
import { fastSerialize } from 'src/core/instrumentation';

describe('fastSerialize', () => {
  it('serializes null', () => {
    expect(fastSerialize(null)).toBe('null');
  });

  it('serializes undefined', () => {
    expect(fastSerialize(undefined)).toBe('undefined');
  });

  it('serializes strings', () => {
    expect(fastSerialize('hello')).toBe('hello');
    expect(fastSerialize('')).toBe('');
  });

  it('serializes numbers', () => {
    expect(fastSerialize(42)).toBe('42');
    expect(fastSerialize(0)).toBe('0');
    expect(fastSerialize(NaN)).toBe('NaN');
  });

  it('serializes booleans', () => {
    expect(fastSerialize(true)).toBe('true');
    expect(fastSerialize(false)).toBe('false');
  });

  it('serializes functions', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const testFunc = (x:2) => 3
    expect(fastSerialize(testFunc)).toBe('(x) => 3');
  });

  it('serializes arrays', () => {
    expect(fastSerialize([])).toBe('[]');
    expect(fastSerialize([1, 2, 3])).toBe('[3]');
  });

  it('serializes plain objects', () => {
    expect(fastSerialize({})).toBe('{}');
    expect(fastSerialize({ a: 1, b: 2 })).toBe('{2}');
  });

  it('serializes deeply nested objects with depth limit', () => {
    const nested = { a: { b: { c: 1 } } };
    expect(fastSerialize(nested, 0)).toBe('{1}');
    expect(fastSerialize(nested, -1)).toBe('…');
  });

  it('serializes objects with custom constructors', () => {
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    class CustomClass {}
    const instance = new CustomClass();
    expect(fastSerialize(instance)).toBe('CustomClass{…}');
  });

  it('serializes unknown objects gracefully', () => {
    const date = new Date();
    const serialized = fastSerialize(date);
    expect(serialized.includes('Date')).toBe(true);
  });
});
