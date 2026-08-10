import crypto from 'node:crypto'

/**
 * Field-level encryption for contributor PII at rest (AES-256-GCM). The key
 * is derived from PAYLOAD_SECRET with scrypt; rotating PAYLOAD_SECRET
 * requires re-encrypting stored values, so plan rotation accordingly.
 *
 * Ciphertexts carry an `enc:v1:` prefix so plaintext values (pre-encryption
 * data, or values already encrypted) pass through hooks safely.
 */
const PREFIX = 'enc:v1:'
const KEY_SALT = 'journalism-field-crypto'

const getKey = (): Buffer => {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is required for field encryption')
  return crypto.scryptSync(secret, KEY_SALT, 32)
}

export const isEncrypted = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith(PREFIX)

export const encryptField = (value: string): string => {
  if (isEncrypted(value)) return value
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`
}

export const decryptField = (value: string): string => {
  if (!isEncrypted(value)) return value
  const [iv, tag, encrypted] = value.slice(PREFIX.length).split('.')
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(iv, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString(
    'utf8',
  )
}
