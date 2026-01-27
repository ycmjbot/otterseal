export async function hashTitle(title) {
  const msgBuffer = new TextEncoder().encode(title);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveKey(title) {
  // Use SHA-256 of title to get 32 bytes for AES-256
  const msgBuffer = new TextEncoder().encode(title);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptNote(content, key) {
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

export async function decryptNote(encryptedJson, key) {
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
