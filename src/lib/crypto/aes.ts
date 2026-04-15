/**
 * NeuralHub · AES-256-GCM Key Encryption
 *
 * Encrypts provider API keys at rest.
 * The master encryption key is stored ONLY in the environment —
 * never in the database, never in logs.
 *
 * Scheme:
 *   - Algorithm : AES-256-GCM (authenticated encryption)
 *   - Key source : ENCRYPTION_MASTER_KEY env var (32-byte hex = 64 chars)
 *   - IV         : 12-byte random nonce (fresh per encryption)
 *   - Auth tag   : 16 bytes (GCM default)
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LEN    = 12;
const TAG_LEN   = 16;

function getMasterKey(): Buffer {
  const raw = process.env.ENCRYPTION_MASTER_KEY;
  if (!raw || raw.length !== 64) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY must be a 64-char hex string (32 bytes). " +
      "Generate with: openssl rand -hex 32"
    );
  }
  return Buffer.from(raw, "hex");
}

export interface EncryptedPayload {
  encryptedKey: string;  // ciphertext (hex)
  iv:           string;  // nonce (hex)
  tag:          string;  // auth tag (hex)
}

/**
 * Encrypt a plaintext API key.
 * @returns Encrypted payload to persist in the database.
 */
export function encryptKey(plaintext: string): EncryptedPayload {
  const masterKey = getMasterKey();
  const iv        = randomBytes(IV_LEN);
  const cipher    = createCipheriv(ALGORITHM, masterKey, iv, { authTagLength: TAG_LEN });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedKey: encrypted.toString("hex"),
    iv:           iv.toString("hex"),
    tag:          cipher.getAuthTag().toString("hex"),
  };
}

/**
 * Decrypt an encrypted API key payload.
 * Throws if the ciphertext has been tampered with (GCM authentication failure).
 */
export function decryptKey(payload: EncryptedPayload): string {
  const masterKey = getMasterKey();
  const iv        = Buffer.from(payload.iv,  "hex");
  const tag       = Buffer.from(payload.tag, "hex");
  const encrypted = Buffer.from(payload.encryptedKey, "hex");

  const decipher = createDecipheriv(ALGORITHM, masterKey, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Rotate a key: re-encrypt with a fresh IV.
 * Use this when rotating the master key or as a scheduled security measure.
 */
export function rotateKey(payload: EncryptedPayload): EncryptedPayload {
  const plaintext = decryptKey(payload);
  return encryptKey(plaintext);
}

/**
 * Derive a deterministic sub-key from the master key + a salt.
 * Useful for HMAC signing (e.g., webhook signatures).
 */
export function deriveKey(salt: string): Buffer {
  return scryptSync(getMasterKey(), Buffer.from(salt, "utf8"), 32);
}
