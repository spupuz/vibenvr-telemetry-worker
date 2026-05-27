export const getDashboardHtml = (nonce, prefix = '') => {
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>VibeNVR Telemetry</title>
	<link rel="icon" type="image/png" href="${prefix}/favicon.png">
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
font-size: .75rem; 
font-weight: 600; 
color: var(--text-muted); 
text-transform: uppercase; 
letter-spacing: .05em; 
margin-bottom: .8rem;
display: flex;
align-items: flex-start;
gap: .5rem;
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
display: grid;
grid-template-columns: max-content 1fr;
column-gap: 0.4rem;
align-items: start;
font-size: .875rem; 
font-weight: 600; 
color: var(--text); 
margin-bottom: 1rem;
line-height: 1.4;
}
		.chart-title svg {
grid-column: 1;
grid-row: 1;
margin-top: 2px;
stroke: var(--primary);
filter: drop-shadow(0 0 2px var(--primary-light));
}
.chart-title span {
grid-column: 2;
font-size: 12px;
font-weight: normal;
color: var(--muted);
margin-top: 2px;
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

		.footer-links {
			margin-bottom: 1.5rem;
			display: flex;
			justify-content: center;
			gap: 1.2rem;
			align-items: center;
			flex-wrap: wrap;
		}
		.footer-link {
			color: var(--text);
			text-decoration: none;
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.4rem 0.9rem;
			border-radius: 8px;
			border: 1px solid var(--border);
			background: var(--surface);
			transition: all 0.2s;
			font-size: 0.8rem;
			font-weight: 500;
		}
		.footer-link:hover {
			border-color: var(--primary);
			color: var(--primary);
			background: var(--primary-light);
			box-shadow: 0 2px 8px rgba(0,0,0,0.05);
		}
		.dark .footer-link:hover {
			box-shadow: 0 2px 8px rgba(0,0,0,0.2);
		}

		@media (max-width: 900px) {
			.chart-row.cols-3 { grid-template-columns: repeat(2, 1fr); }
		}
		@media (max-width: 600px) {
			.main { padding: 0.75rem; }
			.card { padding: 1rem; }
			.kpi-card { padding: 0.8rem; }
.kpi-value { font-size: 1.75rem; }
.kpi-label { font-size: 0.7rem; }
			.chart-row.cols-3, .chart-row.cols-2 { grid-template-columns: 1fr; }
			.kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
		}
	</style>
</head>
<body>

<!-- TOP BAR -->
<header class="topbar">
	<a class="topbar-brand" href="https://github.com/spupuz/VibeNVR" target="_blank" rel="noopener">
		<img id="logo-img" src="${prefix}/assets/logo-dark" alt="VibeNVR">
		<span>VibeNVR Telemetry</span>
	</a>
	<div class="topbar-right">
		<div class="badge-live"><span class="dot"></span> Live</div>
		<button class="theme-btn" id="theme-toggle" title="Toggle theme">
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
		<p>Anonymous aggregate statistics from active VibeNVR installations · Last 30 days</p>
	</div>

	<!-- Error -->
	<div class="err-box" id="error-msg">
		<span>Failed to load telemetry data. Check Cloudflare API credentials.</span>
		<button class="retry-btn" id="retry-btn">Retry</button>
	</div>

	<!-- Loading -->
	<div class="state-box" id="loader">
		<div class="spinner"></div>
		<span>Loading telemetry…</span>
	</div>

	<!-- Record Count Disclaimer & External Links -->
	<div style="margin-bottom: 1.25rem; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); text-align: center;">
		Note: Only VibeNVR installations with active telemetry enabled are counted in these statistics.
	</div>
	
	<div class="footer-links">
		<a href="https://spupuz.github.io/vibe-nvr-site/" target="_blank" rel="noopener" class="footer-link">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
			Website
		</a>
		<a href="https://github.com/spupuz/VibeNVR" target="_blank" rel="noopener" class="footer-link">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> 
			GitHub
		</a>
		<a href="https://github.com/spupuz/VibeNVR/releases/latest" target="_blank" rel="noopener" class="footer-link">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
			Latest Version
		</a>
		<a href="https://www.buymeacoffee.com/spupuz" target="_blank" rel="noopener" class="footer-link">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg> 
			Buy Me A Coffee
		</a>
	</div>

	<!-- Dashboard -->
	<div id="dashboard" style="display:none">

		<!-- KPIs -->
		<div class="kpi-grid">
			<div class="kpi-card" title="Number of unique VibeNVR instances that have pinged the telemetry server in the last 30 days.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Active Installs</div>
				<div class="kpi-value" id="kpi-active">-</div>
				<div class="kpi-sub">Last 30 days</div>
			</div>
			<div class="kpi-card" title="Total number of unique VibeNVR instances seen since the project started.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> Total Installs</div>
				<div class="kpi-value" id="kpi-total">-</div>
				<div class="kpi-sub">All time distinct</div>
			</div>
			<div class="kpi-card" title="Total number of security cameras configured across all currently active instances.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> Cameras</div>
				<div class="kpi-value" id="kpi-cameras">-</div>
				<div class="kpi-sub">Managed across active</div>
			</div>
			<div class="kpi-card" title="Snapshot of total events currently stored across all active NVR databases.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Stored Events Volume</div>
				<div class="kpi-value" id="kpi-events">-</div>
				<div class="kpi-sub">Total cumulative across active NVRs</div>
			</div>
			<div class="kpi-card" title="Total number of camera groups created across all currently active instances to organize views.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg> Groups</div>
				<div class="kpi-value" id="kpi-groups">-</div>
				<div class="kpi-sub">Total across active</div>
			</div>
			<div class="kpi-card" title="Number of active instances currently utilizing Hardware Acceleration (GPU) for video decoding.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M15 2v2"/><path d="M9 2v2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M15 20v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/></svg> GPU Accel</div>
				<div class="kpi-value" id="kpi-gpu">-</div>
				<div class="kpi-sub">Instances with HW accel</div>
			</div>
			<div class="kpi-card" title="Number of active instances that have configured at least one external notification service (Email, Telegram, Webhook).">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg> Notifications</div>
				<div class="kpi-value" id="kpi-notifications">-</div>
				<div class="kpi-sub">Instances w/ webhooks/email/telegram</div>
			</div>
			<div class="kpi-card" title="Total number of cameras across all active instances that have AI object detection explicitly enabled.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M15 2v2"/><path d="M9 2v2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M15 20v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/></svg> AI Cameras</div>
				<div class="kpi-value" id="kpi-ai">-</div>
				<div class="kpi-sub">Cameras with AI enabled</div>
			</div>
			<div class="kpi-card" title="Number of active instances that are currently connected to an MQTT broker (e.g., Home Assistant).">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> MQTT Active</div>
				<div class="kpi-value" id="kpi-mqtt">-</div>
				<div class="kpi-sub">Instances with MQTT enabled</div>
			</div>
			<div class="kpi-card" title="Total number of cameras connected using the ONVIF protocol for PTZ and advanced features.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> ONVIF Devices</div>
				<div class="kpi-value" id="kpi-onvif">-</div>
				<div class="kpi-sub">Total ONVIF cameras</div>
			</div>
			<div class="kpi-card" title="Total number of cameras utilizing a lower-resolution sub-stream for optimized UI viewing.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Sub-streams</div>
				<div class="kpi-value" id="kpi-substreams">-</div>
				<div class="kpi-sub">Cameras with sub-streams</div>
			</div>
		</div>

		<!-- Row 0: World Map -->
		<div class="chart-row cols-1">
			<div class="card" title="Geographic distribution of active instances based on IP address geolocation.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> Map: Installations by Country
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Geographic distribution based on IP address geolocation)</span>
				</div>
				<div class="chart-wrap" style="height:340px"><canvas id="chart-worldmap"></canvas></div>
			</div>
		</div>

		<!-- Row 0.5: Country Bar Chart -->
		<div class="chart-row cols-1">
			<div class="card" title="Ranking of countries by the number of unique active VibeNVR installations.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="16" y1="20" x2="16" y2="4"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></svg> Top Countries (Unique Installs)
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Ranking by number of unique active installations)</span>
				</div>
				<div class="chart-wrap" style="height:340px"><canvas id="chart-country-bars"></canvas></div>
			</div>
		</div>

		<!-- Row 0b: Activity Trend -->
		<div class="chart-row cols-1">
			<div class="card" title="Tracks the daily number of active instances (Unique IDs) and the total telemetry pings received.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Activity Trend (Last 30 Days)
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Daily number of active instances and total telemetry pings received)</span>
				</div>
				<div class="chart-wrap" style="height:300px"><canvas id="chart-activity"></canvas></div>
			</div>
		</div>

		<!-- Row 0c: Events Trend -->
		<div class="chart-row cols-1">
			<div class="card">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Stored Events Volume Trend (Last 30 Days)
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Sum of daily snapshots. Fluctuations caused by NVR retention & offline instances)</span>
				</div>
				<div class="chart-wrap" style="height:300px"><canvas id="chart-events"></canvas></div>
			</div>
		</div>

		<!-- Row 0c: Motion Engines -->
		<div class="chart-row cols-1">
			<div class="card" title="Breakdown of the software engines used for motion detection (OpenCV, AI, ONVIF) across all cameras.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9-9a9 9 0 0 1-9 9m9-9V3m0 18a9 9 0 0 1-9-9"/></svg> Motion Detection Engines Distribution
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Breakdown of software engines used for motion detection across all cameras)</span>
				</div>
				<div class="chart-wrap" style="height:300px"><canvas id="chart-motion-engines"></canvas></div>
			</div>
		</div>

		<!-- Row 1: Cameras + Groups distribution -->
		<div class="chart-row cols-2">
			<div class="card" title="Distribution showing how many cameras users typically connect to a single VibeNVR instance.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> Cameras per Instance
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(How many cameras users typically connect per instance)</span>
				</div>
				<div class="chart-wrap"><canvas id="chart-cameras-dist"></canvas></div>
			</div>
			<div class="card" title="Distribution showing how many camera groups users typically create per instance.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg> Groups per Instance
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(How many camera groups users typically create per instance)</span>
				</div>
				<div class="chart-wrap"><canvas id="chart-groups-dist"></canvas></div>
			</div>
		</div>

		<!-- Row 2: Versions + RAM -->
		<div class="chart-row cols-2">
			<div class="card" title="Distribution of the VibeNVR server versions currently running in active installations.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg> Active Versions
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Distribution of currently running server versions)</span>
				</div>
				<div class="chart-wrap"><canvas id="chart-versions"></canvas></div>
			</div>
			<div class="card" title="Total system RAM capacity of the host machines running VibeNVR.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg> RAM Capacity
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Total system RAM capacity of host machines)</span>
				</div>
				<div class="chart-wrap"><canvas id="chart-ram"></canvas></div>
			</div>
		</div>

		<!-- Row 3: CPU Models + CPU Cores -->
		<div class="chart-row cols-2">
			<div class="card" title="Most common host CPU models powering VibeNVR installations.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M15 2v2"/><path d="M9 2v2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M15 20v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/></svg> CPU Models
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Most common host CPU models powering installations)</span>
				</div>
				<div class="chart-wrap tall"><canvas id="chart-cpu-models"></canvas></div>
			</div>
			<div class="card" title="Distribution of total available CPU cores on the host machines.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M15 2v2"/><path d="M9 2v2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M15 20v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/></svg> CPU Core Counts
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Distribution of total available CPU cores)</span>
				</div>
				<div class="chart-wrap tall"><canvas id="chart-cpu-cores"></canvas></div>
			</div>
		</div>


		<!-- Divider & Site Section -->
		<div style="margin: 3rem 0; border-top: 1px dashed var(--border);"></div>
		<div class="page-title" style="margin-top: 2rem;">
			<h2 style="font-size: 1.25rem; font-weight: 700;">Website Analytics</h2>
			<p>Traffic to VibeNVR-site</p>
		</div>
		
		<!-- Site KPIs -->
		<div class="kpi-grid" style="margin-bottom: 1.5rem;">
			<div class="kpi-card" title="Number of unique visitors to the VibeNVR website in the last 30 days.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Unique Visitors</div>
				<div class="kpi-value" id="kpi-site-visitors-30d">-</div>
				<div class="kpi-sub">Last 30 days</div>
			</div>
			<div class="kpi-card" title="Total number of unique visitors seen on the VibeNVR website since monitoring started.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Unique Visitors</div>
				<div class="kpi-value" id="kpi-site-visitors-alltime">-</div>
				<div class="kpi-sub">All-time distinct</div>
			</div>
			<div class="kpi-card" title="Total number of page loads/views on the VibeNVR website in the last 30 days.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> Total Pageviews</div>
				<div class="kpi-value" id="kpi-site-pageviews-30d">-</div>
				<div class="kpi-sub">Pageviews (30d)</div>
			</div>
			<div class="kpi-card" title="Total number of page loads/views on the VibeNVR website since monitoring started.">
				<div class="kpi-label"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> Total Pageviews</div>
				<div class="kpi-value" id="kpi-site-pageviews-alltime">-</div>
				<div class="kpi-sub">Pageviews (All-time)</div>
			</div>
		</div>

		<!-- Row 5: Site Activity + Site Worldmap -->
		<div class="chart-row cols-2">
			<div class="card" title="Daily trend of unique visitors and pageviews for the VibeNVR website over the last 30 days.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Site Activity Trend
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Daily trend of unique visitors and pageviews)</span>
				</div>
				<div class="chart-wrap"><canvas id="chart-site-activity"></canvas></div>
			</div>
			<div class="card" title="Geographic distribution of visitors to the VibeNVR website.">
				<div class="chart-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> Site Visitors by Country
					<span style="font-size: 12px; font-weight: normal; color: var(--muted); margin-top: 4px;">(Geographic distribution of site visitors)</span>
				</div>
				<div class="chart-wrap"><canvas id="chart-site-worldmap"></canvas></div>
			</div>
		</div>
	<footer class="footer">
		Powered by Cloudflare Workers Analytics Engine · No IP addresses or personal data stored ·
		All metrics are anonymous aggregate counts
	</footer>
