import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Robinhood S&P500 One Year')).toBe('robinhood-sp500-one-year');
  });

  it('strips characters outside a-z0-9 and hyphen', () => {
    expect(slugify('hello, world!!')).toBe('hello-world');
  });

  it('collapses repeated hyphens and trims leading/trailing ones', () => {
    expect(slugify('  -- multiple   spaces -- ')).toBe('multiple-spaces');
  });

  it('drops non-latin characters entirely (Korean input is not transliterated)', () => {
    expect(slugify('로빈후드 hood')).toBe('hood');
  });
});
