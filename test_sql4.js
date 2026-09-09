const query = `
    SELECT
        blob1 as instance_id,
        max(if(timestamp >= NOW() - INTERVAL '2' DAY AND timestamp < NOW() - INTERVAL '1' DAY, 1, 0)) as seen_prev24h
    FROM vibenvr_telemetry_events
    WHERE timestamp >= NOW() - INTERVAL '30' DAY
    GROUP BY blob1
    LIMIT 5
`;
console.log("SQL to test max(if())");
