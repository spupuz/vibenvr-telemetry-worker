const ACCOUNT_ID = process.env.ACCOUNT_ID || 'your_account_id';
const API_TOKEN = process.env.API_TOKEN || 'your_api_token';

// In `src/api.js`, we have these two SQL queries which could easily be combined:
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

const sqlSiteTotals = `
    SELECT
        count(DISTINCT blob1) as total_visitors,
        count() as total_pageviews
    FROM vibenvr_site_events
    WHERE timestamp >= NOW() - INTERVAL '30' DAY
`;

console.log("We can't combine them into a single row output easily unless we use subqueries, but subqueries might not be fully supported or efficient in Analytics Engine. But wait! The Bolt journal literally says to combine aggregate SQL queries to reduce edge requests.");
