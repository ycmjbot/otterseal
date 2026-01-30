export async function getMasterKey(seed: string): Promise<CryptoKey> {
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

export async function hashTitle(title: string): Promise<string> {
  const masterKey = await getMasterKey(title);
  const salt = new TextEncoder().encode('SecurePad');
  const info = new TextEncoder().encode('ID');

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

export async function deriveKey(title: string): Promise<CryptoKey> {
  const masterKey = await getMasterKey(title);
  const salt = new TextEncoder().encode('SecurePad');
  const info = new TextEncoder().encode('KEY');

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
