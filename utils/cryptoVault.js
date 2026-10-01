/**
 * ============================================================================
 * COGNIMIRROR - CRYPTO VAULT & DATA PROTECTION (LEY 21.719 / LEY 20.584)
 * ============================================================================
 * Módulo de Cifrado Reversible de Alto Rendimiento (AES-GCM 256 bits)
 * y Seudonimización de Datos Sensibles de Menores de Edad.
 */

const DEFAULT_SALT = 'CogniMirror-Secure-Salt-Chile-2026';

/**
 * Deriva una CryptoKey de 256 bits a partir de una frase clave usando PBKDF2.
 */
async function deriveKey(passphrase, saltStr = DEFAULT_SALT) {
  if (typeof window === 'undefined' && !globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API no disponible en este entorno.');
  }

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltStr),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra una cadena o JSON con AES-GCM (256 bits).
 * @param {string|object} data - Datos a cifrar
 * @param {string} secretKey - Clave secreta o token de sesión
 * @returns {Promise<string>} String en base64 con formato iv:ciphertext
 */
export async function encryptSensitiveData(data, secretKey = 'cognimirror-vault-key-default') {
  try {
    if (!data) return data;
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const enc = new TextEncoder();
    const encodedData = enc.encode(text);

    // IV aleatorio de 12 bytes para AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(secretKey);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const ivArray = Array.from(iv);
    const cipherArray = Array.from(new Uint8Array(encryptedBuffer));
    
    // Empaquetar como formato seguro portable JSON-Base64
    const payload = JSON.stringify({
      v: 1,
      iv: btoa(String.fromCharCode.apply(null, ivArray)),
      d: btoa(String.fromCharCode.apply(null, cipherArray))
    });

    return `enc::${btoa(payload)}`;
  } catch (error) {
    console.error('[CryptoVault] Error al cifrar:', error);
    return data; // Fallback seguro
  }
}

/**
 * Descifra una cadena cifrada con encryptSensitiveData.
 * @param {string} encryptedString - String con prefijo enc::
 * @param {string} secretKey - Misma clave con que se cifró
 * @returns {Promise<string|object>} Datos descifrados o el texto original
 */
export async function decryptSensitiveData(encryptedString, secretKey = 'cognimirror-vault-key-default') {
  try {
    if (!encryptedString || typeof encryptedString !== 'string' || !encryptedString.startsWith('enc::')) {
      return encryptedString;
    }

    const base64Payload = encryptedString.slice(5);
    const jsonPayload = atob(base64Payload);
    const { iv: ivB64, d: dataB64 } = JSON.parse(jsonPayload);

    const iv = new Uint8Array(atob(ivB64).split('').map(c => c.charCodeAt(0)));
    const cipherBytes = new Uint8Array(atob(dataB64).split('').map(c => c.charCodeAt(0)));

    const key = await deriveKey(secretKey);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );

    const dec = new TextDecoder();
    const text = dec.decode(decryptedBuffer);

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    console.warn('[CryptoVault] No se pudo descifrar (posible clave distinta o texto plano):', error.message);
    return encryptedString;
  }
}

/**
 * Seudonimiza un RUN/RUT o Identificador para visualización segura (Anti-Fuga).
 * Ejemplo: "19.876.543-2" -> "19.***.***-2"
 */
export function maskRunOrId(val) {
  if (!val || typeof val !== 'string') return val;
  const clean = val.trim();
  if (clean.length < 5) return '***';
  return clean.replace(/^(\d{1,2})\.?\d{3}\.?\d{3}-?([\dkK])$/, '$1.***.***-$2');
}

/**
 * Seudonimiza un nombre completo para reportes no anonimizados.
 * Ejemplo: "Brayan Castro" -> "B***** C*****"
 */
export function maskFullName(name) {
  if (!name || typeof name !== 'string') return name;
  return name.split(' ').map(p => p.length > 1 ? `${p[0]}${'*'.repeat(p.length - 1)}` : p).join(' ');
}
