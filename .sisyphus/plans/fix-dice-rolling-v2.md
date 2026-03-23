# Fix Dice Rolling - Proper Implementation

## TL;DR

> Fix the root cause of dice rolling issues:
> 1. `Promise.all([rollDice(), rollDice()])` doesn't work because `rollDice` has `isRolling` guard
> 2. Must use `rollDiceBatch()` which properly rolls dice simultaneously using `add()` method
>
> **Deliverables**: Updated `sheet/page.tsx` to use `rollDiceBatch` for advantage/disadvantage rolls
> **Estimated Effort**: Quick (1 task)
> **Parallel Execution**: NO

---

## Context

### Root Cause Analysis

The previous fix attempted to use `Promise.all([rollDice(), rollDice()])` for simultaneous rolling, but this **doesn't work** because:

1. **`rollDice` has an `isRolling` guard** (DiceContext.tsx:182):
   ```typescript
   if (!diceBoxRef.current || isRolling) return [];
   ```
   When the first `rollDice` call sets `isRolling = true`, the second call immediately returns an empty array.

2. **`rollDiceBatch` is the proper solution** (DiceContext.tsx:211-259):
   - Uses `diceBoxRef.current.add()` for subsequent dice
   - Properly rolls all dice simultaneously in one batch
   - Already implemented in DiceContext but not being used

### Current Broken Implementation

**rollCheckWithMode()** (sheet/page.tsx:521-526):
```typescript
// This doesn't work - second rollDice returns [] because isRolling is true
const [results1, results2] = await Promise.all([
  rollDice("1d20", { ... }),  // Sets isRolling = true
  rollDice("1d20", { ... })   // Returns [] because isRolling is true
]);
```

**rollCustomDice()** (sheet/page.tsx:456-459):
```typescript
// Same problem - second call blocked by isRolling guard
const [results1, results2] = await Promise.all([
  rollDice(diceNotation, { ... }),
  rollDice(diceNotation, { ... })
]);
```

### Solution

Use `rollDiceBatch()` which:
1. Calls `diceBoxRef.current.roll()` for first die
2. Calls `diceBoxRef.current.add()` for subsequent dice (adds to same roll)
3. All dice roll simultaneously

---

## Work Objectives

### Core Objective
Fix advantage/disadvantage rolls to actually roll simultaneously by using `rollDiceBatch` instead of `Promise.all([rollDice(), rollDice()])`.

### Concrete Deliverables
- Extract `rollDiceBatch` from `useDice()` hook
- Update `rollCheckWithMode()` to use `rollDiceBatch`
- Update `rollCustomDice()` to use `rollDiceBatch`

### Definition of Done
- [ ] Both dice in advantage/disadvantage roll simultaneously (visually)
- [ ] Popup shows correct values for both rolls
- [ ] Normal rolls continue to work
- [ ] TypeScript compilation passes

---

## Execution Strategy

### Wave 1 - Fix Implementation
- Task 1: Extract rollDiceBatch and update both functions

---

## TODOs

- [x] 1. Fix advantage/disadvantage rolling with rollDiceBatch

  **What to do**:
  
  **Step 1**: Extract `rollDiceBatch` from useDice hook (line 119):
  ```typescript
  // Change from:
  const { rollDice, isReady } = useDice();
  
  // To:
  const { rollDice, rollDiceBatch, isReady } = useDice();
  ```
  
  **Step 2**: Update `rollCheckWithMode()` (lines 521-526):
  ```typescript
  // Replace:
  const [results1, results2] = await Promise.all([
    rollDice("1d20", { theme: "smooth", themeColor: color }),
    rollDice("1d20", { theme: "smooth", themeColor: color })
  ]);
  
  // With:
  const batchResults = await rollDiceBatch([
    { notation: "1d20", options: { theme: "smooth", themeColor: color } },
    { notation: "1d20", options: { theme: "smooth", themeColor: color } }
  ]);
  const results1 = batchResults[0] || [{ value: 0 }];
  const results2 = batchResults[1] || [{ value: 0 }];
  ```
  
  **Step 3**: Update `rollCustomDice()` (lines 456-459):
  ```typescript
  // Replace:
  const [results1, results2] = await Promise.all([
    rollDice(diceNotation, { theme: "smooth", themeColor: group1Color }),
    rollDice(diceNotation, { theme: "smooth", themeColor: group2Color })
  ]);
  
  // With:
  const batchResults = await rollDiceBatch([
    { notation: diceNotation, options: { theme: "smooth", themeColor: group1Color } },
    { notation: diceNotation, options: { theme: "smooth", themeColor: group2Color } }
  ]);
  const results1 = batchResults[0] || [];
  const results2 = batchResults[1] || [];
  ```
  
  **Why this works**:
  - `rollDiceBatch` calls `diceBoxRef.current.add()` for the second die
  - This adds it to the same roll group, so both dice roll simultaneously
  - No `isRolling` conflict because it's a single batch operation
  
  **Must NOT do**:
  - Don't change the result calculation logic
  - Don't change the popup or any other components
  - Don't modify DiceContext

  **Acceptance Criteria**:
  - [ ] `rollDiceBatch` extracted from useDice hook
  - [ ] `rollCheckWithMode()` uses `rollDiceBatch`
  - [ ] `rollCustomDice()` uses `rollDiceBatch`
  - [ ] TypeScript compiles without errors
  - [ ] Dice roll simultaneously for advantage/disadvantage
  - [ ] Popup shows correct values

  **Commit**: YES
  - Message: `fix(dice): use rollDiceBatch for simultaneous advantage/disadvantage rolls`
  - Files: `src/app/sheet/page.tsx`

---

## Success Criteria

### Verification
1. Build passes: `npm run build`
2. TypeScript: `npx tsc --noEmit`
3. Manual test: Advantage rolls show both dice rolling at once
4. Manual test: Popup shows correct values for both rolls

### Final Checklist
- [x] Advantage rolls use rollDiceBatch
- [x] Disadvantage rolls use rollDiceBatch
- [x] Custom advantage rolls work
- [x] Custom disadvantage rolls work
- [x] All existing rolls work
- [x] TypeScript compilation passes
