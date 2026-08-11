## 2024-08-11 - Date.parse vs new Date().getTime()
**Learning:** `Date.parse(string)` is roughly 7x faster than `new Date(string).getTime()` in V8/Node.js, which is significant in data aggregation loops (like deduplicating large sets of database records).
**Action:** Always use `Date.parse()` when only the timestamp integer is needed from a date string, particularly in tight loops or data processing pipelines.
