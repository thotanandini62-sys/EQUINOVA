import { PasswordStrength } from '../types';

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  let passedCount = 0;
  if (checks.minLength) passedCount++;
  if (checks.hasUppercase) passedCount++;
  if (checks.hasLowercase) passedCount++;
  if (checks.hasNumber) passedCount++;
  if (checks.hasSpecial) passedCount++;

  let label: PasswordStrength['label'] = 'Very Weak';
  let color = 'bg-rose-500';
  let score = 0;

  if (password.length === 0) {
    score = 0;
    label = 'Very Weak';
    color = 'bg-slate-300 dark:bg-slate-700';
  } else if (passedCount <= 2) {
    score = 1;
    label = 'Weak';
    color = 'bg-red-500';
  } else if (passedCount === 3) {
    score = 2;
    label = 'Moderate';
    color = 'bg-amber-500';
  } else if (passedCount === 4) {
    score = 3;
    label = 'Strong';
    color = 'bg-emerald-500';
  } else {
    score = 4;
    label = 'Very Strong';
    color = 'bg-emerald-400';
  }

  return {
    score,
    label,
    color,
    checks,
  };
}

// Client-side AES-GCM encryption for ultra-secure Data Vault protection
export async function encryptSensitiveData(plainText: string, secretKeyStr: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secretKeyStr),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainText)
    );

    const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
    buffer.set(salt, 0);
    buffer.set(iv, salt.byteLength);
    buffer.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

    return btoa(String.fromCharCode(...buffer));
  } catch (err) {
    console.error('Encryption failed:', err);
    return plainText;
  }
}

export async function decryptSensitiveData(cipherTextBase64: string, secretKeyStr: string): Promise<string> {
  try {
    const raw = atob(cipherTextBase64);
    const rawBytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      rawBytes[i] = raw.charCodeAt(i);
    }

    if (rawBytes.length < 28) {
      return cipherTextBase64;
    }

    const salt = rawBytes.slice(0, 16);
    const iv = rawBytes.slice(16, 28);
    const data = rawBytes.slice(28);

    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secretKeyStr),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    // If it cannot be decrypted (e.g., plain text or key mismatch), return fallback
    return cipherTextBase64;
  }
}

export function formatTimestamp(isoString?: string): string {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}
