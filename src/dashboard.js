export const getDashboardHtml = (nonce, prefix = '') => {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>VibeNVR Telemetry</title>
	<style>
		:root { color-scheme: light dark; font-family: sans-serif; }
		body { margin: 0; background: #0f172a; color: #e2e8f0; padding: 24px; }
		.container { max-width: 900px; margin: 0 auto; }
		.card { background: rgba(15,23,42,.8); border: 1px solid rgba(148,163,184,.25); border-radius: 16px; padding: 18px 20px; margin-bottom: 18px; }
		h1 { margin: 0 0 12px; font-size: 2rem; }
		.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
		.kpi { background: rgba(15,23,42,.6); border: 1px solid rgba(148,163,184,.25); border-radius: 12px; padding: 14px; }
		.kpi-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
		.kpi-value { font-size: 2rem; font-weight: 700; margin-top: 8px; }
		#status { color: #a7f3d0; }
	</style>
</head>
<body>
	<div class="container">
		<div class="card">
			<h1>VibeNVR Telemetry</h1>
			<div id="status">Loading telemetry…</div>
		</div>
		<div class="grid" id="kpis"></div>
	</div>

	<script nonce="${nonce}">
		(async function () {
			const status = document.getElementById('status');
			const kpis = document.getElementById('kpis');
			try {
				const res = await fetch('${prefix}/api/stats');
				if (!res.ok) throw new Error('HTTP ' + res.status);
				const data = await res.json();
				status.textContent = 'Telemetry loaded';
				const entries = [
					['Active installs', data.active_installs || 0],
					['Total installs', data.total_installs || 0],
					['AI cameras', data.total_motion_ai_engine || 0],
					['Motion AI engine', data.total_motion_ai_engine || 0],
					['Cameras', data.total_cameras || 0],
					['Events', data.total_events || 0]
				];
				kpis.innerHTML = entries.map(([label, value]) => `
					<div class="kpi">
						<div class="kpi-label">${label}</div>
						<div class="kpi-value">${Number(value).toLocaleString()}</div>
					</div>
				`).join('');
			} catch (err) {
				status.textContent = 'Telemetry unavailable';
				status.style.color = '#fca5a5';
				console.error(err);
			}
		})();
	</script>
</body>
</html>`;
};
