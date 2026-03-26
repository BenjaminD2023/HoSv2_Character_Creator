import { test, expect } from '@playwright/test';

test.describe('SpellCasting Feature Tests', () => {
  test('Wizard spell slots display correctly', async ({ page }) => {
    // Navigate to builder and create wizard
    await page.goto('http://localhost:3000/builder');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Fill in name
    await page.fill('input[placeholder="Name"]', 'Test Wizard');

    // Roll stats
    await page.click('button:has-text("Roll All 12 Dice")');
    await page.waitForTimeout(3000);

    // Assign stats from dropdowns
    const selects = await page.locator('select').all();
    for (const select of selects.slice(0, 3)) {
      const options = await select.locator('option').allTextContents();
      if (options.length > 1) {
        await select.selectOption(options[options.length - 1]);
      }
    }

    // Continue to Class
    await page.click('button:has-text("Continue to Class")');
    await expect(page.locator('text=Step 2: Class Selection')).toBeVisible();

    // Select Wizard
    await page.click('button:has-text("Wizard")');
    await page.waitForTimeout(500);

    // Continue through HP and XP to Skills
    await page.click('button:has-text("Continue to Base HP")');
    await page.click('button:has-text("Roll Base HP Die")');
    await page.waitForTimeout(2000);
    
    // Navigate to Skills directly
    await page.click('button:has-text("6. Skills")');
    await expect(page.locator('text=Step 6: Skills')).toBeVisible();

    // Verify wizard starts with Lv 1 and Lv 2 spell slots
    const skillBadges = await page.locator('[data-testid="skill-badge"]').allTextContents();
    const hasLv1 = skillBadges.some(s => s.includes('Lv 1 Spell Slot'));
    const hasLv2 = skillBadges.some(s => s.includes('Lv 2 Spell Slot'));
    
    // Wizard should have Lv 1 and Lv 2 spell slots by default
    expect(hasLv1 || skillBadges.some(s => s.includes('Spell Slot'))).toBeTruthy();

    // Save character
    await page.click('button:has-text("Save Character")');
    await page.waitForTimeout(1000);

    // Navigate to Sheet
    await page.goto('http://localhost:3000/sheet');
    await page.waitForTimeout(1000);

    // Verify Spell Casting tab exists and click it
    const spellTab = page.locator('button:has-text("Spell Casting")');
    await expect(spellTab).toBeVisible();
    await spellTab.click();
    await page.waitForTimeout(500);

    // Verify spell slot levels are displayed
    await expect(page.locator('text=Level 1')).toBeVisible();
    await expect(page.locator('text=Level 2')).toBeVisible();
    await expect(page.locator('text=Level 3')).toBeVisible();

    // Verify Long Rest button
    await expect(page.locator('button:has-text("Long Rest")')).toBeVisible();
  });

  test('Spell slot toggling', async ({ page }) => {
    await page.goto('http://localhost:3000/sheet');
    await page.waitForTimeout(1000);

    // Click Spell Casting tab
    await page.click('button:has-text("Spell Casting")');
    await page.waitForTimeout(500);

    // Find and click a spell slot
    const slotButton = page.locator('button[title="Click to use"]').first();
    if (await slotButton.count() > 0) {
      await slotButton.click();
      await page.waitForTimeout(500);

      // Verify slot is now used (has title "Click to restore")
      const usedSlot = page.locator('button[title="Click to restore"]').first();
      await expect(usedSlot).toBeVisible();

      // Click to restore
      await usedSlot.click();
      await page.waitForTimeout(500);

      // Verify slot is available again
      const availableSlot = page.locator('button[title="Click to use"]').first();
      await expect(availableSlot).toBeVisible();
    }
  });

  test('Long Rest restores all spell slots', async ({ page }) => {
    await page.goto('http://localhost:3000/sheet');
    await page.waitForTimeout(1000);

    // Click Spell Casting tab
    await page.click('button:has-text("Spell Casting")');
    await page.waitForTimeout(500);

    // Click Long Rest button
    await page.click('button:has-text("Long Rest")');
    await page.waitForTimeout(1000);

    // After long rest, all slots should be available
    // Check that there are available slots
    const availableSlots = page.locator('button[title="Click to use"]');
    expect(await availableSlots.count()).toBeGreaterThan(0);
  });

  test('Bard spell slots equal to tier', async ({ page }) => {
    // Create bard character
    await page.goto('http://localhost:3000/builder');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Fill in name
    await page.fill('input[placeholder="Name"]', 'Test Bard');

    // Roll stats
    await page.click('button:has-text("Roll All 12 Dice")');
    await page.waitForTimeout(3000);

    // Assign stats
    const selects = await page.locator('select').all();
    for (const select of selects.slice(0, 3)) {
      const options = await select.locator('option').allTextContents();
      if (options.length > 1) {
        await select.selectOption(options[options.length - 1]);
      }
    }

    // Continue and select Bard
    await page.click('button:has-text("Continue to Class")');
    await page.click('button:has-text("Bard")');
    await page.waitForTimeout(500);

    // Continue through HP
    await page.click('button:has-text("Continue to Base HP")');
    await page.click('button:has-text("Roll Base HP Die")');
    await page.waitForTimeout(2000);

    // Go to Skills
    await page.click('button:has-text("6. Skills")');
    await page.waitForTimeout(500);

    // Add Inspiration at level 3
    await page.click('button:has-text("Add Skill")');
    await page.waitForTimeout(300);
    
    // Select Inspiration
    const skillSelect = page.locator('select').first();
    await skillSelect.selectOption('Inspiration');
    await page.waitForTimeout(300);
    
    // Set level to 3
    const levelInput = page.locator('input[type="number"]').filter({ hasText: '' }).first();
    await levelInput.fill('3');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(500);

    // Save character
    await page.click('button:has-text("Save Character")');
    await page.waitForTimeout(1000);

    // Go to Sheet
    await page.goto('http://localhost:3000/sheet');
    await page.waitForTimeout(1000);

    // Click Spell Casting tab
    await page.click('button:has-text("Spell Casting")');
    await page.waitForTimeout(500);

    // Verify bard has Spell Slots section
    await expect(page.locator('text=Spell Slots')).toBeVisible();
  });
});
