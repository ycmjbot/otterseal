import { describe, expect, it } from 'vitest';
import { parseDuration } from './utils.js';

describe('utils.ts', () => {
  describe('parseDuration', () => {
    it('should parse seconds', () => {
      expect(parseDuration('1s')).toBe(1000);
      expect(parseDuration('30s')).toBe(30000);
      expect(parseDuration('60s')).toBe(60000);
    });

    it('should parse minutes', () => {
      expect(parseDuration('1m')).toBe(60000);
      expect(parseDuration('5m')).toBe(300000);
      expect(parseDuration('60m')).toBe(3600000);
    });

    it('should parse hours', () => {
      expect(parseDuration('1h')).toBe(3600000);
      expect(parseDuration('2h')).toBe(7200000);
      expect(parseDuration('24h')).toBe(86400000);
    });

    it('should parse days', () => {
      expect(parseDuration('1d')).toBe(86400000);
      expect(parseDuration('7d')).toBe(604800000);
      expect(parseDuration('30d')).toBe(2592000000);
    });

    it('should throw on invalid format', () => {
      expect(() => parseDuration('invalid')).toThrow('Invalid duration');
      expect(() => parseDuration('1')).toThrow('Invalid duration');
      expect(() => parseDuration('s')).toThrow('Invalid duration');
      expect(() => parseDuration('1x')).toThrow('Invalid duration');
      expect(() => parseDuration('')).toThrow('Invalid duration');
    });

    it('should throw on invalid unit', () => {
      expect(() => parseDuration('1w')).toThrow('Invalid duration');
      expect(() => parseDuration('1y')).toThrow('Invalid duration');
    });

    it('should handle large numbers', () => {
      expect(parseDuration('9999s')).toBe(9999000);
      expect(parseDuration('1000d')).toBe(86400000000);
    });

    it('should handle zero', () => {
      expect(parseDuration('0s')).toBe(0);
      expect(parseDuration('0m')).toBe(0);
    });
  });
});
