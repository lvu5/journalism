import { describe, expect, it } from 'vitest'

import {
  initialAuthState,
  registerAction,
} from '@/app/(frontend)/auth/actions'
import { safeNextPath } from '@/lib/auth'

describe('Frontend authentication', () => {
  it('accepts only same-origin relative redirect paths', () => {
    expect(safeNextPath('/admin')).toBe('/admin')
    expect(safeNextPath('https://example.com')).toBe('/')
    expect(safeNextPath('//example.com')).toBe('/')
    expect(safeNextPath('/\\example.com')).toBe('/')
    expect(safeNextPath('/login?next=/admin')).toBe('/')
    expect(safeNextPath('/auth/callback?code=secret')).toBe('/')
    expect(safeNextPath(undefined, '/author')).toBe('/author')
  })

  it('rejects weak and mismatched registration passwords before database work', async () => {
    const formData = new FormData()
    formData.set('locale', 'en')
    formData.set('name', 'Test Author')
    formData.set('email', 'author@example.com')
    formData.set('password', 'short')
    formData.set('passwordConfirm', 'different')

    const result = await registerAction(initialAuthState, formData)

    expect(result.status).toBe('error')
    expect(result.fieldErrors?.password).toMatch(/12/)
    expect(result.fieldErrors?.passwordConfirm).toMatch(/does not match/)
  })
})
