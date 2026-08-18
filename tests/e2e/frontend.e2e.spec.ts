import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('shows the public newsroom homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Hồ Sơ Mở/)
    await expect(page.getByRole('heading', { name: /Bằng chứng trước/ })).toBeVisible()
    const navigation = page.getByRole('navigation', { name: 'Điều hướng chính' })
    await expect(navigation).toBeVisible()
    await expect(navigation.getByRole('link', { name: /Trang chủ/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(navigation.getByRole('link', { name: /Mới nhất/ })).not.toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
