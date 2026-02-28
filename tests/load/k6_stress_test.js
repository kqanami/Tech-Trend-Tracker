/**
 * k6 Stress Test — Tech Trend Tracker API
 *
 * Tests maximum capacity: ramps to 200+ VUs to find the breaking point
 *
 * Run: k6 run tests/load/k6_stress_test.js
 * HTML report: k6 run --out json=results.json tests/load/k6_stress_test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const p99Duration = new Trend('p99_duration', true);

export const options = {
    stages: [
        { duration: '1m', target: 50 },  // Normal load
        { duration: '1m', target: 100 },  // Double load
        { duration: '2m', target: 200 },  // Stress: 200 VUs
        { duration: '1m', target: 300 },  // Breaking point
        { duration: '2m', target: 0 },  // Recovery
    ],
    thresholds: {
        http_req_duration: ['p(99)<5000'], // SLO: 99% < 5s even under stress
        http_req_failed: ['rate<0.15'],  // Accept up to 15% errors under extreme load
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
    // Mix of heavy and light requests to simulate real traffic
    const roll = Math.random();

    if (roll < 0.4) {
        // 40% — article list (most common)
        const r = http.get(`${BASE_URL}/api/v1/articles?page_size=20`);
        p99Duration.add(r.timings.duration);
        check(r, { 'articles OK': (r) => r.status === 200 }) || errorRate.add(1);
    } else if (roll < 0.6) {
        // 20% — full-text search (heavier)
        const terms = ['machine learning', 'cloud', 'rust', 'LLM', 'kubernetes'];
        const q = terms[Math.floor(Math.random() * terms.length)];
        const r = http.get(`${BASE_URL}/api/v1/articles?search=${encodeURIComponent(q)}`);
        p99Duration.add(r.timings.duration);
        check(r, { 'search OK': (r) => r.status === 200 }) || errorRate.add(1);
    } else if (roll < 0.8) {
        // 20% — trends (medium)
        const r = http.get(`${BASE_URL}/api/v1/trends?page_size=20`);
        p99Duration.add(r.timings.duration);
        check(r, { 'trends OK': (r) => r.status === 200 }) || errorRate.add(1);
    } else {
        // 20% — dashboard (aggregation query, heaviest)
        const r = http.get(`${BASE_URL}/api/v1/dashboard/stats`);
        p99Duration.add(r.timings.duration);
        check(r, { 'dashboard OK': (r) => r.status === 200 }) || errorRate.add(1);
    }

    sleep(0.2);
}
