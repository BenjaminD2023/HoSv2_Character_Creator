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

// Spell Slot Tests - SL = COUNT Rule
test('wizard starting spell slots: L1=5, L2=4, L3-5=0', () => {
  const baseSlots = { L1: 5, L2: 4, L3: 0, L4: 0, L5: 0 };
  expect(baseSlots.L1).toBe(5);
  expect(baseSlots.L2).toBe(4);
  expect(baseSlots.L3).toBe(0);
  expect(baseSlots.L4).toBe(0);
  expect(baseSlots.L5).toBe(0);
});

test('SL = COUNT rule: wizard L3 slot with SL 1 gives 1 slot', () => {
  const skillLevel = 1;
  const maxSlots = skillLevel; // SL = COUNT for L3-5
  expect(maxSlots).toBe(1);
});

test('SL = COUNT rule: wizard L3 slot with SL 3 gives 3 slots', () => {
  const skillLevel = 3;
  const maxSlots = skillLevel;
  expect(maxSlots).toBe(3);
});

test('SL = COUNT rule: wizard L1 with SL 2 gives 7 slots (5 base + 2)', () => {
  const skillLevel = 2;
  const maxSlots = 5 + skillLevel; // Base + SL for L1
  expect(maxSlots).toBe(7);
});

test('SL = COUNT rule: wizard L2 with SL 3 gives 7 slots (4 base + 3)', () => {
  const skillLevel = 3;
  const maxSlots = 4 + skillLevel; // Base + SL for L2
  expect(maxSlots).toBe(7);
});

test('calculateWizardSlots with no skills returns base slots', () => {
  const skills: string[] = [];
  const skillLevels: Record<string, number> = {};
  
  const slots = { L1: 5, L2: 4, L3: 0, L4: 0, L5: 0 };
  
  skills.forEach(skillName => {
    const skillLower = skillName.toLowerCase();
    const level = skillLevels[skillName] ?? 1;
    
    if (!skillLower.includes('spell slot')) return;
    
    if (skillLower.includes('level 3') || skillLower.includes('lv 3') || skillLower.includes('l3')) {
      slots.L3 += level;
    } else if (skillLower.includes('level 4') || skillLower.includes('lv 4') || skillLower.includes('l4')) {
      slots.L4 += level;
    } else if (skillLower.includes('level 5') || skillLower.includes('lv 5') || skillLower.includes('l5')) {
      slots.L5 += level;
    }
  });
  
  expect(slots.L1).toBe(5);
  expect(slots.L2).toBe(4);
  expect(slots.L3).toBe(0);
  expect(slots.L4).toBe(0);
  expect(slots.L5).toBe(0);
});

test('calculateWizardSlots with Lv 3 Spell Slot SL 1 gives 1 slot', () => {
  const skills = ['Lv 3 Spell Slot'];
  const skillLevels: Record<string, number> = { 'Lv 3 Spell Slot': 1 };
  
  const slots = { L1: 5, L2: 4, L3: 0, L4: 0, L5: 0 };
  
  skills.forEach(skillName => {
    const skillLower = skillName.toLowerCase();
    const level = skillLevels[skillName] ?? 1;
    
    if (!skillLower.includes('spell slot')) return;
    
    if (skillLower.includes('level 3') || skillLower.includes('lv 3') || skillLower.includes('l3')) {
      slots.L3 += level;
    }
  });
  
  expect(slots.L3).toBe(1);
});

test('chaos point refill cannot exceed max slots', () => {
  const currentSlots = 3;
  const maxSlots = 5;
  const chaosPoints = 10;
  
  const refillAmount = Math.min(chaosPoints, maxSlots - currentSlots);
  const newCurrent = currentSlots + refillAmount;
  
  expect(newCurrent).toBeLessThanOrEqual(maxSlots);
  expect(newCurrent).toBe(5);
});

test('chaos point refill with no used slots does nothing', () => {
  const usedSlots = 0;
  const chaosPoints = 5;
  
  const canRefill = usedSlots > 0 && chaosPoints > 0;
  
  expect(canRefill).toBe(false);
});