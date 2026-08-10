import crypto from 'node:crypto'

/**
 * Field-level encryption for contributor PII at rest (AES-256-GCM). The key
 * is derived from PAYLOAD_SECRET with scrypt and memoized for the process
 * lifetime — deriving it per call would put ~30ms of blocking CPU on hot
 * paths for no benefit (the secret cannot change without a restart anyway).
 *
 * ROTATION RUNBOOK: changing PAYLOAD_SECRET makes stored ciphertext
 * unreadable. To rotate, first re-encrypt every stored value with a script
 * that reads with the old secret and writes with the new one, then swap.
 * Reads fail soft (`[undecryptable]` placeholder + server log) so a single
 * bad row never takes down the review queue or a public case page.
 *
 * Ciphertexts carry an `enc:v1:` prefix so plaintext values (pre-encryption
 * data, or values already encrypted) pass through hooks safely.
 */
const PREFIX = 'enc:v1:'
const KEY_SALT = 'journalism-field-crypto'

let cachedKey: Buffer | null = null

const getKey = (): Buffer => {
  if (!cachedKey) {
    const secret = process.env.PAYLOAD_SECRET
    if (!secret) throw new Error('PAYLOAD_SECRET is required for field encryption')
    cachedKey = crypto.scryptSync(secret, KEY_SALT, 32)
  }
  return cachedKey
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

/** Strict decrypt — throws on malformed or tampered ciphertext. */
const decryptStrict = (value: string): string => {
  const [iv, tag, encrypted] = value.slice(PREFIX.length).split('.')
  if (!iv || !tag || !encrypted) throw new Error('Malformed encrypted field value')
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

/** Soft-fail decrypt for read paths: placeholder + log instead of a 500. */
export const decryptField = (value: string): string => {
  if (!isEncrypted(value)) return value
  try {
    return decryptStrict(value)
  } catch (error) {
    console.error('[field-crypto] undecryptable value (key rotation or tampering?)', error)
    return '[undecryptable]'
  }
}

/** Null-on-failure decrypt for validation paths. */
export const tryDecryptField = (value: string): string | null => {
  if (!isEncrypted(value)) return null
  try {
    return decryptStrict(value)
  } catch {
    return null
  }
}
