// ⚡ Bolt: Hoist constants to module scope to avoid reallocating on every request
const SAFE_UPSTREAM_HEADERS = ['content-length', 'etag', 'last-modified'];
const SAFE_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="vibeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4ADE80"/>
      <stop offset="50%" style="stop-color:#22D3EE"/>
      <stop offset="100%" style="stop-color:#6366F1"/>
    </linearGradient>
  </defs>
  <path d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z" fill="none" stroke="url(#vibeGradient)" stroke-width="2"/>
  <ellipse cx="32" cy="32" rx="18" ry="12" fill="none" stroke="url(#vibeGradient)" stroke-width="2"/>
  <circle cx="32" cy="32" r="8" fill="none" stroke="url(#vibeGradient)" stroke-width="2"/>
  <path d="M28 28 L32 38 L36 28" fill="none" stroke="url(#vibeGradient)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const handleAssets = async (url, SECURITY_HEADERS) => {
	if (url.pathname === '/favicon.svg') {
		return new Response(FAVICON_SVG, {
			status: 200,
			headers: {
				...(SECURITY_HEADERS || {}),
				'Content-Type': 'image/svg+xml;charset=UTF-8',
				'Cache-Control': 'public, max-age=604800',
			},
		});
	}

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
			// ⚡ Bolt: Use .indexOf() and .substring() instead of .split() to prevent array allocation overhead
			const rawContentType = response.headers.get('content-type') || '';
			const semicolonIndex = rawContentType.indexOf(';');
			const upstreamContentType = (semicolonIndex !== -1 ? rawContentType.substring(0, semicolonIndex) : rawContentType).trim().toLowerCase();

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
