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
			// Extract data from query parameters
			const instance_id = url.searchParams.get('instance_id') || 'unknown';
			const version = url.searchParams.get('version') || 'unknown';
			const os = url.searchParams.get('os') || 'unknown';
			const arch = url.searchParams.get('arch') || 'unknown';
			const cpu_model = url.searchParams.get('cpu_model') || 'unknown';

			// Extract country gracefully from Cloudflare headers (No IPs saved!)
			const country = request.cf?.country || 'Unknown';

			// Parse numbers
			const cpu = parseInt(url.searchParams.get('cpu') || '0', 10);
			const ram = parseInt(url.searchParams.get('ram') || '0', 10);
			const cameras = parseInt(url.searchParams.get('cameras') || '0', 10);
			const groups = parseInt(url.searchParams.get('groups') || '0', 10);
			const events = parseInt(url.searchParams.get('events') || '0', 10);

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

		// 2. DASHBOARD PUBLIC API (Reads data via GraphQL securely server-side)
		if (url.pathname === '/api/stats') {
			if (!env.ACCOUNT_ID || !env.API_TOKEN) {
				return new Response(JSON.stringify({ error: "Cloudflare API credentials not configured." }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Query past 7 days for Active installs, vs 90 days for generic stats
			const activeQueryStr = `
			query {
				viewer {
					accounts(filter: {accountTag: "${env.ACCOUNT_ID}"}) {
						active_installs: analyticsEngineEventsAdaptiveGroups(
							filter: {
								dataset: "vibenvr_telemetry_events", 
								datetime_geq: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
							},
							limit: 10000
						) {
							dimensions {
								blob1
							}
						}
						total_installs: analyticsEngineEventsAdaptiveGroups(
							filter: {
								dataset: "vibenvr_telemetry_events"
							},
							limit: 10000
						) {
							dimensions {
								blob1
							}
						}
						versions: analyticsEngineEventsAdaptiveGroups(
							filter: { dataset: "vibenvr_telemetry_events" },
							limit: 50,
							orderBy: [count_DESC]
						) {
							dimensions { blob2 }
							count
						}
						countries: analyticsEngineEventsAdaptiveGroups(
							filter: { dataset: "vibenvr_telemetry_events" },
							limit: 50,
							orderBy: [count_DESC]
						) {
							dimensions { blob6 }
							count
						}
						cpus: analyticsEngineEventsAdaptiveGroups(
							filter: { dataset: "vibenvr_telemetry_events" },
							limit: 50,
							orderBy: [count_DESC]
						) {
							dimensions { blob5 }
							count
						}
					}
				}
			}`;

			try {
				const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${env.API_TOKEN}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ query: activeQueryStr }),
				});

				const rawData = await response.json();
				if (rawData.errors) {
					console.error("GraphQL Errors:", rawData.errors);
					throw new Error("Failed to fetch GraphQL data");
				}

				const acctData = rawData.data?.viewer?.accounts?.[0];

				// Count unique blob1 (instance_ids) for active
				const activeSet = new Set((acctData?.active_installs || []).map(r => r.dimensions.blob1).filter(b => b && b !== 'unknown'));
				const totalSet = new Set((acctData?.total_installs || []).map(r => r.dimensions.blob1).filter(b => b && b !== 'unknown'));

				const stats = {
					active_installs: activeSet.size,
					total_installs: totalSet.size,
					versions: (acctData?.versions || []).map(r => ({ name: r.dimensions.blob2 || 'unknown', count: r.count })),
					countries: (acctData?.countries || []).map(r => ({ name: r.dimensions.blob6 || 'unknown', count: r.count })),
					cpus: (acctData?.cpus || []).map(r => ({ name: r.dimensions.blob5 || 'unknown', count: r.count })),
				};

				return new Response(JSON.stringify(stats), {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					}
				});
			} catch (err) {
				console.error(err);
				return new Response(JSON.stringify({ error: err.message }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		// 3. HTML DASHBOARD PAGE
		if (url.pathname === '/dashboard' || url.pathname === '/') {
			const htmlTemplate = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>VibeNVR Telemetry Dashboard</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
	<script src="https://cdn.tailwindcss.com"></script>
	<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
	<script>
		tailwind.config = { 
			darkMode: 'class', 
			theme: { 
				extend: { 
					fontFamily: {
						sans: ['Inter', 'sans-serif'],
					},
					colors: { 
						background: 'hsl(var(--background))',
						foreground: 'hsl(var(--foreground))',
						card: 'hsl(var(--card))',
						'card-foreground': 'hsl(var(--card-foreground))',
						primary: 'hsl(var(--primary))',
						'primary-foreground': 'hsl(var(--primary-foreground))',
						border: 'hsl(var(--border))',
						muted: 'hsl(var(--muted))',
						'muted-foreground': 'hsl(var(--muted-foreground))',
					},
					borderRadius: {
						lg: '0.5rem',
						xl: '0.75rem',
						'2xl': '1rem',
					}
				} 
			} 
		}
	</script>
	<style>
		:root {
			--background: 222.2 84% 4.9%;
			--foreground: 210 40% 98%;
			--card: 222.2 84% 4.9%;
			--card-foreground: 210 40% 98%;
			--primary: 217.2 91.2% 59.8%;
			--primary-foreground: 222.2 47.4% 11.2%;
			--border: 217.2 32.6% 17.5%;
			--muted: 217.2 32.6% 17.5%;
			--muted-foreground: 215 20.2% 65.1%;
		}
		body { 
			background-color: hsl(var(--background)); 
			color: hsl(var(--foreground)); 
			font-family: 'Inter', sans-serif; 
		}
		.card { 
			background-color: hsl(var(--card)); 
			border: 1px solid hsl(var(--border)); 
			border-radius: 0.75rem; /* rounded-xl */
			padding: 1.5rem; 
			transition: all 0.2s; 
		}
		.card:hover { 
			border-color: hsl(var(--primary) / 0.5); 
			box-shadow: 0 4px 20px rgba(0,0,0,0.4); 
		}
		.btn-outline {
			border: 1px solid hsl(var(--border));
			background: transparent;
			border-radius: 0.5rem; /* rounded-lg */
			padding: 0.25rem 0.75rem;
			color: hsl(var(--foreground));
			transition: all 0.2s;
		}
		.btn-outline:hover {
			background: hsl(var(--muted));
		}
		.gradient-text { 
			background: linear-gradient(90deg, hsl(var(--primary)), #a78bfa); 
			-webkit-background-clip: text; 
			-webkit-text-fill-color: transparent; 
		}
	</style>
</head>
<body class="min-h-screen p-6 antialiased">
	<div class="max-w-7xl mx-auto flex flex-col gap-6">
		<header class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-border">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground mb-1"><span class="gradient-text">VibeNVR</span> Telemetry</h1>
				<p class="text-sm text-muted-foreground">Anonymous global usage statistics for the open-source NVR.</p>
			</div>
			<div class="mt-4 sm:mt-0 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border">
				<span class="relative flex h-2 w-2">
				  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
				  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
				</span>
				Live Analytics connected
			</div>
		</header>

		<!-- Loading State -->
		<div id="loader" class="flex justify-center items-center py-20">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
		</div>

		<!-- Error State -->
		<div id="error-msg" class="hidden bg-destructive/20 border border-destructive/50 text-destructive-foreground p-4 rounded-xl flex justify-between items-center">
			<span>Failed to load telemetry data. Check your Cloudflare API credentials.</span>
			<button onclick="fetchStats()" class="btn-outline text-sm">Retry</button>
		</div>

		<!-- Dashboard Grid -->
		<div id="dashboard" class="hidden flex flex-col gap-6">
			<!-- Top KPIs -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="card flex flex-col justify-center">
					<h3 class="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Active Installations (7 days)</h3>
					<div class="text-5xl font-extrabold text-foreground" id="kpi-active">-</div>
				</div>
				<div class="card flex flex-col justify-center">
					<h3 class="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Total Installations (All Time)</h3>
					<div class="text-5xl font-extrabold text-primary" id="kpi-total">-</div>
				</div>
			</div>

			<!-- Charts Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Countries -->
				<div class="card">
					<h3 class="text-lg font-semibold text-foreground mb-4">Top Countries</h3>
					<div class="relative h-64"><canvas id="chart-countries"></canvas></div>
				</div>

				<!-- Versions -->
				<div class="card">
					<h3 class="text-lg font-semibold text-foreground mb-4">Active Versions</h3>
					<div class="relative h-64"><canvas id="chart-versions"></canvas></div>
				</div>

				<!-- CPUs -->
				<div class="card lg:col-span-2">
					<h3 class="text-lg font-semibold text-foreground mb-4">Popular CPU Models</h3>
					<div class="relative h-72"><canvas id="chart-cpus"></canvas></div>
				</div>
			</div>
			
			<footer class="mt-8 text-center text-xs text-muted-foreground border-t border-border pt-6">
				Driven by Cloudflare Workers Analytics Engine. No IP addresses or personal data are collected. <br/>
				All metrics represent anonymous aggregate counts.
			</footer>
		</div>
	</div>

	<script>
		// Global Chart Defaults matching VibeNVR design
		const getColor = (cssVar) => \`hsl(\${getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()})\`;
		
		Chart.defaults.color = getColor('--muted-foreground');
		Chart.defaults.borderColor = getColor('--border');
		Chart.defaults.font.family = 'Inter, sans-serif';
		
		let charts = {};

		async function fetchStats() {
			document.getElementById('loader').classList.remove('hidden');
			document.getElementById('dashboard').classList.add('hidden');
			document.getElementById('error-msg').classList.add('hidden');

			try {
				const res = await fetch('/api/stats');
				if (!res.ok) throw new Error('API Error');
				const data = await res.json();
				if (data.error) throw new Error(data.error);
				
				renderDashboard(data);
			} catch (e) {
				console.error(e);
				document.getElementById('loader').classList.add('hidden');
				document.getElementById('error-msg').classList.remove('hidden');
			}
		}

		function prepData(list, labelKey="name", valueKey="count", limit=6) {
			list.sort((a,b) => b[valueKey] - a[valueKey]);
			const top = list.slice(0, limit);
			const others = list.slice(limit).reduce((acc, curr) => acc + curr[valueKey], 0);
			if (others > 0) top.push({ [labelKey]: 'Other', [valueKey]: others });
			return {
				labels: top.map(i => i[labelKey]),
				data: top.map(i => i[valueKey])
			};
		}

		function createChart(id, type, dataObj, palette) {
			const ctx = document.getElementById(id).getContext('2d');
			if (charts[id]) charts[id].destroy();
			
			const isBar = type === 'bar';
			const cardBg = getColor('--card');
			const borderCol = getColor('--border');
			
			charts[id] = new Chart(ctx, {
				type: type,
				data: {
					labels: dataObj.labels,
					datasets: [{
						data: dataObj.data,
						backgroundColor: palette,
						borderWidth: isBar ? 0 : 2,
						borderColor: cardBg,
						borderRadius: isBar ? 6 : 0 // slight rounding for bars
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { 
							display: !isBar, 
							position: 'right',
							labels: { color: getColor('--foreground'), padding: 20 }
						},
						tooltip: {
							backgroundColor: cardBg,
							titleColor: getColor('--foreground'),
							bodyColor: getColor('--muted-foreground'),
							borderColor: borderCol,
							borderWidth: 1,
							padding: 12,
							cornerRadius: 8 // rounded-lg
						}
					},
					scales: isBar ? {
						x: { grid: { display: false } },
						y: { beginAtZero: true, grid: { color: borderCol } }
					} : { x: {display: false}, y: {display: false} }
				}
			});
		}

		function renderDashboard(data) {
			document.getElementById('kpi-active').innerText = data.active_installs || "0";
			document.getElementById('kpi-total').innerText = data.total_installs || "0";

			const primaryColor = getColor('--primary');
			
			// Generate a monochromatic-leaning palette based on the primary color and grays
			const barPalette = [
				primaryColor, 
				getColor('--muted-foreground'), 
				'hsl(217.2 91.2% 45%)', 
				'hsl(217.2 91.2% 70%)', 
				'hsl(215 20.2% 50%)', 
				'hsl(215 20.2% 35%)', 
				getColor('--border')
			];
			const piePalette = [
				primaryColor, 
				'hsl(217.2 91.2% 75%)', 
				'hsl(217.2 91.2% 45%)', 
				getColor('--muted-foreground'), 
				'hsl(215 20.2% 50%)', 
				'hsl(215 20.2% 35%)', 
				getColor('--border')
			];

			createChart('chart-countries', 'doughnut', prepData(data.countries), piePalette);
			createChart('chart-versions', 'bar', prepData(data.versions), barPalette[0]);
			createChart('chart-cpus', 'bar', prepData(data.cpus, 'name', 'count', 10), piePalette);

			document.getElementById('loader').classList.add('hidden');
			document.getElementById('dashboard').classList.remove('hidden');
		}

		// Init
		fetchStats();
	</script>
</body>
</html>`;

			return new Response(htmlTemplate, {
				headers: { 'Content-Type': 'text/html;charset=UTF-8' }
			});
		}

		// Fallback for unknown routes
		return new Response("Not Found", { status: 404 });
	},
};
