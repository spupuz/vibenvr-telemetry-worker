## 2024-05-24 - Cloudflare Analytics Engine Caching
**Learning:** Cloudflare Analytics Engine SQL queries can become a performance bottleneck (and lead to rate limits) if queried synchronously on every dashboard visit. When returning JSON stats derived from multiple external queries, caching at the Cloudflare Edge using `caches.default.match()` and `caches.default.put()` combined with proper `Cache-Control` headers (e.g. `s-maxage=300`) significantly reduces API latency and duplicate expensive queries.
**Action:** When implementing dashboard APIs that aggregate multiple Analytics Engine queries, wrap the API handler using the Workers Cache API and add public caching headers to the response to leverage the Cloudflare Edge Cache.

## 2024-08-11 - Date.parse vs new Date().getTime()
**Learning:** `Date.parse(string)` is roughly 7x faster than `new Date(string).getTime()` in V8/Node.js, which is significant in data aggregation loops (like deduplicating large sets of database records).
**Action:** Always use `Date.parse()` when only the timestamp integer is needed from a date string, particularly in tight loops or data processing pipelines.

## 2024-11-20 - Redundant iterations on large Analytics API payloads
**Learning:** Returning multiple tens of thousands of rows from Cloudflare Analytics Engine in a worker and iterating over them with array methods leads to multiple redundant loops and object re-evaluations (like `Date.parse`). When operations like deduplication, filtering by recent dates, and caching values are split into multiple passes, CPU time heavily increases in the worker memory.
**Action:** Combine multiple array mapping/filtering iterations into a single `for...of` loop on large datasets, and cache expensive parsed values on the row objects directly to prevent recomputation.

## 2024-12-07 - Optimize Cloudflare API payload processing loops
**Learning:** Returning multiple JSON payloads from `Promise.all` in Cloudflare workers can create blocking operations and high memory limits if read sequentially as strings with `await res.text()` followed by synchronous `JSON.parse`. Similarly, mapping large datasets into temporary `Map()` objects just for filtering recent data (e.g. 24h stats) causes heavy garbage collection and overhead.
**Action:** Use `await Promise.all([res.json(), res.json()])` to leverage the worker native JSON streaming pipeline. Consolidate multiple analytic data iterations into a single deduplication loop on the primary dataset to avoid allocating temporary map and array objects, drastically speeding up Edge CPU time.
