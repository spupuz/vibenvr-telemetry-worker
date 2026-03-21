export const handleAssets = async (url) => {
	let target;
	if (url.pathname === '/assets/logo-dark') {
		target = 'https://raw.githubusercontent.com/spupuz/VibeNVR/main/frontend/public/vibe_logo_dark.png';
	} else if (url.pathname === '/assets/logo-light' || url.pathname === '/favicon.ico' || url.pathname === '/favicon.png') {
		target = 'https://raw.githubusercontent.com/spupuz/VibeNVR/main/docs/logo.png';
	}

	if (target) {
		const response = await fetch(target);
		const headers = new Headers(response.headers);
		headers.set('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
		// Remove GitHub cookies/identity headers
		headers.delete('set-cookie');
		headers.set('Access-Control-Allow-Origin', '*');
		return new Response(response.body, { headers });
	}
	return null;
};
