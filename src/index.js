import { getSecurityContext } from './security.js';
import { handleIngestion } from './ingest.js';
import { handleApiStats } from './api.js';
import { getDashboardHtml } from './dashboard.js';
import { handleAssets } from './assets.js';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Handle proxying under /telemetry prefix (e.g. vibenvr.org/telemetry)
		let prefix = '';
		if (url.pathname === '/telemetry' || url.pathname === '/telemetry/') {
			prefix = '/telemetry';
			url.pathname = '/';
		} else if (url.pathname.startsWith('/telemetry/')) {
			prefix = '/telemetry';
			url.pathname = url.pathname.replace(/^\/telemetry/, '');
		}

		// 0. Security Setup
		const { nonce, SECURITY_HEADERS } = getSecurityContext();

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					...SECURITY_HEADERS,
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Cache-Control': 'no-cache, no-store, must-revalidate',
				},
			});
		}

		// 1. TELEMETRY INGESTION ENDPOINT
		if (url.pathname === '/telemetry' || url.pathname === '/telemetry.png' || url.pathname === '/site-telemetry.png') {
			return handleIngestion(request, url, env, SECURITY_HEADERS);
		}

		// 2. DASHBOARD PUBLIC API
		if (url.pathname === '/api/stats') {
			if (request.method !== 'GET') {
				return new Response('Method Not Allowed', { status: 405, headers: SECURITY_HEADERS });
			}
			const cache = caches.default;
			const cachedResponse = await cache.match(request);
			if (cachedResponse) {
				return cachedResponse;
			}
			const response = await handleApiStats(env, SECURITY_HEADERS);
			if (response.status === 200) {
				// Clone the response so it can be cached and returned
				ctx.waitUntil(cache.put(request, response.clone()));
			}
			return response;
		}

		// 3. HTML DASHBOARD PAGE
		if (url.pathname === '/dashboard' || url.pathname === '/') {
			const htmlTemplate = getDashboardHtml(nonce, prefix);
			return new Response(htmlTemplate, {
				headers: {
					...SECURITY_HEADERS,
					'Content-Type': 'text/html;charset=UTF-8',
					'Cache-Control': 'no-cache, no-store, must-revalidate',
				},
			});
		}

		// Assets Proxy
		if (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.ico' || url.pathname === '/favicon.png') {
			const assetResponse = await handleAssets(url);
			if (assetResponse) return assetResponse;
		}

		// Fallback for unknown routes
		return new Response("Not Found", { status: 404 });
	},
};
