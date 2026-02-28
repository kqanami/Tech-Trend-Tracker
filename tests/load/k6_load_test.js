/**
 * k6 Load Test — Tech Trend Tracker API
 *
 * Tests: Articles, Trends, GitHub Repos, Search
 * Target: 50 concurrent users, 2 minutes
 *
 * Run: k6 run tests/load/k6_load_test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Custom Metrics ────────────────────────────────────────────────────────────
const errorRate = new Rate('error_rate');
const articlesDuration = new Trend('articles_duration', true);
const trendsDuration = new Trend('trends_duration', true);
const searchDuration = new Trend('search_duration', true);
const requestCount = new Counter('requests_total');

// ── Options ───────────────────────────────────────────────────────────────────
export const options = {
    stages: [
        { duration: '30s', target: 10 },   // Ramp up
        { duration: '1m', target: 50 },   // Steady load
        { duration: '30s', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests < 2s
        http_req_failed: ['rate<0.05'],  // < 5% error rate
        error_rate: ['rate<0.05'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// ── Test Scenarios ─────────────────────────────────────────────────────────────
export default function () {
    requestCount.add(1);

    // 1. Articles list
    const articlesRes = http.get(`${BASE_URL}/api/v1/articles?page=1&page_size=20`);
    articlesDuration.add(articlesRes.timings.duration);
    check(articlesRes, {
        'articles: status 200': (r) => r.status === 200,
        'articles: has items': (r) => r.json('total') > 0,
    }) || errorRate.add(1);

    sleep(0.5);

    // 2. Trends list
    const trendsRes = http.get(`${BASE_URL}/api/v1/trends?page_size=20`);
    trendsDuration.add(trendsRes.timings.duration);
    check(trendsRes, {
        'trends: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.5);

    // 3. Search
    const queries = ['AI', 'Python', 'React', 'Docker', 'Kubernetes'];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const searchRes = http.get(`${BASE_URL}/api/v1/articles?search=${q}&page_size=10`);
    searchDuration.add(searchRes.timings.duration);
    check(searchRes, {
        'search: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.5);

    // 4. Repositories
    const reposRes = http.get(`${BASE_URL}/api/v1/repositories?page_size=20`);
    check(reposRes, {
        'repos: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.5);

    // 5. Dashboard stats
    const dashRes = http.get(`${BASE_URL}/api/v1/dashboard/stats`);
    check(dashRes, {
        'dashboard: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);
}
