/**
 * Crypto Utilities — StellarNest
 * AES-GCM encryption using Web Crypto API (browser-native, no deps)
 * Used to encrypt Stellar secret keys before storing in Firestore.
 */

const ALGO = 'AES-GCM';
const KEY_ITERATIONS = 100_000;
const SALT_LEN = 16;
const IV_LEN = 12;

/**
 * Derive an AES-256 key from a password (Firebase UID) + random salt.
 * Uses PBKDF2 with SHA-256.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { name: 'PBKDF2', salt: salt as any, iterations: KEY_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt a plaintext secret with a password (Firebase UID).
 * Returns a base64 string: salt (16B) + ciphertext + iv (12B).
 */
export async function encryptSecret(plaintext: string, password: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    const key = await deriveKey(password, salt);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv: iv as any }, key, enc.encode(plaintext));

    // Combine salt + ciphertext + iv into one base64 string
    const combined = new Uint8Array(SALT_LEN + ciphertext.byteLength + IV_LEN);
    combined.set(salt, 0);
    combined.set(new Uint8Array(ciphertext), SALT_LEN);
    combined.set(iv, SALT_LEN + ciphertext.byteLength);

    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error('[Crypto] encryptSecret failed:', err);
    return '';
  }
}

/**
 * Decrypt an encrypted secret using the password (Firebase UID).
 * Returns the original plaintext or null on failure.
 */
export async function decryptSecret(encrypted: string, password: string): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const salt = combined.slice(0, SALT_LEN);
    const iv = combined.slice(combined.byteLength - IV_LEN);
    const ciphertext = combined.slice(SALT_LEN, combined.byteLength - IV_LEN);

    const key = await deriveKey(password, salt);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv: iv as any }, key, ciphertext as any);
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('[Crypto] decryptSecret failed:', err);
    return null;
  }
}
