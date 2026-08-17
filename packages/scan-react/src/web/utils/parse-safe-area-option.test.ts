import { describe, expect, it } from 'vitest';
import { parseSafeAreaOption } from '~web/utils/parse-safe-area-option';

describe('parseSafeAreaOption', () => {
  it('accepts a non-negative finite number', () => {
    expect(parseSafeAreaOption(0)).toEqual({ ok: true, value: 0 });
    expect(parseSafeAreaOption(24)).toEqual({ ok: true, value: 24 });
    expect(parseSafeAreaOption(96)).toEqual({ ok: true, value: 96 });
  });

  it('rejects negative numbers', () => {
    const result = parseSafeAreaOption(-1);
    expect(result.ok).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    expect(parseSafeAreaOption(Number.NaN).ok).toBe(false);
    expect(parseSafeAreaOption(Number.POSITIVE_INFINITY).ok).toBe(false);
    expect(parseSafeAreaOption(Number.NEGATIVE_INFINITY).ok).toBe(false);
  });

  it('accepts a partial per-edge object', () => {
    expect(parseSafeAreaOption({ right: 96 })).toEqual({
      ok: true,
      value: { right: 96 },
    });
    expect(parseSafeAreaOption({ top: 0, bottom: 40 })).toEqual({
      ok: true,
      value: { top: 0, bottom: 40 },
    });
  });

  it('accepts a full per-edge object', () => {
    expect(
      parseSafeAreaOption({ top: 1, right: 2, bottom: 3, left: 4 }),
    ).toEqual({
      ok: true,
      value: { top: 1, right: 2, bottom: 3, left: 4 },
    });
  });

  it('rejects per-edge object with a negative value', () => {
    const result = parseSafeAreaOption({ right: -10 });
    expect(result.ok).toBe(false);
  });

  it('rejects per-edge object with a non-number value', () => {
    const result = parseSafeAreaOption({ top: '24' });
    expect(result.ok).toBe(false);
  });

  it('rejects arrays (not plain objects)', () => {
    const result = parseSafeAreaOption([10, 20, 30, 40]);
    expect(result.ok).toBe(false);
  });

  it('rejects null and undefined', () => {
    expect(parseSafeAreaOption(null).ok).toBe(false);
    expect(parseSafeAreaOption(undefined).ok).toBe(false);
  });

  it('rejects strings', () => {
    expect(parseSafeAreaOption('24').ok).toBe(false);
    expect(parseSafeAreaOption('').ok).toBe(false);
  });

  it('ignores undefined edges in a per-edge object', () => {
    expect(
      parseSafeAreaOption({ top: 5, right: undefined }),
    ).toEqual({ ok: true, value: { top: 5 } });
  });
});
