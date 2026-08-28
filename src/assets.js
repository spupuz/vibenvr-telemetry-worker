export const handleAssets = async (url, SECURITY_HEADERS) => {
	let target;
	if (url.pathname === '/assets/logo-dark') {
		target = 'https://raw.githubusercontent.com/spupuz/VibeNVR/main/frontend/public/vibe_logo_dark.png';
	} else if (url.pathname === '/assets/logo-light' || url.pathname === '/favicon.ico' || url.pathname === '/favicon.png') {
		target = 'https://raw.githubusercontent.com/spupuz/VibeNVR/main/docs/logo.png';
	}

	if (target) {
		try {
			const response = await fetch(target);
			const headers = new Headers(response.headers);
			headers.set('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
			// Remove GitHub cookies/identity headers
			headers.delete('set-cookie');
			// Apply Sentinel Security Headers to proxied assets
			if (SECURITY_HEADERS) {
				for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
					headers.set(key, value);
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
					'Content-Type': 'text/plain'
				}
			});
		}
	}
	return null;
};
