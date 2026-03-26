import { test, expect } from 'bun:test';

test('example test', () => {
  expect(1 + 1).toBe(2);
});

test('string length', () => {
  expect('hello').toHaveLength(5);
});

// Additional test to verify that async functionality works in bun test
test('async test example', async () => {
  const result = await Promise.resolve(42);
  expect(result).toBe(42);
});

// Test object equality
test('object properties', () => {
  const obj = { name: 'HoS Character', class: 'Fighter' };
  expect(obj).toEqual({ name: 'HoS Character', class: 'Fighter' });
  expect(obj.name).toBe('HoS Character');
});

// Testing array operations
test('array operations', () => {
  const numbers = [1, 2, 3, 4, 5];
  expect(numbers).toContain(3);
  expect(numbers).toHaveLength(5);
  expect(numbers.map(n => n * 2)).toEqual([2, 4, 6, 8, 10]);
});