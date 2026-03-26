import { test, expect } from 'bun:test';

test('example test', () => {
  expect(1 + 1).toBe(2);
});

test('string length', () => {
  expect('hello').toHaveLength(5);
});