</main>

<script nonce="${nonce}">
	// ─── STATE (declared before IIFE to avoid TDZ) ───────────────────────────
	let charts = {};
	let lastData = null;

	// ─── THEME ───────────────────────────────────────────────────────────────
	const LOGO_DARK  = '${prefix}/assets/logo-dark';
	const LOGO_LIGHT = '${prefix}/assets/logo-light';

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
	const BAR_PALETTE  = () => [
		'#1d4ed8', // Blue 700
		'#2563eb', // Blue 600
		'#3b82f6', // Blue 500
		'#60a5fa', // Blue 400
		'#93c5fd', // Blue 300
		'#bfdbfe', // Blue 200
		'#dbeafe'  // Blue 100
	];

	function getFlagEmoji(countryCode) {
		if (!countryCode || countryCode === 'Unknown' || countryCode.length !== 2) return '❓';
		try {
			const codePoints = countryCode
				.toUpperCase()
				.split('')
				.map(char => 127397 + char.charCodeAt());
			return String.fromCodePoint(...codePoints);
		} catch (e) {
			return '❓';
		}
	}

	function prepData(list, lk='name', vk='count', limit=8, showFlags=false) {
		list = [...(list||[])].sort((a,b) => b[vk]-a[vk]);
		const top = list.slice(0, limit);
		const rest = list.slice(limit).reduce((s,r)=>s+r[vk], 0);
		if (rest > 0) top.push({[lk]:'Other',[vk]:rest});
		
		const labels = top.map(i => {
			let name = i[lk];
			if (typeof name === 'string') {
				// Clean up CPU names to fit in mobile charts
				name = name.replace(/\(R\)|\(TM\)/g, '').replace(/ Processor/gi, '').replace(/ CPU/gi, '').replace(/ @ \d+\.\d+GHz/gi, '').trim();
				if (name.length > 28) name = name.substring(0, 26) + '...';
			}
			if (showFlags && name !== 'Other' && name !== 'Unknown') {
				return getFlagEmoji(name) + ' ' + name;
			}
			return name;
		});

		return { labels, data: top.map(i=>i[vk]) };
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
					x: { grid: { color: tok('border') }, ticks: { color: tok('muted'), font: { family: 'Inter, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif', size: 10 } }, beginAtZero: true },
					y: { grid: { display: false }, ticks: { color: tok('muted'), font: { family: 'Inter, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif', size: 10 } } }
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
				mkChart('chart-worldmap', 'bar', prepData(lastData.countries,'name','count',15,true), BAR_PALETTE(), false);
			});
		
		// Site map choropleth
		fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
			.then(r => r.json())
			.then(worldData => {
				const countries = ChartGeo.topojson.feature(worldData, worldData.objects.countries).features;
				const numToAlpha2 = {4:'AF',8:'AL',12:'DZ',24:'AO',32:'AR',36:'AU',40:'AT',50:'BD',56:'BE',76:'BR',100:'BG',124:'CA',152:'CL',156:'CN',170:'CO',191:'HR',203:'CZ',208:'DK',818:'EG',246:'FI',250:'FR',276:'DE',300:'GR',344:'HK',356:'IN',360:'ID',364:'IR',376:'IL',380:'IT',392:'JP',410:'KR',458:'MY',484:'MX',528:'NL',554:'NZ',566:'NG',578:'NO',586:'PK',604:'PE',608:'PH',616:'PL',620:'PT',642:'RO',643:'RU',682:'SA',702:'SG',710:'ZA',724:'ES',752:'SE',756:'CH',764:'TH',792:'TR',804:'UA',784:'AE',826:'GB',840:'US',704:'VN',858:'UY',807:'MK'};
				const countryMap = {};
				(lastData.site_countries||[]).forEach(c => { countryMap[c.name] = c.count; });
				const geoData = countries.map(f => ({
					feature: f,
					value: countryMap[numToAlpha2[+f.id]] || 0
				}));
				const ctx = document.getElementById('chart-site-worldmap')?.getContext('2d');
				if (!ctx) return;
				if (charts['chart-site-worldmap']) charts['chart-site-worldmap'].destroy();
				const isDark = document.documentElement.classList.contains('dark');
				charts['chart-site-worldmap'] = new Chart(ctx, {
					type: 'choropleth',
					data: { labels: countries.map(f=>f.properties.name), datasets: [{
						label: 'Visitors',
						data: geoData,
						backgroundColor(ctx) {
							const v = ctx.raw?.value || 0;
							if (v === 0) return isDark ? '#1c2330' : '#e9ecef';
							const alpha = Math.min(0.2 + v * 0.3, 1);
							return isDark ? 'rgba(167,139,250,' + alpha + ')' : 'rgba(139,92,246,' + alpha + ')'; // Use accent color for site map
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
								callbacks: { label: function(ctx){ return ctx.raw.feature.properties.name + ': ' + (ctx.raw.value||0) + ' unique(s)'; } }
							}
						},
						scales: { projection: { axis: 'x', projection: 'naturalEarth1' } }
					}
				});
			}).catch(() => {
				mkChart('chart-site-worldmap', 'bar', prepData(lastData.site_countries,'name','count',15,true), BAR_PALETTE(), false);
			});

		mkChart('chart-country-bars', 'bar', prepData(lastData.countries, 'name', 'count', 12, true), BAR_PALETTE(), false);

		// Activity Trend Chart
		const activityCtx = document.getElementById('chart-activity')?.getContext('2d');
		if (activityCtx) {
			if (charts['chart-activity']) charts['chart-activity'].destroy();
			const activityLabels = lastData.activity.map(d => {
				const date = new Date(d.date);
				return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
			});
			charts['chart-activity'] = new Chart(activityCtx, {
				type: 'line',
				data: {
					labels: activityLabels,
					datasets: [
						{
							label: 'Unique IDs',
							data: lastData.activity.map(d => d.uniques),
							borderColor: tok('primary'),
							backgroundColor: 'transparent',
							tension: 0.3,
							pointRadius: 4,
							borderWidth: 3
						},
						{
							label: 'Total Pings',
							data: lastData.activity.map(d => d.pings),
							borderColor: tok('accent'),
							backgroundColor: 'transparent',
							tension: 0.3,
							pointRadius: 0,
							borderWidth: 2,
							borderDash: [5, 5]
						}
					]
				},
				options: {
					responsive: true, maintainAspectRatio: false,
					plugins: {
						legend: { position: 'top', labels: { color: tok('text') } },
						tooltip: {
							backgroundColor: tok('bg'), titleColor: tok('text'), bodyColor: tok('muted'),
							borderColor: tok('border'), borderWidth: 1, padding: 10, cornerRadius: 8
						}
					},
					scales: {
						x: { grid: { display: false }, ticks: { color: tok('muted'), maxRotation: 0 } },
						y: { grid: { color: tok('border') }, ticks: { color: tok('muted') }, beginAtZero: true }
					}
				}
			});
		}
		
		// Events Trend Chart
		const eventsCtx = document.getElementById('chart-events')?.getContext('2d');
		if (eventsCtx && lastData.events_trend && lastData.events_trend.length > 0) {
			if (charts['chart-events']) charts['chart-events'].destroy();
			const eventsLabels = lastData.events_trend.map(d => {
				const date = new Date(d.date);
				return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
			});
			charts['chart-events'] = new Chart(eventsCtx, {
				type: 'line',
				data: {
					labels: eventsLabels,
					datasets: [
						{
							label: 'Total Events',
							data: lastData.events_trend.map(d => d.events),
							borderColor: tok('accent'),
							backgroundColor: 'rgba(139, 92, 246, 0.1)',
							tension: 0.3,
							pointRadius: 4,
							borderWidth: 3,
							fill: true
						}
					]
				},
				options: {
					responsive: true, maintainAspectRatio: false,
					plugins: {
						legend: { position: 'top', labels: { color: tok('text') } },
						tooltip: {
							backgroundColor: tok('bg'), titleColor: tok('text'), bodyColor: tok('muted'),
							borderColor: tok('border'), borderWidth: 1, padding: 10, cornerRadius: 8
						}
					},
					scales: {
						x: { grid: { display: false }, ticks: { color: tok('muted'), maxRotation: 0 } },
						y: { grid: { color: tok('border') }, ticks: { color: tok('muted') }, beginAtZero: true }
					}
				}
			});
		} else if (eventsCtx) {
			if (charts['chart-events']) charts['chart-events'].destroy();
			mkChart('chart-events', 'bar', {labels: ['No Data'], data: [0]}, BAR_PALETTE());
		}
		
		// Site Activity Trend Chart
		const siteActivityCtx = document.getElementById('chart-site-activity')?.getContext('2d');
		if (siteActivityCtx && lastData.site_activity && lastData.site_activity.length > 0) {
			if (charts['chart-site-activity']) charts['chart-site-activity'].destroy();
			const activityLabels = lastData.site_activity.map(d => {
				const date = new Date(d.date);
				return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
			});
			charts['chart-site-activity'] = new Chart(siteActivityCtx, {
				type: 'line',
				data: {
					labels: activityLabels,
					datasets: [
						{
							label: 'Unique Visitors',
							data: lastData.site_activity.map(d => d.uniques),
							borderColor: tok('accent'),
							backgroundColor: 'transparent',
							tension: 0.3,
							pointRadius: 4,
							borderWidth: 3
						},
						{
							label: 'Total Pageviews',
							data: lastData.site_activity.map(d => d.pageviews),
							borderColor: tok('primary'),
							backgroundColor: 'transparent',
							tension: 0.3,
							pointRadius: 0,
							borderWidth: 2,
							borderDash: [5, 5]
						}
					]
				},
				options: {
					responsive: true, maintainAspectRatio: false,
					plugins: {
						legend: { position: 'top', labels: { color: tok('text') } },
						tooltip: {
							backgroundColor: tok('bg'), titleColor: tok('text'), bodyColor: tok('muted'),
							borderColor: tok('border'), borderWidth: 1, padding: 10, cornerRadius: 8
						}
					},
					scales: {
						x: { grid: { display: false }, ticks: { color: tok('muted'), maxRotation: 0 } },
						y: { grid: { color: tok('border') }, ticks: { color: tok('muted') }, beginAtZero: true }
					}
				}
			});
		} else if (siteActivityCtx) {
		    // Empty state for site activity
			if (charts['chart-site-activity']) charts['chart-site-activity'].destroy();
			mkChart('chart-site-activity', 'bar', {labels: ['No Data'], data: [0]}, BAR_PALETTE());
		}

		const distRaw = lastData.cameras_dist || [];
		mkChart('chart-cameras-dist', 'bar', { labels: distRaw.map(x=>x.name+' cam'), data: distRaw.map(x=>x.count) }, BAR_PALETTE());
		const gdistRaw = lastData.groups_dist || [];
		mkChart('chart-groups-dist', 'bar', { labels: gdistRaw.map(x=>x.name+' grp'), data: gdistRaw.map(x=>x.count) }, BAR_PALETTE());
		mkChart('chart-versions',     'bar',      prepData(lastData.versions), BAR_PALETTE());
		mkChart('chart-ram',          'bar',      prepData(lastData.ram,'name','count',8), BAR_PALETTE());
		mkChart('chart-cpu-models', 'bar', prepData(lastData.cpu_models,'name','count',12), BAR_PALETTE(), true);
		mkChart('chart-cpu-cores',  'bar', prepData(lastData.cpu_cores,'name','count',10), BAR_PALETTE(), true);
		
		mkChart('chart-motion-engines', 'doughnut', prepData(lastData.motion_engines), PIE_PALETTE());
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
		set('kpi-ai',            data.total_motion_ai);
		set('kpi-mqtt',          data.total_mqtt_active);
		set('kpi-onvif',         data.total_onvif_cameras);
		set('kpi-substreams',    data.total_substream_cameras);
		set('kpi-site-visitors-30d', data.site_total_visitors_30d);
		set('kpi-site-visitors-alltime', data.site_total_visitors_all_time);
		set('kpi-site-pageviews-30d', data.site_total_pageviews_30d);
		set('kpi-site-pageviews-alltime', data.site_total_pageviews_all_time);

		renderChartsIfReady();

		document.getElementById('loader').style.display = 'none';
		document.getElementById('dashboard').style.display = 'block';
	}

	async function fetchStats() {
		document.getElementById('loader').style.display = 'flex';
		document.getElementById('dashboard').style.display = 'none';
		document.getElementById('error-msg').style.display = 'none';
		try {
			const res = await fetch('${prefix}/api/stats');
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

	document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
	document.getElementById('retry-btn')?.addEventListener('click', fetchStats);

	fetchStats();
</script>
</body>
</html>`;
  return htmlTemplate;
};

