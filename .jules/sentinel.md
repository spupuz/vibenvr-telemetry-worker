## 2023-11-03 - Unnecessary Wildcard CORS
**Vulnerability:** Found `Access-Control-Allow-Origin: *` in `src/security.js` and `src/assets.js`.
**Learning:** The dashboard and `/api/stats` run on the same origin. Telemetry ingestion via `/telemetry.png` is embedded as a 1x1 image, bypassing the need for explicit CORS headers.
**Prevention:** Remove wildcard CORS headers from static security context when they provide no functional benefit, adhering to the principle of least privilege.
