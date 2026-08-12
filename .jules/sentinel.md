## 2024-05-24 - CSP Script-Src Broad Permissive Rule
**Vulnerability:** The Content Security Policy in `security.js` permitted the execution of scripts from `https://cdn.jsdelivr.net` globally, making it vulnerable to XSS if an attacker could execute arbitrary scripts hosted on that CDN (which is common). The CSP nonce was also generated weakly using a truncated string from `crypto.getRandomValues`.
**Learning:** Permissive script-src configurations that whitelist entire CDNs effectively neuter the protection of a CSP. Nonces must be used for inline and external scripts, and they must have high entropy.
**Prevention:** Rely strictly on `nonce-<value>` for script execution instead of domain whitelists. Use `crypto.randomUUID()` or a sufficiently long secure random sequence for nonces.

## 2024-08-12 - Weak CSP Nonce & innerHTML Sink
**Vulnerability:** Weak CSP nonce generation and unsanitized data rendered via innerHTML.
**Learning:** `crypto.getRandomValues(new Uint8Array(16)).join('')` generated a predictable string of numbers, which when base64-encoded, had very low entropy, rendering the CSP nonce ineffective. Furthermore, `innerHTML` was used without escaping data, creating a defense-in-depth failure.
**Prevention:** Always use standard high-entropy methods like `crypto.randomUUID()` or `btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))` for nonces, and sanitize any dynamic strings before injecting them into `innerHTML`.
