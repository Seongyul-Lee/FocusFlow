import { test, expect } from '@playwright/test'

test.describe('Timer Accuracy', () => {
  // Timer display locator - targets the main timer span
  const getTimerDisplay = (page: import('@playwright/test').Page) =>
    page.locator('span.text-6xl.font-mono')

  test('should complete 10-second timer accurately with clock manipulation', async ({ page }) => {
    // Install mock clock before navigation
    await page.clock.install()

    // Navigate with testDuration=10 (10 seconds)
    await page.goto('/?testDuration=10')

    // Verify initial time is 00:10
    await expect(getTimerDisplay(page)).toHaveText('00:10')

    // Start the timer
    await page.getByRole('button', { name: /start/i }).click()

    // Verify timer is running
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible()

    // Fast forward 5 seconds
    await page.clock.fastForward('00:05')

    // Timer should show approximately 5 seconds left
    await expect(getTimerDisplay(page)).toHaveText(/00:0[45]/)

    // Fast forward remaining 5 seconds
    await page.clock.fastForward('00:05')

    // Timer should complete and transition to break
    await expect(page.getByText('Break Time')).toBeVisible({ timeout: 2000 })
  })

  test('should maintain accuracy after pause/resume cycle', async ({ page }) => {
    await page.clock.install()
    await page.goto('/?testDuration=10')

    // Start timer
    await page.getByRole('button', { name: /start/i }).click()

    // Fast forward 3 seconds
    await page.clock.fastForward('00:03')

    // Pause
    await page.getByRole('button', { name: /pause/i }).click()
    await expect(page.getByRole('button', { name: /resume/i })).toBeVisible()

    // Timer should show ~7 seconds
    await expect(getTimerDisplay(page)).toHaveText(/00:0[67]/)

    // Fast forward while paused (should not affect timer)
    await page.clock.fastForward('00:10')

    // Timer should still show ~7 seconds
    await expect(getTimerDisplay(page)).toHaveText(/00:0[67]/)

    // Resume
    await page.getByRole('button', { name: /resume/i }).click()

    // Fast forward remaining time
    await page.clock.fastForward('00:07')

    // Should transition to break
    await expect(page.getByText('Break Time')).toBeVisible({ timeout: 2000 })
  })

  test('should count session after timer completion', async ({ page }) => {
    await page.clock.install()
    await page.goto('/?testDuration=5')

    // Verify initial session count (use specific span selector to avoid matching dashboard panels)
    await expect(page.locator('span.text-foreground').filter({ hasText: /Today: 0 sessions/ })).toBeVisible()

    // Start and complete timer
    await page.getByRole('button', { name: /start/i }).click()
    await page.clock.fastForward('00:05')

    // Wait for transition and check session count
    await expect(page.getByText('Break Time')).toBeVisible({ timeout: 2000 })
    await expect(page.locator('span.text-foreground').filter({ hasText: /Today: 1 session/ })).toBeVisible()
  })

  test('timer should update browser title', async ({ page }) => {
    await page.clock.install()
    await page.goto('/?testDuration=10')

    // Check initial title (format: "00:10 - Pomobox")
    await expect(page).toHaveTitle(/00:10.*Pomobox/i)

    // Start timer
    await page.getByRole('button', { name: /start/i }).click()

    // Fast forward 3 seconds
    await page.clock.fastForward('00:03')

    // Title should reflect remaining time
    await expect(page).toHaveTitle(/00:0[67].*Pomobox/i)
  })
})
