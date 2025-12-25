import { test, expect } from '@playwright/test';

test.describe('Settings Dialog Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the timer to be visible
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });

  test('should open Settings dialog with Enter key', async ({ page }) => {
    // Focus on Settings button
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.focus();

    // Verify Settings button has focus
    await expect(settingsButton).toBeFocused();

    // Press Enter to open dialog
    await page.keyboard.press('Enter');

    // Verify dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should have correct initial focus in dialog', async ({ page }) => {
    // Open Settings dialog
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();

    // Wait for dialog to be visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // Check that focus is inside the dialog
    const focusedElement = await page.evaluate(() => {
      const activeElement = document.activeElement;
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.contains(activeElement);
    });

    expect(focusedElement).toBe(true);
  });

  test('should trap focus within dialog (Tab navigation)', async ({ page }) => {
    // Open Settings dialog
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // Get all focusable elements in the dialog
    const focusableElements = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const focusable = dialog?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(focusable || []).length;
    });

    expect(focusableElements).toBeGreaterThan(0);

    // Press Tab multiple times (more than the number of focusable elements)
    const tabCount = focusableElements + 5;
    for (let i = 0; i < tabCount; i++) {
      await page.keyboard.press('Tab');

      // Verify focus is still within the dialog
      const isInsideDialog = await page.evaluate(() => {
        const activeElement = document.activeElement;
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(activeElement);
      });

      expect(isInsideDialog).toBe(true);
    }
  });

  test('should close with ESC and restore focus to Settings button', async ({ page }) => {
    // Open Settings dialog
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // Press ESC to close
    await page.keyboard.press('Escape');

    // Verify dialog is closed
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify focus returns to Settings button
    await expect(settingsButton).toBeFocused();
  });

  test('should not respond to global shortcuts when dialog is open', async ({ page }) => {
    // Get initial timer display - use specific class selector to avoid matching title
    const timerDisplay = page.locator('span.text-6xl.font-mono');
    const initialTime = await timerDisplay.textContent();

    // Open Settings dialog
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // Try to use global shortcuts (Space, R, Escape should not affect timer)
    await page.keyboard.press('Space'); // Should not start/pause timer
    await page.keyboard.press('KeyR'); // Should not reset timer

    // Dialog should still be open (first Escape closes dialog, not affects timer)
    // We already tested Escape closes dialog in previous test

    // Close dialog
    await page.keyboard.press('Escape');

    // Verify timer state hasn't changed (still idle, not started)
    const currentTime = await timerDisplay.textContent();
    expect(currentTime).toBe(initialTime);

    // Verify Start button is still visible (timer didn't start)
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });
});
