# Fix Dice Rolling Issues

## TL;DR

> Fix two critical dice rolling issues:
> 1. Custom rolls with advantage/disadvantage don't show the result popup
> 2. Advantage/disadvantage rolls happen sequentially (one by one) instead of simultaneously
>
> **Deliverables**: Fixed `sheet/page.tsx` with simultaneous rolling and working popup for all roll types
> **Estimated Effort**: Short (2-3 tasks)
> **Parallel Execution**: NO - Single file changes, sequential verification

---

## Context

### Current Implementation
The dice rolling system uses `@3d-dice/dice-box` for 3D dice visualization with:
- **DiceContext.tsx**: Provides `rollDice()` and `rollDiceBatch()` functions
- **DiceCanvas.tsx**: Renders the 3D dice overlay
- **RollResultPopup.tsx**: Displays roll results in a popup with advantage/disadvantage support
- **sheet/page.tsx**: Contains rolling logic in `rollCheck()`, `rollCheckWithMode()`, and `rollCustomDice()`

### Issues Identified

**Issue 1: Sequential Rolling (Confirmed)**
In `rollCheckWithMode()` (lines 521-539), advantage/disadvantage rolls happen sequentially:
```typescript
const results1 = await rollDice("1d20", { ... });  // Wait for first roll
const results2 = await rollDice("1d20", { ... });  // Then second roll
```
This causes dice to roll one at a time instead of simultaneously.

**Issue 2: Missing Popup for Custom Advantage/Disadvantage**
In `rollCustomDice()` (lines 443-508), the popup should show but user reports it doesn't. The code calls `setRollResult()` correctly, but there may be a state timing issue or the logic may not be reaching that branch properly.

### Root Causes
1. `rollCheckWithMode()` uses sequential `await` instead of `Promise.all()` for parallel execution
2. `rollCustomDice()` may have a logic path that doesn't properly set roll result state

---

## Work Objectives

### Core Objective
Fix both dice rolling issues so that:
- All advantage/disadvantage rolls (custom and stat checks) happen simultaneously (2 dice at once)
- Result popups appear consistently for all roll types including custom advantage/disadvantage rolls

### Concrete Deliverables
- Fixed `rollCheckWithMode()` function with parallel rolling via `Promise.all()`
- Fixed `rollCustomDice()` function to ensure popup shows for advantage/disadvantage rolls
- Verified working popups for all roll scenarios

### Definition of Done
- [x] Advantage/disadvantage rolls visually show both dice rolling at the same time
- [x] Custom rolls with advantage/disadvantage show the result popup with both roll values
- [x] Stat check rolls with advantage/disadvantage show the result popup
- [x] All existing normal rolls continue to work correctly

### Must Have
- Parallel execution of advantage/disadvantage rolls
- Working popups for all roll types
- No regression in existing functionality

### Must NOT Have (Guardrails)
- Changes to roll probability or mechanics
- Changes to popup UI design
- Breaking changes to the dice context API

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (e2e tests with Playwright)
- **Automated tests**: Tests-after (manual verification via UI)
- **Agent-Executed QA**: MANDATORY - Playwright browser automation

### QA Policy
Every fix MUST be verified via browser automation:
- Navigate to character sheet
- Trigger each roll type
- Verify popup appears with correct data
- Screenshot evidence for each scenario

---

## Execution Strategy

### Wave 1 - Implementation (Sequential)
```
Wave 1:
├── Task 1: Fix sequential rolling in rollCheckWithMode()
└── Task 2: Verify and fix popup for custom advantage/disadvantage
```

### Dependency Matrix
- **Task 1**: None → Unblocks Task 2
- **Task 2**: Depends on Task 1

### Agent Dispatch Summary
- **Task 1**: `quick` - Simple code change, parallelization fix
- **Task 2**: `quick` - Logic verification and fix

---

## TODOs

