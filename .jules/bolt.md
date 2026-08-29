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

## 2024-12-19 - Concurrent Cloudflare KV Reads
**Learning:** Sequential calls to `env.NAMESPACE.get()` in a Cloudflare Worker block execution and accumulate network latency. Fetching 3 independent KV values sequentially means paying the network round-trip penalty 3 times.
**Action:** When reading multiple independent values from Cloudflare KV, always bundle them using `Promise.all()` to execute the network requests concurrently and reduce latency.

## 2024-12-24 - Non-blocking Telemetry Ingestion
**Learning:** Returning a fast tracking pixel response is critical to not hang the client's network stack. However, checking and updating Cloudflare KV (`await env.NAMESPACE.get/put`) on every telemetry hit was blocking the response, slowing down TTFB (Time To First Byte).
**Action:** When saving telemetry or hit counters, use `ctx.waitUntil()` to move blocking KV reads/writes into the background so the Worker can instantly return the `Response` to the client.

## 2024-12-25 - Avoid memory allocation inside hot request handlers
**Learning:** Instantiating static data structures (like a `Uint8Array` for a transparent tracking pixel) inside the request handler forces V8 to allocate memory and garbage collect it on every single request. For high-throughput endpoints, this creates unnecessary overhead.
**Action:** Move static data structures to the module scope (outside the request handler) to instantiate them once and reuse them across all requests.

## 2024-12-25 - Iterate directly over Map values
**Learning:** Using `Array.from(map.values())` creates an intermediate array before iteration, which can cause significant memory allocation and garbage collection overhead on large datasets. Iterating directly over `map.values()` is more efficient.
**Action:** When you only need to iterate over values in a `Map`, use `for (const value of map.values())` instead of creating an array first.

## 2024-12-25 - Prevent Duplicate Fetch and Parsing
**Learning:** Initializing multiple components (like identical data charts) with their own independent `fetch` requests can lead to redundant network traffic and repeated JSON/GeoJSON parsing.
**Action:** When multiple independent parts of the dashboard require the exact same external resource, fetch and parse it once, and place initialization logic for all dependent components within the same resolution block (or store the promise). This reduces duplicate fetching, JSON parsing overhead, and heavy object computation like `ChartGeo.topojson.feature()`.

## 2024-05-24 - Optimize concurrent JSON parsing
**Learning:** In Cloudflare Workers, awaiting all fetches in `Promise.all` before parsing their responses sequentially blocks the event loop and increases time-to-first-byte (TTFB), especially with large JSON payloads.
**Action:** Chain `.then(res => res.json())` directly onto fetch calls within `Promise.all` to begin parsing JSON streams concurrently as each response arrives.

## 2024-12-25 - Combine multiple aggregate queries
**Learning:** Cloudflare Analytics Engine supports combining multiple aggregate selections (e.g. `count(DISTINCT x)`, `count()`) into a single SQL query on the same dataset. Running them as separate concurrent network requests creates unnecessary edge latency and consumes more API connections.
**Action:** When querying the exact same table and time range for multiple aggregate metrics, always combine them into a single `SELECT count(DISTINCT X), count()` statement to reduce the number of fetch requests to the Analytics Engine.

## 2025-02-23 - Prevent Duplicate Fetching in Render Loops
**Learning:** Placing independent fetch calls (e.g., getting map data or GitHub stars) inside rendering functions (like `renderChartsIfReady()`) that fire on UI state changes (like toggling themes) will trigger redundant requests and heavy parsing. Additionally, trying to `if/else` cache the resolved data rather than caching the `Promise` itself can result in race conditions where the fetch is fired again before the first one completes.
**Action:** Always move static, one-time external fetch calls outside of render functions (e.g., to the root scope or a `useEffect` equivalent). For complex payloads like TopoJSON, cache the `Promise` itself so multiple consumers can simply `.then()` it without worrying about race conditions.
