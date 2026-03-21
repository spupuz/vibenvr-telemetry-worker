export const handleApiStats = async (env, SECURITY_HEADERS) => {
			if (!env.ACCOUNT_ID || !env.API_TOKEN) {
				return new Response(JSON.stringify({ error: "Cloudflare API credentials not configured." }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Query 1: Active instances and their latest properties (Last 30 Days)
			const sqlActive = `
				SELECT 
					blob1 as instance_id, 
					blob2 as version, 
					blob3 as os,
					blob4 as arch,
					blob6 as country, 
					blob5 as cpu,
					timestamp,
					double1 as cpu_cores,
					double2 as ram,
					double3 as cameras,
					double4 as groups,
					double5 as events,
					double6 as gpu,
					double7 as notifications
				FROM vibenvr_telemetry_events 
				WHERE timestamp >= NOW() - INTERVAL '30' DAY
			`;

			const sqlTotal = `SELECT count(DISTINCT blob1) as total FROM vibenvr_telemetry_events`;

			const sqlActivity = `
				SELECT 
					toStartOfDay(timestamp) as day,
					count() as pings,
					count(DISTINCT blob1) as uniques
				FROM vibenvr_telemetry_events 
				WHERE timestamp >= NOW() - INTERVAL '30' DAY 
				GROUP BY day
				ORDER BY day ASC
			`;

			const sqlSiteActivity = `
				SELECT 
					toStartOfDay(timestamp) as day,
					count() as pageviews,
					count(DISTINCT blob1) as uniques
				FROM vibenvr_site_events 
				WHERE timestamp >= NOW() - INTERVAL '30' DAY 
				GROUP BY day
				ORDER BY day ASC
			`;

			const sqlSiteCountries = `
				SELECT
					blob3 as country,
					count(DISTINCT blob1) as uniques
				FROM vibenvr_site_events
				WHERE timestamp >= NOW() - INTERVAL '30' DAY
				GROUP BY country
			`;

			const sqlSiteTotalVisitors = `
				SELECT count(DISTINCT blob1) as total 
				FROM vibenvr_site_events 
				WHERE timestamp >= NOW() - INTERVAL '30' DAY
			`;

			const sqlSiteTotalPageviews = `
				SELECT count() as total 
				FROM vibenvr_site_events 
				WHERE timestamp >= NOW() - INTERVAL '30' DAY
			`;

			try {
				const [resActive, resTotal, resActivity, resSiteActivity, resSiteCountries, resSiteTotalVisitors, resSiteTotalPageviews] = await Promise.all([
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlActive
					}),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlTotal
					}),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlActivity
					}),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlSiteActivity
					}).catch(() => new Response(JSON.stringify({ data: [] }))), // Don't fail the whole API if the site dataset doesn't exist yet
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlSiteCountries
					}).catch(() => new Response(JSON.stringify({ data: [] }))),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlSiteTotalVisitors
					}).catch(() => new Response(JSON.stringify({ data: [{ total: 0 }] }))),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlSiteTotalPageviews
					}).catch(() => new Response(JSON.stringify({ data: [{ total: 0 }] })))
				]);

				const activeStr = await resActive.text();
				const totalStr = await resTotal.text();
				const activityStr = await resActivity.text();
				const siteActivityStr = await resSiteActivity.text();
				const siteCountriesStr = await resSiteCountries.text();
				const siteTotalVisitorsStr = await resSiteTotalVisitors.text();
				const siteTotalPageviewsStr = await resSiteTotalPageviews.text();

				if (!resActive.ok) throw new Error("SQL API Error: " + activeStr);

				const activeData = JSON.parse(activeStr).data || [];
				const totalData = JSON.parse(totalStr).data || [];
				const activityData = JSON.parse(activityStr).data || [];
				const siteActivityData = JSON.parse(siteActivityStr).data || [];
				const siteCountriesData = JSON.parse(siteCountriesStr).data || [];
				const siteTotalVisitorsData = JSON.parse(siteTotalVisitorsStr).data || [];
				const siteTotalPageviewsData = JSON.parse(siteTotalPageviewsStr).data || [];

				let activeCount = activeData.length;

				// 3. Get Persistent Total Installs from KV, fallback to SQL if KV is not bound
				let totalCount = 0;
				let siteTotalCountAllTime = 0;
				let siteTotalHitsAllTime = 0;
				if (env.VIBENVR_IDS) {
					totalCount = parseInt(await env.VIBENVR_IDS.get('stats:total_count') || "0", 10);
					siteTotalCountAllTime = parseInt(await env.VIBENVR_IDS.get('site_stats:total_count') || "0", 10);
					siteTotalHitsAllTime = parseInt(await env.VIBENVR_IDS.get('site_stats:total_hits') || "0", 10);
				} else {
					totalCount = parseInt(totalData[0]?.total || "0", 10);
					siteTotalCountAllTime = siteTotalVisitorsData[0]?.total || 0;
					siteTotalHitsAllTime = siteTotalPageviewsData[0]?.total || 0;
				}

				// Deduplicate instances: pick the latest record for each ID based on timestamp
				const uniqueInstances = new Map();
				for (const row of activeData) {
					const id = row.instance_id;
					const ts = new Date(row.timestamp).getTime();
					const existing = uniqueInstances.get(id);

					if (!existing || ts > new Date(existing.timestamp).getTime()) {
						uniqueInstances.set(id, row);
					}
				}

				const deduplicatedData = Array.from(uniqueInstances.values());
				activeCount = deduplicatedData.length;

				const stats = {
					active_installs: activeCount,
					total_installs: Math.max(activeCount, totalCount),
					activity: activityData.map(row => ({
						date: row.day,
						pings: Number(row.pings) || 0,
						uniques: Number(row.uniques) || 0
					})),
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
					site_activity: siteActivityData.map(row => ({
						date: row.day,
						pageviews: Number(row.pageviews) || 0,
						uniques: Number(row.uniques) || 0
					})),
					site_countries: siteCountriesData.map(row => ({
						name: row.country || 'Unknown',
						count: Number(row.uniques) || 0
					})).sort((a, b) => b.count - a.count),
					site_total_visitors_30d: Number(siteTotalVisitorsData[0]?.total) || 0,
					site_total_visitors_all_time: Math.max(Number(siteTotalVisitorsData[0]?.total) || 0, siteTotalCountAllTime),
					site_total_pageviews_30d: Number(siteTotalPageviewsData[0]?.total) || 0,
					site_total_pageviews_all_time: Math.max(Number(siteTotalPageviewsData[0]?.total) || 0, siteTotalHitsAllTime)
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
						...SECURITY_HEADERS,
						'Content-Type': 'application/json',
					}
				});
			} catch (err) {
				// Generic error message to avoid leaking internal system details
				console.error("Dashboard API Error:", err);
				return new Response(JSON.stringify({ error: "Internal Server Error" }), {
					status: 500,
					headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
				});
			}
};
