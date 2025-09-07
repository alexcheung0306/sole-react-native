import * as crypto from "crypto"

// Configuration
const ALGORITHM: any = "aes-256-cbc"
const ENCODING: any = "hex"
const IV_LENGTH: any = 16 // For AES, this is always 16 bytes

// Interface for encryption result
interface EncryptionResult {
  iv: string
  encrypted: string
}

// Generate a secure key from a password
function generateKey(password: string): Buffer {
  return crypto.pbkdf2Sync(password, "salt", 100000, 32, "sha256")
}

// Encrypt a string
export function encrypt(text: string, password: string): EncryptionResult {
  const iv: any = crypto.randomBytes(IV_LENGTH)
  const key: any = generateKey(password)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, "utf8", ENCODING)
  encrypted += cipher.final(ENCODING)

  return {
    iv: iv.toString(ENCODING),
    encrypted,
  }
}

// Decrypt a string
export function decrypt(
  encryptedData: EncryptionResult,
  password: string
): string {
  const iv: any = Buffer.from(encryptedData.iv, ENCODING)
  const key: any = generateKey(password)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

  let decrypted = decipher.update(encryptedData.encrypted, ENCODING, "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
