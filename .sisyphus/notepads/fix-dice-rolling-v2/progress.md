# Progress Report - Fix Dice Rolling Implementation

## Changes Made

### Files Modified: `/Users/benjamin/HoS_Character_Creator/src/app/sheet/page.tsx`

#### Function `rollCustomDice()` (around line 456)
- **BEFORE**: `const [results1, results2] = await Promise.all([rollDice(...), rollDice(...)])`
- **AFTER**: Using `rollDiceBatch([{notation: ..., options: ...}, {notation: ..., options: ...}])`
- **Purpose**: Fixes concurrency issue caused by `isRolling` guard in `rollDice`

#### Function `rollCheckWithMode()` (around line 523)
- **BEFORE**: `const [results1, results2] = await Promise.all([rollDice(...), rollDice(...)])`
- **AFTER**: Using `rollDiceBatch([{notation: ..., options: ...}, {notation: ..., options: ...}])`
- **Purpose**: Fixes concurrency issue caused by `isRolling` guard in `rollDice`

## How rollDiceBatch Works
- `rollDice` has `if (isRolling) return []` guard that blocks concurrent calls
- `rollDiceBatch` uses `diceBox.add()` for subsequent dice, adding them to same roll
- This allows both dice to roll simultaneously without the isRolling conflict

## Result
Fixed the issue where clicking advantage/disadvantage would not work properly due to simultaneous dice rolling conflicts.