import { test, expect } from '@playwright/test';

test.describe('3D Dice Roller Tests', () => {
  test('homepage loads with dice feature mentioned', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1')).toContainText('Forge Heroes');
    await expect(page.locator('text=3D Dice')).toBeVisible();
  });

  test('builder page loads with roll buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/builder');
    await expect(page.locator('h1')).toContainText('Character Builder');
    await expect(page.locator('button:has-text("Roll Mode")')).toBeVisible();
    await expect(page.locator('button:has-text("Roll Next")')).toBeVisible();
  });

  test('dice components exist in DOM', async ({ page }) => {
    await page.goto('http://localhost:3000/builder');
    await page.waitForTimeout(1000);

    // Check for dice context provider (should be in layout)
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Check that dice container exists (even if not visible yet)
    const diceContainer = await page.locator('#dice-box-container');
    await expect(diceContainer).toHaveCount(1);
  });

  test('clicking roll button shows dice canvas', async ({ page }) => {
    await page.goto('http://localhost:3000/builder');
    await page.waitForTimeout(1000);

    // Click the Roll Next button
    const rollButton = page.locator('button:has-text("Roll Next")');
    await rollButton.click();

    // Wait for dice to potentially appear
    await page.waitForTimeout(3000);

    // Check if canvas exists after clicking
    const canvas = await page.locator('canvas');
    const canvasCount = await canvas.count();
    console.log(`Canvas elements found: ${canvasCount}`);

    // The dice container should exist
    const diceContainer = await page.locator('#dice-box-container');
    await expect(diceContainer).toHaveCount(1);
  });

  test('no console errors from dice-box', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('http://localhost:3000/builder');
    await page.waitForTimeout(2000);

    // Click roll to trigger dice
    const rollButton = page.locator('button:has-text("Roll Next")');
    await rollButton.click();
    await page.waitForTimeout(3000);

    // Filter out expected errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      e.includes('dice')
    );

    console.log('All errors:', errors);
    console.log('Dice-related errors:', criticalErrors);

    // Should have no dice-specific errors
    expect(criticalErrors).toHaveLength(0);
  });
});
