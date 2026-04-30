export const handleIngestion = async (request, url, env, SECURITY_HEADERS) => {
	const cleanStr = (val, max = 100) => (val || 'unknown').toString().trim().slice(0, max);
	const instance_id = cleanStr(url.searchParams.get('instance_id'), 128);
	const version = cleanStr(url.searchParams.get('version'), 20);
	const os = cleanStr(url.searchParams.get('os'), 20);
	const arch = cleanStr(url.searchParams.get('arch'), 20);
	const cpu_model = cleanStr(url.searchParams.get('cpu_model'), 100);

	if (url.pathname !== '/site-telemetry.png') {
		if (instance_id === 'unknown' || instance_id.length < 16) {
			return new Response("Invalid ID format", { status: 400, headers: SECURITY_HEADERS });
		}
	}

	const country = request.cf?.country || 'Unknown';

	const parseNum = (val) => {
		const n = parseInt(val || '0', 10);
		return isFinite(n) ? Math.max(0, n) : 0;
	};

	const cpu = parseNum(url.searchParams.get('cpu'));
	const ram = parseNum(url.searchParams.get('ram'));
	const cameras = parseNum(url.searchParams.get('cameras'));
	const groups = parseNum(url.searchParams.get('groups'));
	const events = parseNum(url.searchParams.get('events'));
	const motion_opencv = parseNum(url.searchParams.get('motion_opencv'));
	const motion_onvif = parseNum(url.searchParams.get('motion_onvif'));
	const motion_ai_engine = parseNum(url.searchParams.get('motion_ai_engine'));
	const motion_ai = parseNum(url.searchParams.get('motion_ai'));
	const onvif_count = parseNum(url.searchParams.get('onvif_count'));
	const substream_count = parseNum(url.searchParams.get('substream_count'));

	const gpu = (url.searchParams.get('gpu') === 'True' || url.searchParams.get('gpu') === 'true' || url.searchParams.get('gpu') === '1') ? 1 : 0;
	const notifications = (url.searchParams.get('notifications') === 'True' || url.searchParams.get('notifications') === 'true' || url.searchParams.get('notifications') === '1') ? 1 : 0;
	const mqtt_active = (url.searchParams.get('mqtt_active') === 'True' || url.searchParams.get('mqtt_active') === 'true' || url.searchParams.get('mqtt_active') === '1') ? 1 : 0;

	if (url.pathname === '/site-telemetry.png') {
		if (env.VIBENVR_SITE_USAGE) {
			const visitor_id = cleanStr(url.searchParams.get('visitor_id'), 128);
			const path = cleanStr(url.searchParams.get('path'), 200);

			if (visitor_id !== 'unknown' && visitor_id.length >= 8) {
				try {
					env.VIBENVR_SITE_USAGE.writeDataPoint({
						blobs: [ visitor_id, path, country ],
						indexes: [visitor_id]
					});

					if (env.VIBENVR_IDS) {
						const kvKey = `site_id:${visitor_id}`;
						const existing = await env.VIBENVR_IDS.get(kvKey);

						if (!existing) {
							await env.VIBENVR_IDS.put(kvKey, Date.now().toString());
							const countKey = 'site_stats:total_count';
							const currentTotal = parseInt(await env.VIBENVR_IDS.get(countKey) || "0", 10);
							await env.VIBENVR_IDS.put(countKey, (currentTotal + 1).toString());
						}

						const hitsKey = 'site_stats:total_hits';
						const currentHits = parseInt(await env.VIBENVR_IDS.get(hitsKey) || "0", 10);
						await env.VIBENVR_IDS.put(hitsKey, (currentHits + 1).toString());
					}
				} catch (e) {
					console.error("Failed to write to Site Analytics Engine/KV", e);
				}
			}
		}
	} else if (env.VIBENVR_USAGE) {
		try {
			env.VIBENVR_USAGE.writeDataPoint({
				blobs: [ instance_id, version, os, arch, cpu_model, country ],
				doubles: [ 
					cpu, ram, cameras, groups, events, gpu, notifications, 
					mqtt_active, motion_opencv, motion_onvif, motion_ai_engine,
					motion_ai, onvif_count, substream_count 
				],
				indexes: [instance_id]
			});
		} catch (e) {
			console.error("Failed to write to Analytics Engine", e);
		}
	}

	if (url.pathname !== '/site-telemetry.png' && env.VIBENVR_IDS && instance_id !== 'unknown') {
		try {
			const kvKey = `id:${instance_id}`;
			const existing = await env.VIBENVR_IDS.get(kvKey);
			if (!existing) {
				await env.VIBENVR_IDS.put(kvKey, Date.now().toString());
				const countKey = 'stats:total_count';
				const currentTotal = parseInt(await env.VIBENVR_IDS.get(countKey) || "0", 10);
				await env.VIBENVR_IDS.put(countKey, (currentTotal + 1).toString());
			}
		} catch (kvErr) {
			console.error("KV Storage Error:", kvErr);
		}
	}

	const transparentPos = new Uint8Array([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
		0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
		0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
		0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
		0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
	]);

	return new Response(transparentPos, {
		headers: {
			...SECURITY_HEADERS,
			'Content-Type': 'image/png',
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
		},
	});
};
