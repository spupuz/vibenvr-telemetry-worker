// ⚡ Bolt: Hoist constants to module scope to avoid reallocating on every request
const SAFE_UPSTREAM_HEADERS = ['content-length', 'etag', 'last-modified'];
const SAFE_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];

export const handleAssets = async (url, SECURITY_HEADERS) => {
	let target;
	if (url.pathname === '/assets/logo-dark') {
		target = 'https://raw.githubusercontent.com/spupuz/VibeNVR/main/frontend/public/vibe_logo_dark.png';
	} else if (url.pathname === '/assets/logo-light' || url.pathname === '/favicon.ico' || url.pathname === '/favicon.png') {
		target = 'https://raw.githubusercontent.com/spupuz/VibeNVR/main/docs/logo.png';
	}

	if (target) {
		try {
			const response = await fetch(target, {
				signal: AbortSignal.timeout(10000),
				redirect: "error",
				credentials: "omit"
			});

			// 🛡️ Sentinel: Whitelist only safe upstream headers to prevent header
			// injection / open-redirect / SSRF via spoofed upstream responses
			// (e.g. Location, WWW-Authenticate, Content-Disposition, Set-Cookie).
			const headers = new Headers();

			// Sentinel: Validate upstream Content-Type against a strict image allowlist
			const upstreamContentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
			if (upstreamContentType && SAFE_CONTENT_TYPES.includes(upstreamContentType)) {
				headers.set('content-type', upstreamContentType);
			} else {
				headers.set('content-type', 'application/octet-stream');
			}

			for (const h of SAFE_UPSTREAM_HEADERS) {
				const v = response.headers.get(h);
				if (v) headers.set(h, v);
			}

			if (response.ok) {
				headers.set('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
			} else {
				headers.set('Cache-Control', 'no-store, no-cache, must-revalidate'); // Do not cache upstream errors
			}
			// Apply Sentinel Security Headers to proxied assets
			if (SECURITY_HEADERS) {
				// ⚡ Bolt: Use for...in instead of Object.entries() to avoid intermediate array allocations
				for (const key in SECURITY_HEADERS) {
					if (Object.hasOwn(SECURITY_HEADERS, key)) {
						headers.set(key, SECURITY_HEADERS[key]);
					}
				}
			} else {
				headers.set('Access-Control-Allow-Origin', '*');
			}
			return new Response(response.body, { status: response.status, headers });
		} catch (error) {
			console.error("Asset Proxy Error:", error);
			// 🛡️ Sentinel: Secure fallback if external proxy target fails
			return new Response("Asset Unavailable", {
				status: 502,
				headers: {
					...(SECURITY_HEADERS || {}),
					'Content-Type': 'text/plain;charset=UTF-8',
					'Cache-Control': 'no-store, no-cache, must-revalidate'
				}
			});
		}
	}
	return null;
};
