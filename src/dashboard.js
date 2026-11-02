		set('kpi-gpu',           data.gpu_enabled);
		set('kpi-notifications', data.notifications_enabled);
		set('kpi-ai',            data.total_motion_ai_engine);
		set('kpi-mqtt',          data.total_mqtt_active);
		set('kpi-onvif',         data.total_onvif_cameras);
		set('kpi-substreams',    data.total_substream_cameras);
		set('kpi-site-visitors-30d', data.site_total_visitors_30d);
		set('kpi-site-visitors-alltime', data.site_total_visitors_all_time);
		set('kpi-site-pageviews-30d', data.site_total_pageviews_30d);
		set('kpi-site-pageviews-alltime', data.site_total_pageviews_all_time);

		renderChartsIfReady();
