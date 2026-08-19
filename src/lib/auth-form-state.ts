export type AuthFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: Partial<Record<'email' | 'name' | 'password' | 'passwordConfirm', string>>
}

export const initialAuthState: AuthFormState = { status: 'idle', message: '' }
