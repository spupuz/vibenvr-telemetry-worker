const STATIC_SECURITY_HEADERS = {
	'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src https://fonts.gstatic.com https://cdn.jsdelivr.net https://frontend-cdn.perplexity.ai; img-src 'self' https://github.com https://raw.githubusercontent.com data:; connect-src 'self' https://api.cloudflare.com https://cdn.jsdelivr.net https://api.github.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none';`,
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Access-Control-Allow-Origin': '*',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
};

export const getSecurityContext = (isHtml = true) => {
	if (!isHtml) {
		return { nonce: null, SECURITY_HEADERS: STATIC_SECURITY_HEADERS };
	}
	const nonce = btoa(crypto.randomUUID());
	const SECURITY_HEADERS = {
		'Content-Security-Policy': `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src https://fonts.gstatic.com https://cdn.jsdelivr.net https://frontend-cdn.perplexity.ai; img-src 'self' https://github.com https://raw.githubusercontent.com data:; connect-src 'self' https://api.cloudflare.com https://cdn.jsdelivr.net https://api.github.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none';`,
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Access-Control-Allow-Origin': '*',
		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
		'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
		'Cross-Origin-Opener-Policy': 'same-origin',
	};
	return { nonce, SECURITY_HEADERS };
};
