## 2024-08-12 - Weak CSP Nonce & innerHTML Sink
**Vulnerability:** Weak CSP nonce generation and unsanitized data rendered via innerHTML.
**Learning:** `crypto.getRandomValues(new Uint8Array(16)).join('')` generated a predictable string of numbers, which when base64-encoded, had very low entropy, rendering the CSP nonce ineffective. Furthermore, `innerHTML` was used without escaping data, creating a defense-in-depth failure.
**Prevention:** Always use standard high-entropy methods like `crypto.randomUUID()` or `btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))` for nonces, and sanitize any dynamic strings before injecting them into `innerHTML`.
