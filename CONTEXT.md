# VibeNVR Telemetry Worker - Context

This document analyzes and describes the technical architecture and data flows of the Cloudflare Worker-based telemetry module for the VibeNVR project.

## Project Scope
The project implements a fast and cost-effective edge-based serverless service in order to:
1. **Collect installation and usage data** completely anonymously from active VibeNVR instances around the world.
2. **Provide a secure and internal API** (`/api/stats`) to query the data by dynamically interrogating the Cloudflare time-series database (Analytics Engine).
3. **Display a public Dashboard** accessible from the browser (route `/dashboard` or `/`) generated in HTML, styled with Tailwind and graphed using Chart.js to consult top KPIs and the hardware distribution of VibeNVR.

## Data Flow and Endpoints

The main file `src/index.js` handles routes via the `fetch(request, env, ctx)` block typical of Cloudflare Workers.

### 1. Data Ingestion (`/telemetry` or `/telemetry.png`)
When a VibeNVR instance starts or forwards a regular ping, it makes a `GET` request to this endpoint passing basic information in the querystring:
- `instance_id`, `version`, `os`, `arch`, `cpu`, `ram`, `cameras`, `groups`, `events`, `gpu`, `notifications`.
- **Privacy First**: No user IP addresses or specific paths are ever stored or tracked.
- **Edge Geolocation**: The country of origin is silently deduced and grouped via internal headers exposed to Workers (`request.cf.country`).
- **Data Persistence**: These query params are saved by formatting them onto `env.VIBENVR_USAGE.writeDataPoint(...)` of the Analytics Engine (identified with the `vibenvr_telemetry_events` dataset).
- **Fallback Response**: Instantly terminates execution returning a 1x1 transparent PNG image (`transparentPos`), convenient as it is invisible, lightweight, and natively compatible with normal HTTP parsers of almost all languages, avoiding blocking CORS errors, complex logic, or unnecessary bodies.

### 2. Private Proxy APIs (`/api/stats`)
A route designed for backend use to hide precious API-Keys and Cloudflare Secrets from public visitors of the dashboard.
- Makes GraphQL queries to `https://api.cloudflare.com/client/v4/graphql`.
- Retrieves: active installations (last 7 days via the `datetime_geq` time condition), historical total installations, prevalent Countries, Versions, and CPU architectures.
- Requires proper configuration of secret server variables: `env.ACCOUNT_ID` and `env.API_TOKEN`.
- Returns a compressed JSON file that the frontend will inject into Chart.js.

### 3. HTML Dashboard (`/dashboard` or `/`)
Responds with plain text HTML to render a very lightweight and minimal *Single Page Application*.
- Uses **TailwindCSS** from CDN to limit the size of the generated bundle and style the page instantly in Dark Mode (`dark` class on the html element).
- Uses **Chart.js** for dynamic Pie and horizontal/vertical Bar charts.
- Makes a single `fetch()` on the client to its own Worker at the `/api/stats` route, populating the KPIs and rendering the map instantly without making the initial DOM parser wait.

## Architectural Stack and Technologies
- **Cloudflare Workers (Edge Computing)**: Global serverless platform in Node.js (V8 Isolate) to minimize cold starts, slashing latency for geographically distributed data storage.
- **Cloudflare Analytics Engine**: Extremely high-performance column-based data warehouse for time-series that accepts datapoints divided by `blobs`, `doubles` vectors, or indexed via `indexes`. It does not apply strict schema constraints and costs a fraction of a cent compared to equivalent relational DBs.
- **JS ESModules**: The package makes direct use of standard ECMAScript module exports and performs setup via `npm`/`wrangler`.
- **Wrangler**: The official Cloudflare CLI defined in the `devDependencies` of the `package.json` file, used for local development (`wrangler dev`) and staging/production (`wrangler deploy`).