- [x] 1. Fix sequential rolling in rollCheckWithMode()

  **What to do**:
  - Modify `rollCheckWithMode()` in `src/app/sheet/page.tsx` (lines 521-539)
  - Change sequential `await rollDice()` calls to parallel execution using `Promise.all()`
  - Both dice should use the same color (the stat color, not cyan/purple)
  - Keep the same result calculation logic (max for advantage, min for disadvantage)

  **Current code (lines 521-535)**:
  ```typescript
  if (mode === "advantage" || mode === "disadvantage") {
    // Roll twice - use stat color for both (not cyan/purple)
    const results1 = await rollDice("1d20", { theme: "smooth", themeColor: color });
    const results2 = await rollDice("1d20", { theme: "smooth", themeColor: color });
    // ... rest of logic
  }
  ```

  **Expected change**:
  ```typescript
  if (mode === "advantage" || mode === "disadvantage") {
    // Roll both dice simultaneously
    const [results1, results2] = await Promise.all([
      rollDice("1d20", { theme: "smooth", themeColor: color }),
      rollDice("1d20", { theme: "smooth", themeColor: color })
    ]);
    // ... rest of logic stays the same
  }
  ```

  **Must NOT do**:
  - Don't change the color scheme (keep stat color for both dice)
  - Don't change the result calculation (max/min logic)
  - Don't modify any other functions

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: Simple refactoring from sequential to parallel execution
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1, Task 1
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:
  - `src/app/sheet/page.tsx:521-539` - Function to modify
  - `src/contexts/DiceContext.tsx:180-209` - rollDice function signature
  - `src/app/sheet/page.tsx:456-459` - Example of parallel rolling in rollCustomDice()

  **Acceptance Criteria**:
  - [ ] Code uses `Promise.all()` for parallel dice rolling
  - [ ] Both rolls use the same stat color
  - [ ] Result calculation unchanged (correct advantage/disadvantage logic)
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:
  ```
  Scenario: Stat check with advantage shows both dice rolling simultaneously
    Tool: Playwright
    Preconditions: Character sheet page loaded, character exists
    Steps:
      1. Right-click on STR stat card
      2. Click "Advantage" from context menu
      3. Wait for dice animation to complete
    Expected Result: Both d20 dice roll at the same time (not one after another)
    Evidence: .sisyphus/evidence/task-1-advantage-roll.png

  Scenario: Stat check with disadvantage shows both dice rolling simultaneously
    Tool: Playwright
    Preconditions: Character sheet page loaded, character exists
    Steps:
      1. Right-click on INT stat card
      2. Click "Disadvantage" from context menu
      3. Wait for dice animation to complete
    Expected Result: Both d20 dice roll simultaneously
    Evidence: .sisyphus/evidence/task-1-disadvantage-roll.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of advantage roll with both dice visible
  - [ ] Screenshot of disadvantage roll with both dice visible

  **Commit**: YES
  - Message: `fix(dice): roll advantage/disadvantage dice simultaneously`
  - Files: `src/app/sheet/page.tsx`

- [x] 2. Fix popup not showing for custom advantage/disadvantage rolls

  **What to do**:
  - Debug and fix `rollCustomDice()` in `src/app/sheet/page.tsx` (lines 443-508)
  - Ensure `setRollResult()` is called for ALL roll modes (normal, advantage, disadvantage)
  - The current code SHOULD work, but verify the logic flow reaches the `setRollResult()` call
  - Check if there's an early return or error preventing the popup

  **Current code structure (lines 443-508)**:
  ```typescript
  const rollCustomDice = async () => {
    if (!isReady) return;
    setShowDice(true);
    setCustomDiceOpen(false);
    const diceNotation = `${diceCount}d${diceType}`;
    if (rollMode === "advantage" || rollMode === "disadvantage") {
      // ... rolls both groups ...
      // ... calculates totals ...
      setRollResult({ ... });  // This SHOULD be called
    } else {
      // ... normal roll ...
      setRollResult({ ... });  // This works
    }
  };
  ```

  **Verification steps**:
  1. Check that `setRollResult()` is called in ALL branches
  2. Verify the rollResult state structure matches RollResultPopup expectations
  3. Ensure `mode`, `roll1`, `roll2`, `kept` fields are set for advantage/disadvantage
  4. Test that the popup actually appears

  **Must NOT do**:
  - Don't change the popup component UI
  - Don't change the dice notation format
  - Don't modify roll calculation logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: Logic verification and potential bug fix
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1, Task 2
  - **Blocks**: None
  - **Blocked By**: Task 1 (can test together)

  **References**:
  - `src/app/sheet/page.tsx:443-508` - Function to verify/fix
  - `src/components/RollResultPopup.tsx:30-44` - RollResult interface
  - `src/app/sheet/page.tsx:473-486` - setRollResult call for advantage/disadvantage

  **Acceptance Criteria**:
  - [ ] Custom roll with advantage shows popup with both roll values
  - [ ] Custom roll with disadvantage shows popup with both roll values
  - [ ] Custom roll normal mode still works
  - [ ] Popup displays correct "kept" indicator

  **QA Scenarios**:
  ```
  Scenario: Custom roll with advantage shows popup
    Tool: Playwright
    Preconditions: Character sheet page loaded
    Steps:
      1. Click dice button to open custom roller
      2. Set dice count: 1, type: d20, mode: Advantage
      3. Click "Roll 1d20 (advantage)" button
      4. Wait for dice animation
    Expected Result: Popup appears showing both rolls with "Roll 1" and "Roll 2" boxes
    Evidence: .sisyphus/evidence/task-2-custom-advantage.png

  Scenario: Custom roll with disadvantage shows popup
    Tool: Playwright
    Preconditions: Character sheet page loaded
    Steps:
      1. Click dice button to open custom roller
      2. Set dice count: 1, type: d20, mode: Disadvantage
      3. Click "Roll 1d20 (disadvantage)" button
      4. Wait for dice animation
    Expected Result: Popup appears with both rolls, lower one marked as kept
    Evidence: .sisyphus/evidence/task-2-custom-disadvantage.png

  Scenario: Custom normal roll shows popup (regression check)
    Tool: Playwright
    Preconditions: Character sheet page loaded
    Steps:
      1. Click dice button
      2. Set mode: Normal, roll
      3. Click roll button
    Expected Result: Popup appears with single roll result
    Evidence: .sisyphus/evidence/task-2-custom-normal.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of custom advantage popup
  - [ ] Screenshot of custom disadvantage popup
  - [ ] Screenshot of custom normal popup (regression)

  **Commit**: YES (squash with Task 1)
  - Message: `fix(dice): ensure popup shows for all custom roll modes`
  - Files: `src/app/sheet/page.tsx`

