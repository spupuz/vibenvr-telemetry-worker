export const getDashboardHtml = (nonce, prefix = '') => {
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="theme-color" content="#ffffff" id="theme-color-meta">
	<title>VibeNVR Telemetry</title>
	<link rel="icon" type="image/png" href="${prefix}/favicon.png">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet">
	<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js" nonce="${nonce}" integrity="sha384-jb8JQMbMoBUzgWatfe6COACi2ljcDdZQ2OxczGA3bGNeWe+6DChMTBJemed7ZnvJ" crossorigin="anonymous"></script>
	<script src="https://cdn.jsdelivr.net/npm/chartjs-chart-geo@4.3.6/build/index.umd.min.js" nonce="${nonce}" integrity="sha384-EW6qTcZh7bPyECHRcIzVvefbUO37nGjPkmDFEdcdAe7ex44EjBA0GWnoleczHbC/" crossorigin="anonymous"></script>
	<script nonce="${nonce}" type="module" src="https://cdn.jsdelivr.net/npm/ionicons@7.4.0/dist/ionicons/ionicons.esm.js" integrity="sha384-ka/QOj1/87D5umY1GYq4GS0y8e8vwy0Wj0BKvxJTWpNFUIarDm645Kvr8Q6Q" crossorigin="anonymous"></script>
	<script nonce="${nonce}" nomodule src="https://cdn.jsdelivr.net/npm/ionicons@7.4.0/dist/ionicons/ionicons.js" integrity="sha384-I7UNMgUrv6nA6xNHRbytUMytFlugSJWu/Il4VAV+Rhv73j9qaQqjf5IS1w9vHGsD" crossorigin="anonymous"></script>
	<style>
		*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
		@font-face {
			font-family: 'Twemoji Country Flags';
			unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067, U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
			src: url('https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1/dist/TwemojiCountryFlags.woff2') format('woff2');
		}
		:root {
			color-scheme: light;
			--bg: #f4f6fb;
			--surface: #ffffff;
			--surface2: #f0f2f8;
			--border: #e2e6f0;
			--text: #111827;
			--text-muted: #4b5563;
			--primary: #3b82f6;
			--primary-light: #eff6ff;
			--primary-dark: #1d4ed8;
			--accent: #8b5cf6;
			--success: #047857;
			--err: #dc2626;
			--radius: 16px;
			--shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.05);
			--shadow-hover: 0 10px 25px -5px rgba(59, 130, 246, 0.15), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
		}
		.dark {
			color-scheme: dark;
			--bg: #0d1117;
			--surface: #161b22;
			--surface2: #1c2330;
			--border: #21262d;
			--text: #e6edf3;
			--text-muted: #9ca3af;
			--primary: #58a6ff;
			--primary-light: rgba(88,166,255,.1);
			--primary-dark: #1f6feb;
			--accent: #a78bfa;
			--success: #10b981;
			--err: #f87171;
			--shadow: 0 1px 4px rgba(0,0,0,.3), 0 4px 16px rgba(0,0,0,.25);
			--shadow-hover: 0 10px 25px rgba(0,0,0,.5);
		}
		body {
			font-family: 'Geist', 'Twemoji Country Flags', sans-serif;
			background: var(--bg);
			color: var(--text);
			min-height: 100vh;
			transition: background .25s, color .25s;
			padding-bottom: 80px;
		}
		.skip-link {
			position: absolute; top: -100px; left: 0;
			background: var(--primary-dark); color: #fff;
			padding: 8px 16px; z-index: 1000; text-decoration: none;
			font-weight: 600; font-size: 0.85rem; border-radius: 0 0 var(--radius) 0;
			transition: top 0.2s;
		}
		.skip-link:focus { top: 0; outline: 2px solid var(--primary-dark); outline-offset: 2px; }
		.main { padding: 1.5rem; max-width: 1320px; margin: 0 auto; }
		.page-title { margin-bottom: 1.5rem; }
		.page-title h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -.02em; }
		.page-title p { color: var(--text-muted); font-size: .85rem; margin-top: .25rem; }
		.card {
			background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
			padding: 1.2rem 1.4rem; box-shadow: var(--shadow); transition: border-color .25s, box-shadow .25s, background-color .25s, transform .25s;
		}
		.card:hover, .card:focus-visible { border-color: var(--primary); box-shadow: var(--shadow-hover); transform: translateY(-4px); }
		.kpi-grid {
			display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;
		}
		@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
		@media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } }
		.kpi-card {
			background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
			padding: 1.1rem 1.25rem; box-shadow: var(--shadow); position: relative; overflow: hidden;
		}
		.kpi-card::before {
			content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
			background: linear-gradient(90deg, var(--primary), var(--accent)); opacity: 0; transition: opacity .2s;
		}
		.kpi-card:hover::before, .kpi-card:focus-visible::before { opacity: 1; }
		.kpi-card:hover, .kpi-card:focus-visible { border-color: var(--primary); box-shadow: var(--shadow-hover); transform: translateY(-4px); }
		.kpi-label { font-size: .75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: .8rem; display: flex; align-items: flex-start; gap: .5rem; }
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
		.chart-row { display: grid; gap: 1rem; margin-bottom: 1rem; }
		.chart-row.cols-3 { grid-template-columns: repeat(3, 1fr); }
		.chart-row.cols-2 { grid-template-columns: repeat(2, 1fr); }
		.chart-row.cols-1 { grid-template-columns: 1fr; }
		.chart-title { display: grid; grid-template-columns: max-content 1fr; column-gap: 0.4rem; align-items: start; font-size: .875rem; font-weight: 600; color: var(--text); margin-bottom: 1rem; line-height: 1.4; }
		.chart-title svg { grid-column: 1; grid-row: 1; margin-top: 2px; stroke: var(--primary); filter: drop-shadow(0 0 2px var(--primary-light)); }
		.chart-title span { grid-column: 2; font-size: 12px; font-weight: normal; color: var(--text-muted); margin-top: 2px; }
		.chart-wrap { position: relative; height: 220px; }
		.chart-wrap.tall { height: 260px; }
		.aos { opacity: 0; transform: translateY(30px) scale(0.98); filter: blur(4px); transition: all 1s cubic-bezier(0.22, 1, 0.36, 1); }
		.aos.in-view { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
		.state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 1rem; color: var(--text-muted); }
		.spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid var(--border); border-top-color: var(--primary); animation: spin .8s linear infinite; }
		@keyframes spin { to { transform: rotate(360deg); } }
		.err-box { display: none; background: color-mix(in srgb, var(--err) 8%, transparent); border: 1px solid color-mix(in srgb, var(--err) 30%, transparent); color: var(--err); border-radius: var(--radius); padding: 1rem 1.25rem; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
		.retry-btn { cursor: pointer; border: 1px solid color-mix(in srgb, var(--err) 40%, transparent); background: transparent; border-radius: 8px; padding: .3rem .8rem; color: var(--err); font-size: .8rem; white-space: nowrap; transition: all .2s; display: inline-flex; align-items: center; gap: 0.35rem; }
		.retry-btn:hover, .retry-btn:focus-visible { background: color-mix(in srgb, var(--err) 10%, transparent); }
		.retry-btn:active { transform: scale(0.96); }
		.smart-footer { position: fixed; bottom: 0; left: 0; width: 100%; background-color: var(--surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid var(--border); box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05); transform: translateY(0); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color .25s, border-color .25s; z-index: 100; padding: 1rem 0; }
		.smart-footer.hidden { transform: translateY(100%); }
		.smart-footer:focus-within, .smart-footer.hidden:focus-within { transform: translateY(0) !important; }
		.footer-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; max-width: 1320px; margin: 0 auto; padding: 0 1.5rem; }
		.footer-logo { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--text); }
		.footer-links-site { display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center; align-items: center; }
		.footer-link-site { color: var(--text-muted); font-size: 0.85rem; font-weight: 500; transition: color 0.2s, transform 0.2s; text-decoration: none; -webkit-tap-highlight-color: transparent; }
		.footer-link-site:hover, .footer-link-site:focus, .footer-link-site:focus-visible { color: var(--primary); }
		.footer-link-site:active { transform: scale(0.96); }
		.footer-divider { color: var(--border); }
		.footer-copy { font-size: 0.75rem; color: var(--text-muted); text-align: center; }
		@media (max-width: 768px) {
			.footer-content { flex-direction: column; justify-content: center; text-align: center; gap: 0.75rem; }
			.footer-links-site { gap: 1rem; justify-content: center; width: 100%; }
			.footer-divider { display: none; }
		}
		.footer { text-align: center; padding: 2rem 1rem; font-size: .75rem; color: var(--text-muted); border-top: 1px solid var(--border); margin-top: 1.5rem; }
		.footer-links { margin-bottom: 1.5rem; display: flex; justify-content: center; gap: 1.2rem; align-items: center; flex-wrap: wrap; }
		.footer-link { color: var(--text); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1.1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); transition: all 0.2s; font-size: 0.8rem; font-weight: 500; }
		.github-badge { background: var(--primary-dark); color: #fff; padding: 0.1rem 0.45rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700; margin-left: 0.2rem; display: inline-flex; align-items: center; justify-content: center; }
		.footer-link:hover, .footer-link:focus-visible { border-color: var(--primary); color: var(--primary); background: var(--primary-light); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
		.dark .footer-link:hover, .dark .footer-link:focus-visible { box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
		.footer-link:active { transform: scale(0.96); }
		@media (max-width: 900px) { .chart-row.cols-3 { grid-template-columns: repeat(2, 1fr); } }
		@media (max-width: 600px) { .main { padding: 0.75rem; } .card { padding: 1rem; } .kpi-card { padding: 0.8rem; } .kpi-value { font-size: 1.75rem; } .kpi-label { font-size: 0.7rem; } .chart-row.cols-3, .chart-row.cols-2 { grid-template-columns: 1fr; } .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; } }
		@media (prefers-reduced-motion: reduce) {
			*, *::before, *::after {
				animation-duration: 0.01ms !important;
				animation-iteration-count: 1 !important;
				transition-duration: 0.01ms !important;
				scroll-behavior: auto !important;
			}
		}
		.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
	</style>
	<script nonce="${nonce}">
		window.__apiStatsPromise = fetch('${prefix}/api/stats', { signal: (window.AbortSignal && AbortSignal.timeout) ? AbortSignal.timeout(10000) : undefined });
		window.__apiStatsPromise.catch(() => {});
	</script>
</head>
<body>
	<a href="#main-content" class="skip-link">Skip to main content</a>
	<header class="topbar">
		<a class="topbar-brand" href="https://github.com/spupuz/VibeNVR" target="_blank" rel="noopener noreferrer">
			<img id="logo-img" src="${prefix}/assets/logo-dark" alt="" aria-hidden="true">
			<span>VibeNVR Telemetry</span><span class="sr-only"> (opens in a new tab)</span>
		</a>
		<div class="topbar-right">
			<div class="badge-live" aria-label="Live status" role="status"><span class="dot" aria-hidden="true"></span> <span aria-hidden="true">Live</span></div>
		</div>
	</header>
	<main id="main-content" class="main" tabindex="-1">
		<div class="page-title">
			<h1>Usage Dashboard</h1>
			<p>Anonymous aggregate statistics from active VibeNVR installations <span aria-hidden="true">·</span> Last 30 days</p>
		</div>
		<div class="err-box" id="error-msg" role="alert" aria-live="assertive">
			<span>Telemetry unavailable.</span>
			<button type="button" class="retry-btn" id="retry-btn">Retry</button>
		</div>
		<div class="state-box" id="loader" role="status" aria-live="polite">
			<div class="spinner" aria-hidden="true"></div>
			<span>Loading telemetry…</span>
		</div>
		<div class="footer-links">
			<a href="https://spupuz.github.io/vibe-nvr-site/" target="_blank" rel="noopener noreferrer" class="footer-link">Website</a>
			<a href="https://github.com/spupuz/VibeNVR" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>
			<a href="https://github.com/spupuz/VibeNVR/releases/latest" target="_blank" rel="noopener noreferrer" class="footer-link">Latest Version</a>
		</div>
		<div id="dashboard" style="display:none">
			<div class="kpi-grid">
				<div class="kpi-card" tabindex="0" title="Number of unique VibeNVR instances that have pinged the telemetry server in the last 30 days.">
					<div class="kpi-label">Active installs</div>
					<div class="kpi-value" id="kpi-active">-</div>
					<div class="kpi-sub">Last 30 days</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Total number of unique VibeNVR instances seen since the project started.">
					<div class="kpi-label">Total installs</div>
					<div class="kpi-value" id="kpi-total">-</div>
					<div class="kpi-sub">All time distinct</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Total number of unique countries seen across all active installations.">
					<div class="kpi-label">Countries</div>
					<div class="kpi-value" id="kpi-countries">-</div>
					<div class="kpi-sub">Last 30 days</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Total number of security cameras configured across all currently active instances.">
					<div class="kpi-label">Cameras</div>
					<div class="kpi-value" id="kpi-cameras">-</div>
					<div class="kpi-sub">Managed across active</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Snapshot of total events currently stored across all active NVR databases.">
					<div class="kpi-label">Events</div>
					<div class="kpi-value" id="kpi-events">-</div>
					<div class="kpi-sub">Total cumulative across active NVRs</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Total number of camera groups created across all currently active instances to organize views.">
					<div class="kpi-label">Groups</div>
					<div class="kpi-value" id="kpi-groups">-</div>
					<div class="kpi-sub">Total across active</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Number of active instances currently utilizing Hardware Acceleration (GPU) for video decoding.">
					<div class="kpi-label">GPU</div>
					<div class="kpi-value" id="kpi-gpu">-</div>
					<div class="kpi-sub">Instances with HW accel</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Number of active instances that have configured at least one external notification service (Email, Telegram, Webhook).">
					<div class="kpi-label">Notifications</div>
					<div class="kpi-value" id="kpi-notifications">-</div>
					<div class="kpi-sub">Instances w/ webhooks/email/telegram</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Total number of cameras across all active instances that have AI object detection explicitly enabled.">
					<div class="kpi-label">AI cameras</div>
					<div class="kpi-value" id="kpi-ai">-</div>
					<div class="kpi-sub">Cameras with AI enabled</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Number of active instances that are currently connected to an MQTT broker (e.g., Home Assistant).">
					<div class="kpi-label">MQTT</div>
					<div class="kpi-value" id="kpi-mqtt">-</div>
					<div class="kpi-sub">Instances with MQTT enabled</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Total number of cameras connected using the ONVIF protocol for PTZ and advanced features.">
					<div class="kpi-label">ONVIF</div>
					<div class="kpi-value" id="kpi-onvif">-</div>
					<div class="kpi-sub">Total ONVIF cameras</div>
				</div>
				<div class="kpi-card" tabindex="0" title="Total number of cameras utilizing a lower-resolution sub-stream for optimized UI viewing.">
					<div class="kpi-label">Substreams</div>
					<div class="kpi-value" id="kpi-substreams">-</div>
					<div class="kpi-sub">Cameras with sub-streams</div>
				</div>
			</div>
		</div>
	</main>
	<script nonce="${nonce}">
		function set(id, value) {
			const el = document.getElementById(id);
			if (!el) return;
			const num = Number(value ?? 0);
			el.textContent = Number.isFinite(num) ? num.toLocaleString() : '0';
		}
		(async function () {
			try {
				const res = await fetch('${prefix}/api/stats');
				if (!res.ok) throw new Error('HTTP ' + res.status);
				const data = await res.json();
				set('kpi-active', data.active_installs);
				set('kpi-total', data.total_installs);
				set('kpi-countries', data.countries ? data.countries.filter(x => x.name !== 'Unknown').length : 0);
				set('kpi-cameras', data.total_cameras);
				set('kpi-events', data.total_events || 0);
				set('kpi-groups', data.total_groups);
				set('kpi-gpu', data.gpu_enabled);
				set('kpi-notifications', data.notifications_enabled);
				set('kpi-ai', data.total_motion_ai_engine);
				set('kpi-mqtt', data.total_mqtt_active);
				set('kpi-onvif', data.total_onvif_cameras);
				set('kpi-substreams', data.total_substream_cameras);
				document.getElementById('loader').style.display = 'none';
				document.getElementById('dashboard').style.display = 'block';
			} catch (err) {
				console.error(err);
				document.getElementById('loader').style.display = 'none';
				document.getElementById('error-msg').style.display = 'block';
			}
		})();
		document.getElementById('retry-btn')?.addEventListener('click', () => location.reload());
	</script>
</body>
</html>`;

  return htmlTemplate;
};
