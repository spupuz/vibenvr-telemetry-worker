## 2024-05-24 - CSP Script-Src Broad Permissive Rule
**Vulnerability:** The Content Security Policy in `security.js` permitted the execution of scripts from `https://cdn.jsdelivr.net` globally, making it vulnerable to XSS if an attacker could execute arbitrary scripts hosted on that CDN (which is common). The CSP nonce was also generated weakly using a truncated string from `crypto.getRandomValues`.
**Learning:** Permissive script-src configurations that whitelist entire CDNs effectively neuter the protection of a CSP. Nonces must be used for inline and external scripts, and they must have high entropy.
**Prevention:** Rely strictly on `nonce-<value>` for script execution instead of domain whitelists. Use `crypto.randomUUID()` or a sufficiently long secure random sequence for nonces.

## 2024-08-12 - Weak CSP Nonce & innerHTML Sink
**Vulnerability:** Weak CSP nonce generation and unsanitized data rendered via innerHTML.
**Learning:** `crypto.getRandomValues(new Uint8Array(16)).join('')` generated a predictable string of numbers, which when base64-encoded, had very low entropy, rendering the CSP nonce ineffective. Furthermore, `innerHTML` was used without escaping data, creating a defense-in-depth failure.
**Prevention:** Always use standard high-entropy methods like `crypto.randomUUID()` or `btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))` for nonces, and sanitize any dynamic strings before injecting them into `innerHTML`.

## 2024-05-24 - Cloudflare Workers Cache API unhandled exception on non-GET
**Vulnerability:** Application crashed (Error 1101 / DoS) when a non-GET/HEAD request was sent to an endpoint performing a cache lookup (`caches.default.match`).
**Learning:** Cloudflare Workers `caches.default.match(request)` throws a synchronous TypeError if the request method is not GET or HEAD. This leads to unhandled exceptions if the method is not validated first.
**Prevention:** Always verify `request.method` (e.g., return 405 Method Not Allowed) before calling Cache API functions in Cloudflare Workers.
## 2024-10-27 - [Cache-Busting DoS on Cloudflare Workers]
**Vulnerability:** The `/api/stats` endpoint used `caches.default.match(request)` directly, which includes query parameters. Attackers could append random query strings (e.g. `?rnd=1`) to force a cache miss, leading to a Cache-Busting Denial of Service (DoS) by executing expensive SQL queries on every request.
**Learning:** Cloudflare Workers' Cache API defaults to caching the full URL, including query parameters. When an endpoint should serve identical content regardless of query strings (and when the system doesn't indiscriminately reject requests with query strings to prevent functional regressions), it is vulnerable to cache-busting DoS.
**Prevention:** Normalize the cache key by stripping the query string (`cacheUrl.search = '';`) before passing it to `caches.default.match()` and `cache.put()`.
## 2024-05-18 - Missing Security Headers on Error Responses
**Vulnerability:** 404 fallback and 500 error responses were returning without the standardized `SECURITY_HEADERS` (CSP, X-Frame-Options, etc.).
**Learning:** Security headers must be explicitly attached to *all* responses, including error and fallback paths, to prevent attackers from bypassing protections by forcing errors.
**Prevention:** Always spread `...SECURITY_HEADERS` into the `headers` object for any `new Response()` call, regardless of the HTTP status code.

## 2024-05-24 - Proxied Assets Defense in Depth
**Vulnerability:** Served assets via `handleAssets` lacked the centralized security headers (HSTS, CSP, etc.), breaking defense in depth.
**Learning:** Even internally proxied images must be wrapped with the application's strict CSP and headers to avoid creating framing/sniffing loopholes.
**Prevention:** Always pass `SECURITY_HEADERS` to proxy handlers and apply them to the response headers before returning.
## 2024-10-28 - CSP Broad Permissive Rule (Public CDN Whitelisted)
**Vulnerability:** The Content Security Policy in `security.js` permitted the execution of scripts from `https://cdn.jsdelivr.net` globally.
**Learning:** Permissive `script-src` configurations that whitelist entire public CDNs are dangerous because attackers can use them to bypass CSP (e.g. by loading vulnerable older versions of libraries or exploiting JSONP endpoints hosted on the same CDN). While a previous fix added `nonce` to scripts, the CDN domain was left whitelisted globally, neutralizing the benefit of the nonce for external scripts.
**Prevention:** Rely strictly on secure `nonce-<value>` or hashes for script execution, instead of domain whitelists for CDNs.
