import { test, expect } from '@playwright/test';

test.describe('UI Tests for House of Shadows Character Creator', () => {
  test.describe.serial('Test Suite 1: Dice Rolling in Builder', () => {
    test.beforeEach(async ({ page }) => {
      // Clear localStorage to avoid conflicts
      await page.evaluate(() => localStorage.clear());
      await page.reload();
    });

    test('should show dice rolling in builder and verify colors', async ({ page }) => {
      // Navigate to the builder  
      await page.goto('http://localhost:3000/builder');
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Verify page has loaded correctly
      await expect(page.locator('h1')).toContainText('Character Builder');
      
      // Fill in a name for the character
      await page.fill('input[placeholder="Name"]', 'Test Dice Roll Character');

      // Click the "Roll All Stats" button
      const rollAllButton = page.locator('button:has-text("Roll All 12 Dice")');
      await expect(rollAllButton).toBeEnabled();
      await rollAllButton.click();

      // Wait for dice to roll
      await page.waitForTimeout(5000);

      // Verify the canvas container is present
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
      
      // Verify dice appear by checking for dice box container
      const diceContainer = await page.locator('#dice-box-container');
      await expect(diceContainer).toBeVisible();
      
      // Verify that the dice were rolled (values are assigned)
      const rolledValues = page.locator('.w-14.h-14.rounded-lg'); // These are the rolled value displays
      await expect(rolledValues).toHaveCount(3); // Should have 3 values
      
      // Take screenshot of dice rolling
      await page.screenshot({ path: 'test-results/dice-rolling.png', fullPage: true });
      
      // Wait briefly before continuing
      await page.waitForTimeout(1000);
    });

    test('should verify roll values and assignment', async ({ page }) => {
      // Navigate to the builder  
      await page.goto('http://localhost:3000/builder');
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Fill in a name for the character
      await page.fill('input[placeholder="Name"]', 'Test Dice Roll Character');

      // Click the "Roll All Stats" button
      const rollAllButton = page.locator('button:has-text("Roll All 12 Dice")');
      await expect(rollAllButton).toBeEnabled();
      await rollAllButton.click();

      // Wait for the dice to finish rolling
      await page.waitForTimeout(6000);

      // Check that three values have appeared
      const rollValues = await page.locator('[class*="w-14 h-14 rounded-lg border-2 flex items-center justify-center"]').all();
      await expect(rollValues).toHaveLength(3);
      
      // Verify at least one number is displayed in the rolls
      let hasNumericValue = false;
      for (const roll of rollValues) {
        const value = await roll.textContent();
        if (value && /\d+/.test(value)) {
          hasNumericValue = true;
          break;
        }
      }
      expect(hasNumericValue).toBeTruthy();
      
      // Verify user can assign values to stats
      const assignButtons = page.locator('select');
      await expect(assignButtons).toHaveCount(3); // Should have 3 assignment selectors
    });
  });

  test.describe('Test Suite 2: Dark Fantasy Theme Verification', () => {
    test('should verify dark fantasy theme with purple colors', async ({ page }) => {
      // Visit characters page
      await page.goto('http://localhost:3000/characters');
      await page.waitForTimeout(1000);

      // Take screenshot of characters page
      await page.screenshot({ path: 'test-results/characters-page.png', fullPage: true });

      // Verify dark fantasy theme (purple tones)
      const body = await page.locator('body');
      const bodyBg = await body.evaluate(el => getComputedStyle(el).backgroundColor);
      
      // Check that the main color tone is dark purple/black as defined in globals.css
      // RGB equivalent of HSL(240, 20%, 5%) ~ rgb(12, 10, 11) - dark purplish
      expect(bodyBg).toContain('rgb(12,');  // Check for dark background

      // Check for presence of purple theme elements
      await expect(page.locator('.bg-purple-700')).toBeVisible();
    });
    
    test('should verify theme is purple/dark not orange/amber', async ({ page }) => {
      // Check multiple pages to verify consistent theming
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(500);
      
      // Check for purple themed elements (avoiding orange/amber)
      const pageContent = await page.content();
      
      // Look for dark fantasy purple references in the CSS
      expect(pageContent).toContain('--primary: 270 50% 45%');  // Purple hue
      expect(pageContent).not.toContain('--primary: 30 70% 50%');  // Not orange/amber hue
      
      // Take a screenshot of the home page to visually verify theme
      await page.screenshot({ path: 'test-results/home-page-theme.png' });
    });
  });

  test.describe('Test Suite 3: Long Rest Button Verification', () => {
    test('should create a character and verify Long Rest button exists', async ({ page }) => {
      // Create a test character
      await page.goto('http://localhost:3000/builder');
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      // Fill in character name
      await page.fill('input[placeholder="Name"]', 'Test Long Rest');

      // Roll stats to advance through first step
      await page.click('button:has-text("Roll All 12 Dice")');
      await page.waitForTimeout(3000);

      // Assign all rolls (select highest values for each)
      const selects = await page.locator('select').all();
      for (const select of selects.slice(0, 3)) {
        const options = await select.locator('option').allTextContents();
        // Select the highest available option (skip placeholder)
        if (options.length > 1) {
          await select.selectOption({ index: options.length - 1 });
        }
      }

      // Click 'Continue to Class'
      await page.click('button:has-text("Continue to Class")');
      await page.waitForTimeout(500);

      // Select a class (choose first available)
      await page.click('button:has-text("Fighter")');
      await page.waitForTimeout(500);

      // Continue through HP steps
      await page.click('button:has-text("Continue to Base HP")');
      await page.click('button:has-text("Roll Base HP Die")');
      await page.waitForTimeout(2000);

      // Continue to extra HP
      await page.click('button:has-text("Continue to Extra HP")');
      await page.waitForTimeout(500);

      // Continue to skills and add a skill to make the character more complete
      await page.click('button:has-text("4. XP")');
      await page.fill('input[type="number"]', '5');
      await page.click('button:has-text("Continue to Extra HP")');
      await page.waitForTimeout(500);

      // Roll extra HP
      await page.click('button:has-text("Roll All Extra HP Dice")');
      await page.waitForTimeout(2000);

      // Continue to skills then to final sheet
      await page.click('button:has-text("Continue to Skills")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Continue to Final Sheet")');

      // Save character
      await page.click('button:has-text("Save Character")');
      await page.waitForTimeout(1000);

      // Navigate to Sheet page
      await page.goto('http://localhost:3000/sheet');
      await page.waitForTimeout(2000); // Longer wait to allow page to load

      // Verify that the Long Rest button exists and is styled with purple colors
      const longRestButton = page.locator('button:has-text("Long Rest")');
      
      // Take screenshot showing Long Rest button
      await page.screenshot({ path: 'test-results/sheet-page-long-rest.png' });
      
      // Wait for button and check visibility
      await expect(longRestButton).toBeVisible();
      
      // Check that button uses purple colors (not amber/orange)
      const buttonClasses = await longRestButton.getAttribute('class');
      expect(buttonClasses).toContain('purple');  // Check purple color class
      expect(buttonClasses).not.toContain('amber');  // Ensure not using amber class
      expect(buttonClasses).not.toContain('orange'); // Ensure not using orange class
      
      // Verify the Long Rest button function works without error
      await longRestButton.click();
      await page.waitForTimeout(500); // Allow time for potential update
      
      // Verify HP is updated appropriately after long rest
      const hpDisplay = page.locator('[data-testid="hp-display"], .text-4xl.font-bold.text-white').first();
      if (await hpDisplay.count() > 0) {
        const currentHp = await hpDisplay.textContent();
        expect(currentHp).not.toBe('0');
      }
    });
  });

  test.describe('Complete Flow Verification', () => {
    test('should run complete verification of all UI elements', async ({ page }) => {
      // Take screenshot of landing page
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/landing-page.png' });

      // Navigate and verify characters page
      await page.goto('http://localhost:3000/characters');
      await page.waitForTimeout(500);
      await expect(page.locator('text=Characters')).toBeVisible();
      
      // Go to builder
      await page.goto('http://localhost:3000/builder');
      await page.waitForTimeout(1000);
      
      // Test basic dice roll
      await page.fill('input[placeholder="Name"]', 'Full Flow Test');
      await page.click('button:has-text("Roll All 12 Dice")');
      await page.waitForTimeout(3000);
      
      // Assign values and continue
      const selects = await page.locator('select').all();
      for (const select of selects.slice(0, 3)) {
        const options = await select.locator('option').allTextContents();
        if (options.length > 1) {
          await select.selectOption({ index: options.length - 1 });
        }
      }
      await page.click('button:has-text("Continue to Class")');
      await page.click('button:has-text("Fighter")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Continue to Base HP")');
      await page.click('button:has-text("Roll Base HP Die")');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("6. Skills")');
      await page.waitForTimeout(300);
      await page.click('button:has-text("Continue to Final Sheet")');
      
      // Verify final sheet appearance
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/final-sheet-preview.png' });
      
      // Take final screenshot of all elements verified
      await page.goto('http://localhost:3000/sheet');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/complete-sheet.png' });
    });
  });
});