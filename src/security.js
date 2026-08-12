export const getSecurityContext = () => {
	const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
	const SECURITY_HEADERS = {
		'Content-Security-Policy': `default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'nonce-${nonce}'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src https://fonts.gstatic.com; img-src 'self' https://github.com https://raw.githubusercontent.com data:; connect-src 'self' https://api.cloudflare.com https://cdn.jsdelivr.net https://api.github.com;`,
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Access-Control-Allow-Origin': '*',
	};
	return { nonce, SECURITY_HEADERS };
};
