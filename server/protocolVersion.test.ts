import { describe, expect, it } from 'vitest';
import {
  PROTOCOL_VERSION_HEADER,
  classifyProtocolVersion,
  compareProtocolVersions,
  parseProtocolVersion,
} from './protocolVersion';

const NAME = PROTOCOL_VERSION_HEADER.toLowerCase();

/** Builds `rawHeaders` in the Node shape (flat name/value pairs). */
const rawWith = (...values: string[]): string[] => values.flatMap((value) => [NAME, value]);

describe('the protocol version parsing (B22-07)', () => {
  it('accepts the supported shapes and normalizes leading zeros deterministically', () => {
    expect(parseProtocolVersion('1')).toEqual([1]);
    expect(parseProtocolVersion('1.2')).toEqual([1, 2]);
    expect(parseProtocolVersion('01.0')).toEqual([1, 0]);
    expect(parseProtocolVersion('0.0.0')).toEqual([0, 0, 0]);
  });

  it('refuses malformed shapes, over-bounds and empty values', () => {
    expect(parseProtocolVersion('')).toBeNull();
    expect(parseProtocolVersion('v1')).toBeNull();
    expect(parseProtocolVersion('1.x')).toBeNull();
    expect(parseProtocolVersion('1..2')).toBeNull();
    expect(parseProtocolVersion('1.2.3.4')).toBeNull(); // 4 components
    expect(parseProtocolVersion('1.9999999')).toBeNull(); // 7 digits in one component
    expect(parseProtocolVersion('1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1.2')).toBeNull();
    expect(parseProtocolVersion('1 '.repeat(17))).toBeNull(); // over 32 characters
  });

  it('compares numerically, component-wise, never lexically', () => {
    expect(compareProtocolVersions([1, 10], [1, 9])).toBeGreaterThan(0); // 1.10 > 1.9
    expect(compareProtocolVersions([1, 2], [1, 2, 0])).toBe(0); // missing components = 0
    expect(compareProtocolVersions([2], [1, 9, 9])).toBeGreaterThan(0);
    expect(compareProtocolVersions([1], [2])).toBeLessThan(0);
  });
});

describe('the protocol version classification (B22-07)', () => {
  it('accepts the supported version and every numerically equivalent representation', () => {
    expect(classifyProtocolVersion('1', [])).toEqual({ status: 'supported' });
    expect(classifyProtocolVersion('1.0', [])).toEqual({ status: 'supported' });
    expect(classifyProtocolVersion('1.0.0', [])).toEqual({ status: 'supported' });
    expect(classifyProtocolVersion('01', [])).toEqual({ status: 'supported' });
  });

  it('never grants implicit compatibility to a different version, even an older one', () => {
    expect(classifyProtocolVersion('0.9', [])).toEqual({ status: 'older-unsupported' });
    expect(classifyProtocolVersion('0.9.5', [])).toEqual({ status: 'older-unsupported' });
    // 1.1 and 1.10 are numerically LATER than 1 (component-wise): refused too
    expect(classifyProtocolVersion('1.1', [])).toEqual({ status: 'later-unsupported' });
    expect(classifyProtocolVersion('1.10', [])).toEqual({ status: 'later-unsupported' });
    expect(classifyProtocolVersion('2', [])).toEqual({ status: 'later-unsupported' });
  });

  it('treats an absent declaration as absent, not invalid', () => {
    expect(classifyProtocolVersion(undefined, [])).toEqual({ status: 'absent' });
  });

  it('refuses malformed declarations, including over-bounds', () => {
    expect(classifyProtocolVersion('v1', [])).toEqual({ status: 'invalid' });
    expect(classifyProtocolVersion('1..2', [])).toEqual({ status: 'invalid' });
    expect(classifyProtocolVersion('1.2.3.4', [])).toEqual({ status: 'invalid' });
    expect(classifyProtocolVersion('1.9999999', [])).toEqual({ status: 'invalid' });
    expect(classifyProtocolVersion('a'.repeat(33), [])).toEqual({ status: 'invalid' });
  });

  it('refuses duplicated or comma-joined declarations instead of picking the first value', () => {
    expect(classifyProtocolVersion('1,1.2', rawWith('1,1.2'))).toEqual({ status: 'invalid' });
    expect(classifyProtocolVersion('1', rawWith('1', '1.2'))).toEqual({ status: 'invalid' });
    expect(classifyProtocolVersion('1', rawWith('1'))).toEqual({ status: 'supported' });
  });
});
