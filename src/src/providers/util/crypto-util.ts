import { Injectable } from '@angular/core';

@Injectable()
export class CryptoUtil {

  static BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  static HAS_SUBTLE_CRYPTO: boolean = typeof window !== 'undefined' && !!(window.crypto as any) && !!(window.crypto.subtle as any);

  static toUint8Array(str: string): Uint8Array {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);

    for (let i = 0; i < str.length; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return bufView;
  }

  static toBase64Url(base64: string): string {
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  static toBase64(bytes: Uint8Array): string {
    let len = bytes.length;
    let base64 = "";
    for (let i = 0; i < len; i += 3) {
      base64 += this.BASE64_CHARS[bytes[i] >> 2];
      base64 += this.BASE64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += this.BASE64_CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += this.BASE64_CHARS[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }
    return base64;
  }

  static deriveChallenge(codeVerifier: string): Promise<string> {
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      return Promise.reject(new Error('ERR_PKCE_CODE_VERIFIER_INVALID_LENGTH'));
    }
    if (!CryptoUtil.HAS_SUBTLE_CRYPTO) {
      return Promise.reject(new Error('ERR_PKCE_CRYPTO_NOTSUPPORTED'));
    }

    return new Promise((resolve, reject) => {
      crypto.subtle.digest('SHA-256', this.toUint8Array(codeVerifier)).then(
        arrayBuffer => {
          return resolve(this.toBase64Url(this.toBase64(new Uint8Array(arrayBuffer))));
        },
        error => reject(error)
      );
    });
  }

}
