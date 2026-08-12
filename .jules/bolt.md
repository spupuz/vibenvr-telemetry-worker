## 2024-05-24 - Cloudflare Analytics Engine Caching
**Learning:** Cloudflare Analytics Engine SQL queries can become a performance bottleneck (and lead to rate limits) if queried synchronously on every dashboard visit. When returning JSON stats derived from multiple external queries, caching at the Cloudflare Edge using `caches.default.match()` and `caches.default.put()` combined with proper `Cache-Control` headers (e.g. `s-maxage=300`) significantly reduces API latency and duplicate expensive queries.
**Action:** When implementing dashboard APIs that aggregate multiple Analytics Engine queries, wrap the API handler using the Workers Cache API and add public caching headers to the response to leverage the Cloudflare Edge Cache.

## 2024-08-11 - Date.parse vs new Date().getTime()
**Learning:** `Date.parse(string)` is roughly 7x faster than `new Date(string).getTime()` in V8/Node.js, which is significant in data aggregation loops (like deduplicating large sets of database records).
**Action:** Always use `Date.parse()` when only the timestamp integer is needed from a date string, particularly in tight loops or data processing pipelines.
