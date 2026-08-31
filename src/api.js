export const handleApiStats = async (env, SECURITY_HEADERS) => {
			if (!env.ACCOUNT_ID || !env.API_TOKEN) {
				return new Response(JSON.stringify({ error: "Cloudflare API credentials not configured." }), {
					status: 500,
					headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
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
					double7 as notifications,
					double8 as mqtt_active,
					double9 as motion_opencv,
					double10 as motion_onvif,
					double11 as motion_ai_engine,
					double12 as motion_ai,
					double13 as onvif_count,
					double14 as substream_count
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

			const sqlSiteTotals = `
				SELECT
					count(DISTINCT blob1) as total_visitors,
					count() as total_pageviews
				FROM vibenvr_site_events 
				WHERE timestamp >= NOW() - INTERVAL '30' DAY
			`;

			const sqlEventsTrend = `
				SELECT 
					day,
					sum(max_events) as events
				FROM (
					SELECT 
						toStartOfDay(timestamp) as day,
						blob1,
						max(double5) as max_events
					FROM vibenvr_telemetry_events 
					WHERE timestamp >= NOW() - INTERVAL '30' DAY 
					GROUP BY day, blob1
				)
				GROUP BY day
				ORDER BY day ASC
			`;

			try {
				// ⚡ Bolt: Optimize JSON parsing concurrency
				// By chaining .json() directly to the fetch promises, we allow V8 to begin reading and parsing
				// each individual response stream as soon as it arrives, rather than waiting for the slowest query
				// to finish TTFB before processing any data.
				const [
					activeJson, totalJson, activityJson, siteActivityJson,
					siteCountriesJson, siteTotalsJson, eventsTrendJson
				] = await Promise.all([
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlActive
					}).then(async res => {
						if (!res.ok) throw new Error("SQL API Error: " + await res.text());
						return res.json();
					}),
					// ⚡ Bolt: Conditionally skip sqlTotal fetch if KV is available, as the data is overwritten by the KV response anyway
					env.VIBENVR_IDS ? Promise.resolve({ data: [] }) : fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlTotal
					}).then(res => res.json()),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlActivity
					}).then(res => res.json()),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlSiteActivity
					}).then(res => res.json()).catch(() => ({ data: [] })), // Don't fail the whole API if the site dataset doesn't exist yet
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlSiteCountries
					}).then(res => res.json()).catch(() => ({ data: [] })),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlSiteTotals
					}).then(res => res.json()).catch(() => ({ data: [{ total_visitors: 0, total_pageviews: 0 }] })),
					fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${env.API_TOKEN}` },
						body: sqlEventsTrend
					}).then(res => res.json()).catch(() => ({ data: [] }))
				]);

				const activeData = activeJson.data || [];
				const totalData = totalJson.data || [];
				const activityData = activityJson.data || [];
				const siteActivityData = siteActivityJson.data || [];
				const siteCountriesData = siteCountriesJson.data || [];
				const siteTotalsData = siteTotalsJson.data || [];
				const eventsTrendData = eventsTrendJson.data || [];

				let activeCount = activeData.length;

				// 3. Get Persistent Total Installs from KV, fallback to SQL if KV is not bound
				let totalCount = 0;
				let siteTotalCountAllTime = 0;
				let siteTotalHitsAllTime = 0;
				if (env.VIBENVR_IDS) {
					// ⚡ Bolt: Fetch KV values concurrently to reduce network latency
					const [statsTotalCount, siteStatsTotalCount, siteStatsTotalHits] = await Promise.all([
						env.VIBENVR_IDS.get('stats:total_count'),
						env.VIBENVR_IDS.get('site_stats:total_count'),
						env.VIBENVR_IDS.get('site_stats:total_hits')
					]);

					totalCount = parseInt(statsTotalCount || "0", 10);
					siteTotalCountAllTime = parseInt(siteStatsTotalCount || "0", 10);
					siteTotalHitsAllTime = parseInt(siteStatsTotalHits || "0", 10);
				} else {
					totalCount = parseInt(totalData[0]?.total || "0", 10);
					siteTotalCountAllTime = siteTotalsData[0]?.total_visitors || 0;
					siteTotalHitsAllTime = siteTotalsData[0]?.total_pageviews || 0;
				}

				// Calcolo nazioni recenti (ultime 24 e 48 ore)
				const recent48h = Date.now() - 48 * 60 * 60 * 1000;
				const recent24h = Date.now() - 24 * 60 * 60 * 1000;

				// Deduplicate instances: pick the latest record for each ID based on timestamp
				const uniqueInstances = new Map();
				for (const row of activeData) {
					const id = row.instance_id;
					// ⚡ Bolt: Optimize date parsing (Date.parse is ~7x faster than new Date().getTime() in hot loops)
					// Cache it to avoid re-parsing for the same row
					const ts = row._ts || (row._ts = Date.parse(row.timestamp));

					let existing = uniqueInstances.get(id);

					if (!existing || ts > existing._ts) {
						// Preserve seen flags if the row is replaced by a newer record
						const seen24h = existing ? existing._seen24h : false;
						const seen48h = existing ? existing._seen48h : false;

						uniqueInstances.set(id, row);
						existing = row;

						if (seen24h) existing._seen24h = true;
						if (seen48h) existing._seen48h = true;
					}

					// Combined loop for recent 24h/48h stats
					// ⚡ Bolt: Track 24h/48h activity directly on the deduplicated row object to prevent allocating
					// temporary Maps per row which causes heavy garbage collection on large datasets
					if (ts >= recent24h) {
						existing._seen24h = true;
					} else if (ts >= recent48h) {
						existing._seen48h = true;
					}
				}

				// ⚡ Bolt: Iterate directly over Map values to avoid allocating a large intermediate array
				activeCount = uniqueInstances.size;

				const stats = {
					active_installs: activeCount,
					active_installs_24h: 0,
					active_installs_prev24h: 0,
					total_installs: Math.max(activeCount, totalCount),
					activity: activityData.map(row => ({
						date: row.day,
						pings: Number(row.pings) || 0,
						uniques: Number(row.uniques) || 0
					})),
					events_trend: eventsTrendData.map(row => ({
						date: row.day,
						events: Number(row.events) || 0
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
					total_mqtt_active: 0,
					total_motion_opencv: 0,
					total_motion_onvif: 0,
					total_motion_ai_engine: 0,
					total_motion_ai: 0,
					total_onvif_cameras: 0,
					total_substream_cameras: 0,
					motion_engines: [],
					site_activity: siteActivityData.map(row => ({
						date: row.day,
						pageviews: Number(row.pageviews) || 0,
						uniques: Number(row.uniques) || 0
					})),
					site_countries: siteCountriesData.map(row => ({
						name: row.country || 'Unknown',
						count: Number(row.uniques) || 0
					})).sort((a, b) => b.count - a.count),
					site_total_visitors_30d: Number(siteTotalsData[0]?.total_visitors) || 0,
					site_total_visitors_all_time: Math.max(Number(siteTotalsData[0]?.total_visitors) || 0, siteTotalCountAllTime),
					site_total_pageviews_30d: Number(siteTotalsData[0]?.total_pageviews) || 0,
					site_total_pageviews_all_time: Math.max(Number(siteTotalsData[0]?.total_pageviews) || 0, siteTotalHitsAllTime)
				};

				const versionCounts = {};
				const countryCounts = {};
				const cpuModelCounts = {};
				const cpuCoresCounts = {};
				const osCounts = {};
				const archCounts = {};
				const ramCounts = {};

				const countryCounts24h = {};
				const versionCounts24h = {};
				const countryCounts48_24h = {};
				const osCounts24h = {};
				const archCounts24h = {};
				let activeCount24h = 0;
				let activeCountPrev24h = 0;
				
				for (const row of uniqueInstances.values()) {
					// Aggregations
					const v = row.version || 'unknown';
					const c = row.country || 'Unknown';
					const o = row.os || 'Unknown';
					const a = row.arch || 'Unknown';

					// 24h/48h counts
					if (row._seen24h) {
						activeCount24h++;
						countryCounts24h[c] = (countryCounts24h[c] || 0) + 1;
						versionCounts24h[v] = (versionCounts24h[v] || 0) + 1;
						osCounts24h[o] = (osCounts24h[o] || 0) + 1;
						archCounts24h[a] = (archCounts24h[a] || 0) + 1;
					}
					if (row._seen48h) {
						activeCountPrev24h++;
						countryCounts48_24h[c] = (countryCounts48_24h[c] || 0) + 1;
					}

					versionCounts[v] = (versionCounts[v] || 0) + 1;
					countryCounts[c] = (countryCounts[c] || 0) + 1;
					osCounts[o] = (osCounts[o] || 0) + 1;
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
					if (Number(row.mqtt_active) > 0) stats.total_mqtt_active++;
					stats.total_motion_opencv += Number(row.motion_opencv) || 0;
					stats.total_motion_onvif += Number(row.motion_onvif) || 0;
					stats.total_motion_ai_engine += Number(row.motion_ai_engine) || 0;
					stats.total_motion_ai += Number(row.motion_ai_engine) || 0;
					stats.total_onvif_cameras += Number(row.onvif_count) || 0;
					stats.total_substream_cameras += Number(row.substream_count) || 0;

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
				
				stats.motion_engines = [
					{ name: 'AI Native', count: stats.total_motion_ai_engine },
					{ name: 'OpenCV', count: stats.total_motion_opencv },
					{ name: 'ONVIF Edge', count: stats.total_motion_onvif }
				].filter(x => x.count > 0).sort((a, b) => b.count - a.count);
				// Normalise cameras_dist to ordered array
				const bkOrder = ['0', '1', '2-3', '4-5', '6-10', '11-20', '21+'];
				stats.cameras_dist = bkOrder
					.filter(k => stats.cameras_dist && stats.cameras_dist[k])
					.map(k => ({ name: k, count: stats.cameras_dist[k] }));
				stats.countries_24h = Object.entries(countryCounts24h).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.countries_prev24h = Object.entries(countryCounts48_24h).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.versions_24h = Object.entries(versionCounts24h).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.os_24h = Object.entries(osCounts24h).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.arch_24h = Object.entries(archCounts24h).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
				stats.active_installs_24h = activeCount24h;
				stats.active_installs_prev24h = activeCountPrev24h;

				// Normalise groups_dist to ordered array
				const gbkOrder = ['0', '1', '2-3', '4-5', '6-10', '11+'];
				stats.groups_dist = gbkOrder
					.filter(k => stats.groups_dist && stats.groups_dist[k])
					.map(k => ({ name: k, count: stats.groups_dist[k] }));

				return new Response(JSON.stringify(stats), {
					headers: {
						...SECURITY_HEADERS,
						'Content-Type': 'application/json',
						'Cache-Control': 'public, s-maxage=300, max-age=60',
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
