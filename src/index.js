export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				},
			});
		}

		// 1. TELEMETRY INGESTION ENDPOINT
		if (url.pathname === '/telemetry' || url.pathname === '/telemetry.png') {
			// 1. Sanitize and trim string inputs to prevent malicious payloads or spam
			const cleanStr = (val, max = 100) => (val || 'unknown').toString().trim().slice(0, max);

			const instance_id = cleanStr(url.searchParams.get('instance_id'));
			const version = cleanStr(url.searchParams.get('version'));
			const os = cleanStr(url.searchParams.get('os'));
			const arch = cleanStr(url.searchParams.get('arch'));
			const cpu_model = cleanStr(url.searchParams.get('cpu_model'));

			// Extract country gracefully from Cloudflare headers (No IPs saved!)
			const country = request.cf?.country || 'Unknown';

			// Parse and validate numbers rigorously
			const parseNum = (val) => {
				const n = parseInt(val || '0', 10);
				return isFinite(n) ? Math.max(0, n) : 0;
			};

			const cpu = parseNum(url.searchParams.get('cpu'));
			const ram = parseNum(url.searchParams.get('ram'));
			const cameras = parseNum(url.searchParams.get('cameras'));
			const groups = parseNum(url.searchParams.get('groups'));
			const events = parseNum(url.searchParams.get('events'));

			// Parse booleans (Python sends 'True' or 'False' as strings or 1/0)
			const gpu = (url.searchParams.get('gpu') === 'True' || url.searchParams.get('gpu') === 'true' || url.searchParams.get('gpu') === '1') ? 1 : 0;
			const notifications = (url.searchParams.get('notifications') === 'True' || url.searchParams.get('notifications') === 'true' || url.searchParams.get('notifications') === '1') ? 1 : 0;

			// Write to Analytics Engine securely
			if (env.VIBENVR_USAGE) {
				try {
					env.VIBENVR_USAGE.writeDataPoint({
						blobs: [
							instance_id, // blob1
							version,     // blob2
							os,          // blob3
							arch,        // blob4
							cpu_model,   // blob5
							country      // blob6
						],
						doubles: [
							cpu,           // double1
							ram,           // double2
							cameras,       // double3
							groups,        // double4
							events,        // double5
							gpu,           // double6
							notifications  // double7
						],
						indexes: [instance_id] // used for quick lookup/aggregation by instance
					});
				} catch (e) {
					console.error("Failed to write to Analytics Engine", e);
				}
			}

			// Return 1x1 transparent PNG simulating a tracker pixel
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
					'Content-Type': 'image/png',
					'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
					'Access-Control-Allow-Origin': '*',
				},
			});
		}

		// 2. DASHBOARD PUBLIC API (Reads data via SQL securely server-side)
		if (url.pathname === '/api/stats') {
			if (!env.ACCOUNT_ID || !env.API_TOKEN) {
				return new Response(JSON.stringify({ error: "Cloudflare API credentials not configured." }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Query 1: Active instances and their latest properties (Last 7 Days)
			const sqlActive = `
				SELECT 
					blob1 as instance_id, 
					blob2 as version, 
					blob3 as os,
					blob4 as arch,
					blob6 as country, 
					blob5 as cpu,
					max(double1) as cpu_cores,
					max(double2) as ram,
					max(double3) as cameras,
					max(double4) as groups,
					max(double5) as events,
					max(double6) as gpu,
					max(double7) as notifications
				FROM vibenvr_telemetry_events 
				WHERE timestamp >= NOW() - INTERVAL '7' DAY 
				GROUP BY blob1, blob2, blob3, blob4, blob6, blob5
			`;

			const sqlTotal = `SELECT count(DISTINCT blob1) as total FROM vibenvr_telemetry_events`;

			try {
				const [resActive, resTotal] = await Promise.all([
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlActive
					}),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlTotal
					})
				]);

				const activeStr = await resActive.text();
				const totalStr = await resTotal.text();

				if (!resActive.ok) throw new Error("SQL API Error: " + activeStr);

				const activeData = JSON.parse(activeStr).data || [];
				const totalData = JSON.parse(totalStr).data || [];

				let activeCount = activeData.length;
				const totalCount = parseInt(totalData[0]?.total || "0", 10);

				// Deduplicate instances: pick the best record for each ID
				const uniqueInstances = new Map();
				for (const row of activeData) {
					const id = row.instance_id;
					const existing = uniqueInstances.get(id);

					// Logic to pick the record with more metadata (prefer identified CPU)
					const hasCpu = row.cpu && row.cpu !== 'unknown';
					const existingHasCpu = existing && existing.cpu && existing.cpu !== 'unknown';

					if (!existing || (!existingHasCpu && hasCpu)) {
						uniqueInstances.set(id, row);
					}
				}

				const deduplicatedData = Array.from(uniqueInstances.values());
				activeCount = deduplicatedData.length;

				const stats = {
					active_installs: activeCount,
					total_installs: Math.max(activeCount, totalCount),
					versions: [],
					countries: [],
					cpus: [],
					os: [],
					arch: [],
					ram: [],
					total_cameras: 0,
					total_groups: 0,
					total_events: 0,
					gpu_enabled: 0,
					notifications_enabled: 0,
				};

				const versionCounts = {};
				const countryCounts = {};
				const cpuModelCounts = {};
				const cpuCoresCounts = {};
				const osCounts = {};
				const archCounts = {};
				const ramCounts = {};

				for (const row of deduplicatedData) {
					// Aggregations
					const v = row.version || 'unknown';
					versionCounts[v] = (versionCounts[v] || 0) + 1;

					const c = row.country || 'Unknown';
					countryCounts[c] = (countryCounts[c] || 0) + 1;

					const o = row.os || 'Unknown';
					osCounts[o] = (osCounts[o] || 0) + 1;

					const a = row.arch || 'Unknown';
					archCounts[a] = (archCounts[a] || 0) + 1;

					const r = row.ram ? `${row.ram} GB` : 'Unknown';
					ramCounts[r] = (ramCounts[r] || 0) + 1;

					// CPU model (commercial name, blob5)
					const modelName = row.cpu && row.cpu !== 'unknown' && row.cpu !== '' ? row.cpu : null;
					if (modelName) cpuModelCounts[modelName] = (cpuModelCounts[modelName] || 0) + 1;
					// CPU cores (double1)
					const coresLabel = row.cpu_cores ? row.cpu_cores + ' Cores' : 'Unknown';
					cpuCoresCounts[coresLabel] = (cpuCoresCounts[coresLabel] || 0) + 1;

					stats.total_cameras += Number(row.cameras) || 0;
					stats.total_groups += Number(row.groups) || 0;
					stats.total_events += Number(row.events) || 0;
					if (Number(row.gpu) > 0) stats.gpu_enabled++;
					if (Number(row.notifications) > 0) stats.notifications_enabled++;

					// Cameras distribution bucket
					const nc = Number(row.cameras) || 0;
					const bk = nc === 0 ? '0' : nc === 1 ? '1' : nc <= 3 ? '2-3' : nc <= 5 ? '4-5' : nc <= 10 ? '6-10' : nc <= 20 ? '11-20' : '21+';
					if (!stats.cameras_dist) stats.cameras_dist = {};
					stats.cameras_dist[bk] = (stats.cameras_dist[bk] || 0) + 1;

					// Groups distribution bucket
					const ng = Number(row.groups) || 0;
					const gbk = ng === 0 ? '0' : ng === 1 ? '1' : ng <= 3 ? '2-3' : ng <= 5 ? '4-5' : ng <= 10 ? '6-10' : '11+';
					if (!stats.groups_dist) stats.groups_dist = {};
					stats.groups_dist[gbk] = (stats.groups_dist[gbk] || 0) + 1;
				}

				stats.versions = Object.entries(versionCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.countries = Object.entries(countryCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.cpu_models = Object.entries(cpuModelCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.cpu_cores = Object.entries(cpuCoresCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.os = Object.entries(osCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.arch = Object.entries(archCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.ram = Object.entries(ramCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				// Normalise cameras_dist to ordered array
				const bkOrder = ['0', '1', '2-3', '4-5', '6-10', '11-20', '21+'];
				stats.cameras_dist = bkOrder
					.filter(k => stats.cameras_dist && stats.cameras_dist[k])
					.map(k => ({ name: k, count: stats.cameras_dist[k] }));
				// Normalise groups_dist to ordered array
				const gbkOrder = ['0', '1', '2-3', '4-5', '6-10', '11+'];
				stats.groups_dist = gbkOrder
					.filter(k => stats.groups_dist && stats.groups_dist[k])
					.map(k => ({ name: k, count: stats.groups_dist[k] }));

				return new Response(JSON.stringify(stats), {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					}
				});
			} catch (err) {
				// Generic error message to avoid leaking internal system details
				console.error("Dashboard API Error:", err);
				return new Response(JSON.stringify({ error: "Internal Server Error" }), {
					status: 500,
					headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
				});
			}
		}

		// 3. HTML DASHBOARD PAGE
		if (url.pathname === '/dashboard' || url.pathname === '/') {
			const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>VibeNVR Telemetry</title>
	<link rel="icon" type="image/png" href="https://github.com/spupuz/VibeNVR/blob/main/docs/logo.png?raw=true">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
	<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/chartjs-chart-geo@4/build/index.umd.min.js"></script>
	<style>
		*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

		/* === TOKENS === */
		:root {
			--bg: #f4f6fb;
			--surface: #ffffff;
			--surface2: #f0f2f8;
			--border: #e2e6f0;
			--text: #111827;
			--text-muted: #6b7280;
			--primary: #3b82f6;
			--primary-light: #eff6ff;
			--primary-dark: #1d4ed8;
			--accent: #8b5cf6;
			--success: #10b981;
			--radius: 12px;
			--shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.05);
		}
		.dark {
			--bg: #0d1117;
			--surface: #161b22;
			--surface2: #1c2330;
			--border: #21262d;
			--text: #e6edf3;
			--text-muted: #7d8590;
			--primary: #58a6ff;
			--primary-light: rgba(88,166,255,.1);
			--primary-dark: #1f6feb;
			--shadow: 0 1px 4px rgba(0,0,0,.3), 0 4px 16px rgba(0,0,0,.25);
		}

		body {
			font-family: 'Inter', sans-serif;
			background: var(--bg);
			color: var(--text);
			min-height: 100vh;
			transition: background .25s, color .25s;
		}

		/* === LAYOUT === */
		.topbar {
			position: sticky;
			top: 0;
			z-index: 100;
			background: var(--surface);
			border-bottom: 1px solid var(--border);
			padding: 0 1.5rem;
			height: 56px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
			backdrop-filter: blur(8px);
		}
		.topbar-brand {
			display: flex;
			align-items: center;
			gap: .6rem;
			text-decoration: none;
			color: var(--text);
		}
		.topbar-brand img {
			height: 30px;
			width: auto;
		}
		.topbar-brand span {
			font-weight: 700;
			font-size: 1rem;
			letter-spacing: -.01em;
		}
		.topbar-right {
			display: flex;
			align-items: center;
			gap: .75rem;
		}
		.badge-live {
			display: inline-flex;
			align-items: center;
			gap: .4rem;
			font-size: .7rem;
			font-weight: 600;
			color: var(--success);
			background: rgba(16,185,129,.1);
			border: 1px solid rgba(16,185,129,.25);
			padding: .25rem .65rem;
			border-radius: 99px;
			letter-spacing: .03em;
			text-transform: uppercase;
		}
		.badge-live .dot {
			width: 6px; height: 6px;
			border-radius: 50%;
			background: var(--success);
			animation: pulse 2s infinite;
		}
		@keyframes pulse {
			0%,100% { opacity: 1; }
			50% { opacity: .4; }
		}
		.theme-btn {
			cursor: pointer;
			border: 1px solid var(--border);
			background: var(--surface2);
			border-radius: 99px;
			height: 34px;
			padding: 0 .9rem;
			display: inline-flex; align-items: center; gap: .4rem;
			color: var(--text-muted);
			font-size: .78rem;
			font-weight: 500;
			transition: all .2s;
			white-space: nowrap;
		}
		.theme-btn:hover { color: var(--primary); border-color: var(--primary); background: var(--primary-light); }

		.main { padding: 1.5rem; max-width: 1320px; margin: 0 auto; }

		.page-title {
			margin-bottom: 1.5rem;
		}
		.page-title h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -.02em; }
		.page-title p { color: var(--text-muted); font-size: .85rem; margin-top: .25rem; }

		/* === CARDS === */
		.card {
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: var(--radius);
			padding: 1.2rem 1.4rem;
			box-shadow: var(--shadow);
			transition: border-color .2s, box-shadow .2s;
		}
		.card:hover { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light), var(--shadow); }

		/* === KPI GRID === */
		.kpi-grid {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 1rem;
			margin-bottom: 1.5rem;
		}
		@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
		@media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } }
		.kpi-card {
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: var(--radius);
			padding: 1.1rem 1.25rem;
			box-shadow: var(--shadow);
			transition: border-color .2s;
			position: relative;
			overflow: hidden;
		}
		.kpi-card::before {
			content: '';
			position: absolute;
			top: 0; left: 0; right: 0;
			height: 3px;
			background: linear-gradient(90deg, var(--primary), var(--accent));
			opacity: 0;
			transition: opacity .2s;
		}
		.kpi-card:hover::before { opacity: 1; }
		.kpi-card:hover { border-color: var(--primary); }
		.kpi-label {
			font-size: .72rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: .06em;
			margin-bottom: .55rem;
			display: flex; align-items: center; gap: .5rem;
		}
		.kpi-label svg {
			stroke: var(--primary);
			filter: drop-shadow(0 0 2px var(--primary-light));
		}
		.kpi-value {
			font-size: 2.2rem;
			font-weight: 800;
			color: var(--text);
			line-height: 1;
			letter-spacing: -.02em;
		}
		.kpi-value.accent { color: var(--primary); }
		.kpi-sub { font-size: .72rem; color: var(--text-muted); margin-top: .4rem; }

		/* === CHART GRID === */
		.chart-row { display: grid; gap: 1rem; margin-bottom: 1rem; }
		.chart-row.cols-3 { grid-template-columns: repeat(3, 1fr); }
		.chart-row.cols-2 { grid-template-columns: repeat(2, 1fr); }
		.chart-row.cols-1 { grid-template-columns: 1fr; }
		.chart-title { 
			font-size: .875rem; 
			font-weight: 600; 
			color: var(--text); 
			margin-bottom: 1rem;
			display: flex;
			align-items: center;
			gap: .6rem;
		}
		.chart-title svg {
			stroke: var(--primary);
			filter: drop-shadow(0 0 2px var(--primary-light));
		}
		.chart-wrap { position: relative; height: 220px; }
		.chart-wrap.tall { height: 260px; }

		/* === STATES === */
		.state-box {
			display: flex; flex-direction: column;
			align-items: center; justify-content: center;
			min-height: 300px; gap: 1rem;
			color: var(--text-muted);
		}
		.spinner {
			width: 40px; height: 40px;
			border-radius: 50%;
			border: 3px solid var(--border);
			border-top-color: var(--primary);
			animation: spin .8s linear infinite;
		}
		@keyframes spin { to { transform: rotate(360deg); } }
		.err-box {
			display: none;
			background: rgba(239,68,68,.08);
			border: 1px solid rgba(239,68,68,.3);
			color: #ef4444;
			border-radius: var(--radius);
			padding: 1rem 1.25rem;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
			margin-bottom: 1.5rem;
		}
		.retry-btn {
			cursor: pointer;
			border: 1px solid rgba(239,68,68,.4);
			background: transparent;
			border-radius: 8px;
			padding: .3rem .8rem;
			color: #ef4444;
			font-size: .8rem;
			white-space: nowrap;
			transition: background .2s;
		}
		.retry-btn:hover { background: rgba(239,68,68,.1); }

		.footer {
			text-align: center;
			padding: 2rem 1rem;
			font-size: .75rem;
			color: var(--text-muted);
			border-top: 1px solid var(--border);
			margin-top: 1.5rem;
		}

		@media (max-width: 900px) {
			.chart-row.cols-3 { grid-template-columns: repeat(2, 1fr); }
		}
		@media (max-width: 600px) {
			.chart-row.cols-3, .chart-row.cols-2 { grid-template-columns: 1fr; }
			.kpi-grid { grid-template-columns: repeat(2, 1fr); }
		}
	</style>
</head>
<body>

<!-- TOP BAR -->
<header class="topbar">
	<a class="topbar-brand" href="https://github.com/spupuz/VibeNVR" target="_blank" rel="noopener">
		<img id="logo-img" src="https://github.com/spupuz/VibeNVR/blob/main/frontend/public/vibe_logo_dark.png?raw=true" alt="VibeNVR">
		<span>Telemetry</span>
	</a>
	<div class="topbar-right">
		<div class="badge-live"><span class="dot"></span> Live</div>
		<button class="theme-btn" id="theme-toggle" title="Toggle theme" onclick="toggleTheme()">
			<svg id="icon-sun" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
			<svg id="icon-moon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
			<span id="theme-label">Dark Mode</span>
		</button>
	</div>
</header>

<!-- MAIN CONTENT -->
<main class="main">
	<div class="page-title">
		<h1>Usage Dashboard</h1>
		<p>Anonymous aggregate statistics from active VibeNVR installations · Last 7 days</p>
	</div>

	<!-- Error -->
	<div class="err-box" id="error-msg">
		<span>Failed to load telemetry data. Check Cloudflare API credentials.</span>
		<button class="retry-btn" onclick="fetchStats()">Retry</button>
	</div>

	<!-- Loading -->
	<div class="state-box" id="loader">
		<div class="spinner"></div>
		<span>Loading telemetry…</span>
	</div>

	<!-- Dashboard -->
	<div id="dashboard" style="display:none">

		<!-- KPIs -->
		<div class="kpi-grid">
			<div class="kpi-card">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Active Installs</div>
				<div class="kpi-value accent" id="kpi-active">-</div>
				<div class="kpi-sub">Last 7 days</div>
			</div>
			<div class="kpi-card">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> Total Installs</div>
				<div class="kpi-value" id="kpi-total">-</div>
				<div class="kpi-sub">All time distinct</div>
			</div>
			<div class="kpi-card">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> Cameras</div>
				<div class="kpi-value" id="kpi-cameras">-</div>
				<div class="kpi-sub">Managed across active</div>
			</div>
			<div class="kpi-card">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Events</div>
				<div class="kpi-value" id="kpi-events">-</div>
				<div class="kpi-sub">Recordings / Detections</div>
			</div>
			<div class="kpi-card">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg> Groups</div>
				<div class="kpi-value" id="kpi-groups">-</div>
				<div class="kpi-sub">Camera groups</div>
			</div>
			<div class="kpi-card">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M15 2v2"/><path d="M9 2v2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M15 20v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/></svg> GPU Accel</div>
				<div class="kpi-value" id="kpi-gpu">-</div>
				<div class="kpi-sub">HW accel enabled</div>
			</div>
			<div class="kpi-card" style="border-color: var(--primary);">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg> Notifications</div>
				<div class="kpi-value accent" id="kpi-notifications">-</div>
				<div class="kpi-sub">With webhooks / email</div>
			</div>
		</div>

		<!-- Row 0: World Map (full width) -->
		<div class="chart-row cols-1">
			<div class="card">
				<div class="chart-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> Installations by Country</div>
				<div class="chart-wrap" style="height:340px"><canvas id="chart-worldmap"></canvas></div>
			</div>
		</div>

		<!-- Row 1: Cameras + Groups distribution -->
		<div class="chart-row cols-2">
			<div class="card">
				<div class="chart-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> Cameras per Instance</div>
				<div class="chart-wrap"><canvas id="chart-cameras-dist"></canvas></div>
			</div>
			<div class="card">
				<div class="chart-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg> Groups per Instance</div>
				<div class="chart-wrap"><canvas id="chart-groups-dist"></canvas></div>
			</div>
		</div>

		<!-- Row 2: Versions + RAM -->
		<div class="chart-row cols-2">
			<div class="card">
				<div class="chart-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg> Active Versions</div>
				<div class="chart-wrap"><canvas id="chart-versions"></canvas></div>
			</div>
			<div class="card">
				<div class="chart-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg> RAM Capacity</div>
				<div class="chart-wrap"><canvas id="chart-ram"></canvas></div>
			</div>
		</div>

		<!-- Row 3: CPU Models + CPU Cores -->
		<div class="chart-row cols-2">
			<div class="card">
				<div class="chart-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M15 2v2"/><path d="M9 2v2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M15 20v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/></svg> CPU Models</div>
				<div class="chart-wrap tall"><canvas id="chart-cpu-models"></canvas></div>
			</div>
			<div class="card">
				<div class="chart-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M15 2v2"/><path d="M9 2v2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M15 20v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/></svg> CPU Core Counts</div>
				<div class="chart-wrap tall"><canvas id="chart-cpu-cores"></canvas></div>
			</div>
		</div>

		<!-- Row 4: Host OS + CPU Architecture (less-variable metrics) -->
		<div class="chart-row cols-2">
			<div class="card">
				<div class="chart-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Host OS</div>
				<div class="chart-wrap"><canvas id="chart-os"></canvas></div>
			</div>
			<div class="card">
				<div class="chart-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg> CPU Architecture</div>
				<div class="chart-wrap"><canvas id="chart-arch"></canvas></div>
			</div>
		</div>

		<footer class="footer">
			Powered by Cloudflare Workers Analytics Engine · No IP addresses or personal data stored ·
			All metrics are anonymous aggregate counts
		</footer>
	</div>
</main>

<script>
	// ─── STATE (declared before IIFE to avoid TDZ) ───────────────────────────
	let charts = {};
	let lastData = null;

	// ─── THEME ───────────────────────────────────────────────────────────────
	const LOGO_DARK  = 'https://github.com/spupuz/VibeNVR/blob/main/frontend/public/vibe_logo_dark.png?raw=true';
	const LOGO_LIGHT = 'https://github.com/spupuz/VibeNVR/blob/main/docs/logo.png?raw=true';

	function applyTheme(dark) {
		document.documentElement.classList.toggle('dark', dark);
		const logo = document.getElementById('logo-img');
		const sun = document.getElementById('icon-sun');
		const moon = document.getElementById('icon-moon');
		const lbl = document.getElementById('theme-label');
		if (logo) logo.src = dark ? LOGO_DARK : LOGO_LIGHT;
		if (sun) sun.style.display = dark ? 'none' : 'block';
		if (moon) moon.style.display = dark ? 'block' : 'none';
		if (lbl) lbl.textContent = dark ? 'Dark Mode' : 'Light Mode';
		localStorage.setItem('vnvr-theme', dark ? 'dark' : 'light');
		if (lastData) renderChartsIfReady();
	}
	function toggleTheme() {
		applyTheme(!document.documentElement.classList.contains('dark'));
	}
	// Init theme from localStorage or system preference
	(function() {
		const saved = localStorage.getItem('vnvr-theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyTheme(saved ? saved === 'dark' : prefersDark);
	})();

	// ─── CHART HELPERS ───────────────────────────────────────────────────────
	function tok(name) {
		const dark = document.documentElement.classList.contains('dark');
		const map = {
			bg:      dark ? '#161b22' : '#ffffff',
			border:  dark ? '#21262d' : '#e2e6f0',
			text:    dark ? '#e6edf3' : '#111827',
			muted:   dark ? '#7d8590' : '#6b7280',
			primary: dark ? '#58a6ff' : '#3b82f6',
			accent:  dark ? '#a78bfa' : '#8b5cf6',
		};
		return map[name] || '#888';
	}

	const PIE_PALETTE  = () => [tok('primary'), tok('accent'), '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];
	const BAR_PALETTE  = () => tok('primary');

	function prepData(list, lk='name', vk='count', limit=8) {
		list = [...(list||[])].sort((a,b) => b[vk]-a[vk]);
		const top = list.slice(0, limit);
		const rest = list.slice(limit).reduce((s,r)=>s+r[vk], 0);
		if (rest > 0) top.push({[lk]:'Other',[vk]:rest});
		return { labels: top.map(i=>i[lk]), data: top.map(i=>i[vk]) };
	}


	function mkChart(id, type, d, palette, horizontal=false) {
		const ctx = document.getElementById(id)?.getContext('2d');
		if (!ctx) return;
		if (charts[id]) charts[id].destroy();
		const isBar = type === 'bar';
		charts[id] = new Chart(ctx, {
			type,
			data: {
				labels: d.labels,
				datasets: [{
					data: d.data,
					backgroundColor: palette,
					borderWidth: isBar ? 0 : 2,
					borderColor: tok('bg'),
					borderRadius: isBar ? 6 : 0,
				}]
			},
			options: {
				responsive: true, maintainAspectRatio: false,
				indexAxis: horizontal ? 'y' : 'x',
				plugins: {
					legend: {
						display: !isBar,
						position: 'right',
						labels: { color: tok('text'), padding: 14, font: { family: 'Inter', size: 11 }, boxWidth: 10 }
					},
					tooltip: {
						backgroundColor: tok('bg'),
						titleColor: tok('text'), bodyColor: tok('muted'),
						borderColor: tok('border'), borderWidth: 1,
						padding: 10, cornerRadius: 8,
					}
				},
				scales: isBar ? {
					x: { grid: { color: tok('border') }, ticks: { color: tok('muted'), font: { family: 'Inter', size: 10 } }, beginAtZero: true },
					y: { grid: { display: false }, ticks: { color: tok('muted'), font: { family: 'Inter', size: 10 } } }
				} : { x: { display:false }, y: { display:false } }
			}
		});
	}

	function renderChartsIfReady() {
		if (!lastData) return;
		const pp = PIE_PALETTE();
		// World map choropleth
		fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
			.then(r => r.json())
			.then(worldData => {
				const countries = ChartGeo.topojson.feature(worldData, worldData.objects.countries).features;
				// Build lookup: ISO-numeric -> ISO-alpha2
				const numToAlpha2 = {4:'AF',8:'AL',12:'DZ',24:'AO',32:'AR',36:'AU',40:'AT',50:'BD',56:'BE',76:'BR',100:'BG',124:'CA',152:'CL',156:'CN',170:'CO',191:'HR',203:'CZ',208:'DK',818:'EG',246:'FI',250:'FR',276:'DE',300:'GR',344:'HK',356:'IN',360:'ID',364:'IR',376:'IL',380:'IT',392:'JP',410:'KR',458:'MY',484:'MX',528:'NL',554:'NZ',566:'NG',578:'NO',586:'PK',604:'PE',608:'PH',616:'PL',620:'PT',642:'RO',643:'RU',682:'SA',702:'SG',710:'ZA',724:'ES',752:'SE',756:'CH',764:'TH',792:'TR',804:'UA',784:'AE',826:'GB',840:'US',704:'VN',858:'UY',807:'MK'};
				const countryMap = {};
				(lastData.countries||[]).forEach(c => { countryMap[c.name] = c.count; });
				const geoData = countries.map(f => ({
					feature: f,
					value: countryMap[numToAlpha2[+f.id]] || 0
				}));
				const ctx = document.getElementById('chart-worldmap')?.getContext('2d');
				if (!ctx) return;
				if (charts['chart-worldmap']) charts['chart-worldmap'].destroy();
				const isDark = document.documentElement.classList.contains('dark');
				charts['chart-worldmap'] = new Chart(ctx, {
					type: 'choropleth',
					data: { labels: countries.map(f=>f.properties.name), datasets: [{
						label: 'Installs',
						data: geoData,
						backgroundColor(ctx) {
							const v = ctx.raw?.value || 0;
							if (v === 0) return isDark ? '#1c2330' : '#e9ecef';
							const alpha = Math.min(0.2 + v * 0.3, 1);
							return isDark ? 'rgba(88,166,255,' + alpha + ')' : 'rgba(59,130,246,' + alpha + ')';
						},
						borderColor: isDark ? '#21262d' : '#d1d5db',
						borderWidth: 0.5,
					}]},
					options: {
						responsive: true, maintainAspectRatio: false,
						plugins: {
							legend: { display: false },
							tooltip: {
								backgroundColor: tok('bg'), titleColor: tok('text'), bodyColor: tok('muted'),
								borderColor: tok('border'), borderWidth: 1, padding: 10, cornerRadius: 8,
								callbacks: { label: function(ctx){ return ctx.raw.feature.properties.name + ': ' + (ctx.raw.value||0) + ' install(s)'; } }
							}
						},
						scales: { projection: { axis: 'x', projection: 'naturalEarth1' } }
					}
				});
			}).catch(() => {
				// Fallback: simple bar chart if geo fails to load
				mkChart('chart-worldmap', 'bar', prepData(lastData.countries,'name','count',15), BAR_PALETTE(), true);
			});
		mkChart('chart-os',           'doughnut', prepData(lastData.os), pp);
		mkChart('chart-arch',         'doughnut', prepData(lastData.arch), pp);
		const distRaw = lastData.cameras_dist || [];
		mkChart('chart-cameras-dist', 'bar', { labels: distRaw.map(x=>x.name+' cam'), data: distRaw.map(x=>x.count) }, BAR_PALETTE());
		const gdistRaw = lastData.groups_dist || [];
		mkChart('chart-groups-dist', 'bar', { labels: gdistRaw.map(x=>x.name+' grp'), data: gdistRaw.map(x=>x.count) }, BAR_PALETTE());
		mkChart('chart-versions',     'bar',      prepData(lastData.versions), BAR_PALETTE());
		mkChart('chart-ram',          'bar',      prepData(lastData.ram,'name','count',8), BAR_PALETTE());
		mkChart('chart-cpu-models', 'bar', prepData(lastData.cpu_models,'name','count',12), pp, true);
		mkChart('chart-cpu-cores',  'bar', prepData(lastData.cpu_cores,'name','count',10), BAR_PALETTE(), true);
	}

	function renderDashboard(data) {
		lastData = data;
		const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v ?? '0'; };
		set('kpi-active',        data.active_installs);
		set('kpi-total',         data.total_installs);
		set('kpi-cameras',       data.total_cameras);
		set('kpi-events',        (data.total_events||0).toLocaleString());
		set('kpi-groups',        data.total_groups);
		set('kpi-gpu',           data.gpu_enabled);
		set('kpi-notifications', data.notifications_enabled);

		renderChartsIfReady();

		document.getElementById('loader').style.display = 'none';
		document.getElementById('dashboard').style.display = 'block';
	}

	async function fetchStats() {
		document.getElementById('loader').style.display = 'flex';
		document.getElementById('dashboard').style.display = 'none';
		document.getElementById('error-msg').style.display = 'none';
		try {
			const res = await fetch('/api/stats');
			if (!res.ok) throw new Error('HTTP ' + res.status);
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			renderDashboard(data);
		} catch(e) {
			console.error(e);
			document.getElementById('loader').style.display = 'none';
			document.getElementById('error-msg').style.display = 'flex';
		}
	}

	fetchStats();
</script>
</body>
</html>`;

			return new Response(htmlTemplate, {
				headers: { 'Content-Type': 'text/html;charset=UTF-8' }
			});
		}

		// Favicon — redirect to the VibeNVR logo on GitHub
		if (url.pathname === '/favicon.ico' || url.pathname === '/favicon.png') {
			return Response.redirect('https://github.com/spupuz/VibeNVR/blob/main/docs/logo.png?raw=true', 302);
		}

		// Fallback for unknown routes
		return new Response("Not Found", { status: 404 });
	},
};
