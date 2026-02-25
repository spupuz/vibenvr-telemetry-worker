# VibeNVR Telemetry Worker

This module handles the ingestion of anonymous telemetry for VibeNVR and automatically generates an elegant Public Dashboard, **without exposing sensitive data or user IPs** (Privacy-First). It relies on the *Cloudflare Workers* Edge infrastructure to eliminate latency globally and *Analytics Engine* to store high-performance reporting.

## Key Features

1. **Secure Ingestion**: The backend (or VibeNVR frontend) makes a `GET` request to the `/telemetry.png` endpoint sending hardware and installation metrics. IP addresses are never sent or read; the country is deduced and aggregated on the fly at the Edge. At the end of the query, the server instantly responds with a transparent 1x1 micro-PNG pixel, optimizing bandwidth and reducing client-side parsing errors.
2. **Integrated Dashboard**: A visual Dashboard in *Dark Mode* style integrated natively (using *Chart.js* and *TailwindCSS*) and immediately available at the root `/` or on `/dashboard`.
3. **Private Aggregation API**: The Worker itself acts as a proxy (`/api/stats`), hiding sensitive API Keys from the client, to transform raw Cloudflare GraphQL queries into a JSON layout convenient for iterating the graphic dashboard.

## How to test and deploy

The commands make use of `wrangler`, the native CLI executable provided by Cloudflare for manipulating Workers.

1. Enter the project folder: 
```bash
cd vibenvr-telemetry-worker
```
2. Install minimal dependencies: 
```bash
npm install
```
3. Deploy to your Cloudflare account: 
```bash
npm run deploy
```
*(On first run, NPM/Wrangler will ask you to login using the browser interface of your Cloudflare account).*

## Security Configuration (Required for Dashboard)

For the visual `/dashboard` page to show charts without returning `API Credentials not configured` errors, you need to enable the worker to fetch and read its own analytical data by entering the `Account ID` and `API Token`. 

**These keys must NEVER be hard-coded into the file as plain text, but loaded as SECRET variables.**

1. From the Cloudflare web panel, go to your User Profile (top right) > **API Tokens** and create a token that strictly has the permissions: **Account > Account Analytics > Read**.
2. Extract your **Account ID** (found by scrolling down from the sidebar of any of your active domains on Cloudflare, or from your Cloudflare Dashboard URL).
3. From your PC console, inside the build folder, launch the secrets to load them onto CF servers:

```bash
npx wrangler secret put ACCOUNT_ID
# Paste your exact Account ID and press enter

npx wrangler secret put API_TOKEN
# Paste the newly generated API Token with Read Analytics permissions and press enter
```

Once the secrets are injected at the edge, refresh the page at `https://<your-worker-name>.<your-username>.workers.dev/dashboard` and the charts will come to life displaying live historical data.

## Linking the Worker to VibeNVR

In the base configuration files of the VibeNVR Cloud instance (or `docker-compose.yml` and `docker-compose.prod.yml`), update or set the environment variables targeted for this new Telemetry instance:

```env
CLOUDFLARE_TELEMETRY_URL=https://<your-worker-name>.<your-username>.workers.dev/telemetry.png
```

If this variable is not populated at runtime, the core backend will tend to fall back to the native pre-configured upstream fallback.
