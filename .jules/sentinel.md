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
## 2026-08-27 - Fix CSP CDN Bypass Vulnerability
**Vulnerability:** Public CDN whitelisted in `script-src` directive
**Learning:** Whitelisting an entire public CDN (like `https://cdn.jsdelivr.net`) in the `script-src` directive of the Content-Security-Policy enables an attacker to load and execute malicious scripts. An attacker can upload a malicious package to the CDN, or find a gadget script already hosted on the CDN (e.g. angularjs) to execute arbitrary JavaScript, completely bypassing the CSP.
**Prevention:** Rely strictly on secure nonces or hashes for script execution, rather than whitelisting domains.
## 2026-08-28 - Secure Error Handling & Asset Proxy
**Vulnerability:** Unhandled exceptions in the top-level request handler and external proxy fetches could silently leak internal error details via default Cloudflare Worker error pages, and upstream 404s in the asset proxy were incorrectly returning 200 OK without security headers.
**Learning:** Cloudflare Workers implicitly return 500 errors if an unhandled promise rejection or error occurs in the `fetch` event listener, which drops our manually constructed `SECURITY_HEADERS`. Furthermore, a failed external fetch in `src/assets.js` would crash the request if unhandled, rather than returning a safe fallback.
**Prevention:** Always wrap the main `fetch` event handler in a global `try...catch` block that returns a generic 500 Internal Server Error explicitly configured with `SECURITY_HEADERS`. Ensure external proxy fetches also handle network failures securely, passing upstream HTTP status codes accurately.
## 2024-08-30 - DOM XSS & Security Header Hardening
**Vulnerability:** Use of insecure `innerHTML` for dynamic numeric text updates and missing CSP directives (`object-src 'none'`, `base-uri 'self'`) along with a missing `Permissions-Policy` header.
**Learning:** Even though the injected values were expected to be numeric (`toLocaleString()`), using `innerHTML` creates an unnecessary DOM XSS attack vector if the underlying data structure or logic changes in the future. Also, relying on a basic CSP without preventing base-tag hijacking or restricting unneeded features (like geolocation or camera access) leaves a larger attack surface than necessary.
**Prevention:** Default to using `textContent` for all text updates in the DOM, avoiding `innerHTML` completely unless explicitly rendering trusted HTML templates. Always include `object-src 'none'` and `base-uri 'self'` in the `Content-Security-Policy`, and configure a strict `Permissions-Policy` to disable unused browser capabilities by default.
## 2024-10-30 - DOM-based XSS via innerHTML in Leaderboard Rendering
**Vulnerability:** The dashboard rendered a countries leaderboard using string concatenation and `innerHTML` (`lbEl.innerHTML = leaderboardHtml;`), leading to a DOM-based Cross-Site Scripting (XSS) vulnerability. Although there was an `escapeHtml` function, rendering complex HTML structures with dynamic data via strings is error-prone and a common source of XSS.
**Learning:** Using `innerHTML` with dynamically constructed strings, even when attempting to escape user input, creates a significant risk of XSS. Small mistakes in the escaping logic or how attributes are quoted can lead to vulnerabilities.
**Prevention:** Avoid `innerHTML` entirely when constructing DOM elements with dynamic data. Instead, use standard DOM manipulation methods like `document.createElement()`, `textContent`, and `appendChild()` to build the HTML structure safely.
## 2026-09-03 - Unpinned External CDN Scripts without SRI
**Vulnerability:** External scripts loaded from a CDN (chart.js, chartjs-chart-geo) were unpinned to a specific patch version and did not have Subresource Integrity (SRI) hashes configured.
**Learning:** Depending on external unpinned libraries exposes the application to supply chain attacks. If the CDN is compromised or the package author pushes malicious code, the application will automatically execute the malicious script. SRI hashes ensure that the browser will refuse to execute the script if its contents have been altered from the expected baseline.
**Prevention:** Always pin external dependencies to exact, immutable versions. Calculate and append the `integrity` attribute containing the SHA-384 hash of the file along with `crossorigin="anonymous"` on all external `<script>` and `<link>` tags.
