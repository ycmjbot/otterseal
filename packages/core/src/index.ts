const HKDF_SALT = "SecurePad";
const HKDF_INFO_ID = "ID";
const HKDF_INFO_KEY = "KEY";

/**
 * Imports the seed as a CryptoKey suitable for HKDF derivation.
 */
async function getHKDFMasterKey(seed: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const masterSecret = enc.encode(seed);
  return await crypto.subtle.importKey(
    'raw',
    masterSecret,
    'HKDF',
    false,
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Derives a deterministic ID for a given title.
 * 
 * We use HKDF for "Domain Separation". This ensures that the ID sent to the server 
 * is cryptographically decoupled from the encryption key. Even if the server 
 * knows the ID, it cannot derive the Key because they are derived using different 
 * 'info' strings ("ID" vs "KEY").
 */
export async function hashTitle(title: string): Promise<string> {
  const masterKey = await getHKDFMasterKey(title);
  const enc = new TextEncoder();
  const salt = enc.encode(HKDF_SALT);
  const info = enc.encode(HKDF_INFO_ID);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: info,
    },
    masterKey,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derives a 256-bit AES-GCM encryption key from the title.
 * 
 * Uses HKDF with domain separation (info="KEY") to ensure this key remains 
 * private even if the derived ID is known to the server.
 */
export async function deriveKey(title: string): Promise<CryptoKey> {
  const masterKey = await getHKDFMasterKey(title);
  const enc = new TextEncoder();
  const salt = enc.encode(HKDF_SALT);
  const info = enc.encode(HKDF_INFO_KEY);

  return await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: info,
    },
    masterKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts content using AES-GCM with a random 12-byte IV.
 * Returns a JSON string containing the base64-encoded IV and ciphertext.
 */
export async function encryptNote(content: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(content);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Convert to base64
  const ivB64 = btoa(String.fromCharCode(...iv));
  const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  
  return JSON.stringify({ iv: ivB64, data: cipherB64 });
}

/**
 * Decrypts an AES-GCM encrypted note.
 * Expects a JSON string with base64 'iv' and 'data'.
 * Returns empty string on failure.
 */
export async function decryptNote(encryptedJson: string, key: CryptoKey): Promise<string> {
  try {
    if (!encryptedJson) return "";
    const parsed = JSON.parse(encryptedJson);
    if (!parsed.iv || !parsed.data) return "";

    const ivArr = Uint8Array.from(atob(parsed.iv), c => c.charCodeAt(0));
    const dataArr = Uint8Array.from(atob(parsed.data), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArr },
      key,
      dataArr
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed", e);
    return ""; 
  }
}
