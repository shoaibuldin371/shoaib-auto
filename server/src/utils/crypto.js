import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET 
  ? crypto.createHash('sha256').update(String(process.env.ENCRYPTION_SECRET)).digest()
  : crypto.createHash('sha256').update('reachout-default-secret-key-2026').digest();

/**
 * Encrypt a plain text string into a combined IV + AuthTag + Ciphertext hex string
 */
export function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Decrypt a combined string created by encrypt()
 */
export function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return '';
  try {
    const [ivHex, tagHex, content] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return '';
  }
}
