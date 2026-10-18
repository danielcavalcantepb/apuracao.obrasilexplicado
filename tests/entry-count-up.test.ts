import { describe, expect, it } from 'vitest';
import {
  parseDisplayedNumber,
  countUpValue,
} from '../src/features/election/first-access/entry-count-up';
describe('presentation-only entry counting', () => {
  it('parses Brazilian percentages, vote counts and signs without confusing missing data with zero', () => {
    expect(parseDisplayedNumber('47,03%')).toEqual({
      value: 47.03,
      decimals: 2,
      prefix: '',
      suffix: '%',
    });
    expect(parseDisplayedNumber('56.104.503')).toEqual({
      value: 56104503,
      decimals: 0,
      prefix: '',
      suffix: '',
    });
    expect(parseDisplayedNumber('+4,50')).toEqual({
      value: 4.5,
      decimals: 2,
      prefix: '+',
      suffix: '',
    });
    expect(parseDisplayedNumber('100,00% totalizado')?.suffix).toBe('% totalizado');
    expect(parseDisplayedNumber('—%')).toBeNull();
    expect(parseDisplayedNumber('0,00%')?.value).toBe(0);
  });
  it('counts monotonically and reaches the exact official value at the end', () => {
    const values = [0, 0.1, 0.3, 0.5, 0.8, 1, 2].map((progress) => countUpValue(47.03, progress));
    expect(values[0]).toBe(0);
    expect(values.at(-1)).toBe(47.03);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });
});
