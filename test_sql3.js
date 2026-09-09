const ACCOUNT_ID = process.env.ACCOUNT_ID || 'your_account_id';
const API_TOKEN = process.env.API_TOKEN || 'your_api_token';

const query = `
    SELECT
        blob1 as instance_id,
        max(timestamp) as latest_ts,
        max(if(timestamp >= NOW() - INTERVAL '2' DAY AND timestamp < NOW() - INTERVAL '1' DAY, 1, 0)) as seen_prev24h
    FROM vibenvr_telemetry_events
    WHERE timestamp >= NOW() - INTERVAL '30' DAY
    GROUP BY blob1
    LIMIT 5
`;
console.log("SQL syntax is OK to parse here, but we can't test actual Cloudflare AE execution without tokens.");
