import { parseId, InvalidIdError } from '../utils/parse-id.util';

describe('parseId', () => {
  it('should return a valid positive integer', () => {
    expect(parseId('1')).toBe(1);
    expect(parseId('42')).toBe(42);
    expect(parseId('999')).toBe(999);
  });

  it('should handle string arrays (taking first element)', () => {
    expect(parseId(['5', '10'])).toBe(5);
  });

  it('should throw InvalidIdError for NaN values', () => {
    expect(() => parseId('abc')).toThrow(InvalidIdError);
    expect(() => parseId('')).toThrow(InvalidIdError);
    expect(() => parseId('not-a-number')).toThrow(InvalidIdError);
  });

  it('should throw InvalidIdError for zero', () => {
    expect(() => parseId('0')).toThrow(InvalidIdError);
  });

  it('should throw InvalidIdError for negative numbers', () => {
    expect(() => parseId('-1')).toThrow(InvalidIdError);
    expect(() => parseId('-100')).toThrow(InvalidIdError);
  });

  it('should parse integers from float strings (parseInt behavior)', () => {
    expect(parseId('3.7')).toBe(3);
  });

  it('should have correct error properties', () => {
    try {
      parseId('invalid');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidIdError);
      expect((err as InvalidIdError).statusCode).toBe(400);
      expect((err as InvalidIdError).code).toBe('INVALID_ID');
      expect((err as InvalidIdError).message).toBe('Invalid ID parameter');
    }
  });
});
