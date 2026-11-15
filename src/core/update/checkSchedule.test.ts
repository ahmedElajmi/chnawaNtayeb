import { describe, expect, it } from 'vitest';
import { UPDATE_CHECK_BASE_DELAY_MS, UPDATE_CHECK_MAX_DELAY_MS, nextUpdateCheckDelayMs } from './index';

describe('nextUpdateCheckDelayMs', () => {
  it('stays at the base delay while updates keep being found', () => {
    expect(nextUpdateCheckDelayMs(0)).toBe(UPDATE_CHECK_BASE_DELAY_MS);
  });

  it('relaxes step by step when nothing is found: 15, 30, then the hourly ceiling', () => {
    expect(nextUpdateCheckDelayMs(1)).toBe(15 * 60 * 1000);
    expect(nextUpdateCheckDelayMs(2)).toBe(30 * 60 * 1000);
    expect(nextUpdateCheckDelayMs(3)).toBe(UPDATE_CHECK_MAX_DELAY_MS);
    expect(nextUpdateCheckDelayMs(10)).toBe(UPDATE_CHECK_MAX_DELAY_MS);
  });

  it('keeps the rhythm tight again as soon as a version is found', () => {
    expect(nextUpdateCheckDelayMs(3)).toBe(UPDATE_CHECK_MAX_DELAY_MS);
    expect(nextUpdateCheckDelayMs(0)).toBe(UPDATE_CHECK_BASE_DELAY_MS);
  });

  it('never goes below the base delay, whatever the count', () => {
    expect(nextUpdateCheckDelayMs(-5)).toBe(UPDATE_CHECK_BASE_DELAY_MS);
    expect(nextUpdateCheckDelayMs(0.9)).toBe(UPDATE_CHECK_BASE_DELAY_MS);
  });
});
