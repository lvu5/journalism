import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('shows the public newsroom homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Hồ Sơ Mở/)
    await expect(page.getByRole('heading', { name: /Bằng chứng trước/ })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible()
  })
})
