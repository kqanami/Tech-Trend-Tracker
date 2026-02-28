# Performance Testing with k6

## Overview
The project includes two k6 test scripts designed to assess system performance, stability, and capacity.

| Script | Purpose | Max VUs | Duration |
|--------|---------|---------|----------|
| `k6_load_test.js` | Standard load test | 50 | ~2 min |
| `k6_stress_test.js` | Stress / breaking point | 300 | ~7 min |

## Installation

Download k6: https://k6.io/docs/getting-started/installation/

```bash
# Windows (Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo apt-get install k6
```

## Running Tests

Make sure your backend is running (`docker compose up` or `npm run dev` + uvicorn).

```bash
# Standard load test (50 VUs)
k6 run tests/load/k6_load_test.js

# Stress test (up to 300 VUs)
k6 run tests/load/k6_stress_test.js

# Point to production/staging server
k6 run -e BASE_URL=https://your-domain.com tests/load/k6_load_test.js

# Export results to JSON for reporting
k6 run --out json=load_results.json tests/load/k6_load_test.js
```

## Key Metrics & SLOs

| Metric | Threshold | Description |
|--------|-----------|-------------|
| `http_req_duration p(95)` | < 2000ms | 95th percentile response time |
| `http_req_failed` | < 5% | HTTP error rate |
| `error_rate` | < 5% | Application-level errors |

## Sample Output

```
✓ articles: status 200
✓ trends: status 200
✓ search: status 200
✓ repos: status 200
✓ dashboard: status 200

checks.........................: 98.20% ✓ 4910 ✗ 90
data_received..................: 45 MB  375 kB/s
data_sent......................: 1.2 MB 10 kB/s
http_req_duration..............: avg=312ms min=45ms  med=245ms max=3.2s  p(90)=780ms p(95)=1.1s
http_req_failed................: 1.80%  ✓ 90 ✗ 4910
http_reqs......................: 5000   41.67/s
```

## Interpreting Results

- **avg response < 500ms** → Excellent
- **p(95) < 2s** → Meets SLO
- **error rate < 1%** → Production-ready
- **error rate > 10%** → Investigate bottlenecks (DB, memory, CPU)