---

## Final Verification Wave

- [x] F1. **Comprehensive Dice Rolling Test** - `unspecified-high` (+ `playwright` skill)
  Test ALL roll scenarios to ensure no regressions:
  1. Normal stat check (click STR card)
  2. Stat check with advantage (right-click STR → Advantage)
  3. Stat check with disadvantage (right-click INT → Disadvantage)
  4. Initiative roll
  5. Charisma roll
  6. Weapon damage roll
  7. Custom roll normal
  8. Custom roll advantage
  9. Custom roll disadvantage
  10. Custom roll with multiple dice (2d6 advantage)
  
  For each: verify popup appears, dice roll simultaneously (where applicable), correct values shown.
  
  Output: `Scenarios [10/10 pass] | VERDICT: PASS/FAIL`

---

## Commit Strategy

- **1**: `fix(dice): roll advantage/disadvantage dice simultaneously` - `src/app/sheet/page.tsx`
- **2**: Squash with Task 1 - `fix(dice): ensure popup shows for all custom roll modes` - `src/app/sheet/page.tsx`

---

## Success Criteria

### Verification Commands
```bash
npm run dev  # Start dev server
npm run test  # Run e2e tests if available
```

### Final Checklist
- [x] Advantage rolls show both dice rolling at once
- [x] Disadvantage rolls show both dice rolling at once
- [x] Custom advantage rolls show popup with both values
- [x] Custom disadvantage rolls show popup with both values
- [x] All existing roll types continue to work
- [x] No console errors during dice rolling
- [x] TypeScript compilation passes
