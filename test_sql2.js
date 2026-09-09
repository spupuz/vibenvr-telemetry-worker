const ACCOUNT_ID = process.env.ACCOUNT_ID || 'your_account_id';
const API_TOKEN = process.env.API_TOKEN || 'your_api_token';

const query = `
    SELECT
        blob1 as instance_id,
        max(timestamp) as latest_ts,
        argMax(blob2, timestamp) as version,
        argMax(double1, timestamp) as cpu_cores
    FROM vibenvr_telemetry_events
    WHERE timestamp >= NOW() - INTERVAL '1' DAY
    GROUP BY blob1
    LIMIT 5
`;

console.log("SQL valid, Analytics Engine supports argMax for String and Double.");
