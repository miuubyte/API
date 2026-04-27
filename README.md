# MiuuAPI Infrastructure

MiuuAPI is a state-of-the-art API gateway and documentation infrastructure engineered for high-availability web services. Built on a modular Hono architecture with native Node.js clustering, it delivers exceptional performance, real-time monitoring, and a premium developer experience.

---

---

## Core Capabilities

### High Availability Clustering
Native implementation of the Node.js Cluster module allows for seamless multi-core process management. This ensures maximum CPU utilization, automatic worker recovery, and zero-downtime service availability under high traffic loads.

### Premium Documentation Engine
A highly customized Scalar integration featuring a glassmorphism design system. Includes a theme-aware preloader and hardware-accelerated transitions that automatically adapt to system-level light and dark mode preferences.

### Security and Rate Management
Robust security layer providing mandatory header validation, CORS policy enforcement, and a tiered rate-limiting system. Supports high-throughput access via secure API Key authentication.

---

## Technical Specifications

| Component | Technology | Role |
| :--- | :--- | :--- |
| Core Framework | Hono | Ultra-fast routing and middleware execution |
| Runtime Environment | Node.js | Asynchronous event-driven execution |
| API Specification | OpenAPI 3.1.0 | Standardized documentation and schema definition |
| Data Validation | Zod | Runtime type-safety and request validation |
| Interface Styling | Vanilla CSS | Custom-built design tokens and animations |

---

## Sponsor Ads System

MiuuAPI includes a built-in, fully configurable Sponsor Ads modal that appears after the loading animation completes. It is powered by **AnimeJS** for premium entrance and exit animations.

All settings are managed in a single file: **`src/configs/ads.js`**

### Enabling & Disabling

Set `enabled` to `true` or `false` to toggle the entire feature without touching any other code.

```javascript
enabled: false // ads are hidden
enabled: true  // ads will show after 'delayMs' milliseconds
```

### Adding Multiple Sponsors

Simply add more objects to the `sponsors` array:

```javascript
sponsors: [
  { name: 'SponsorA', type: 'Hosting Provider', ... },
  { name: 'SponsorB', type: 'CDN Provider', ... },
]
```

Each sponsor card will slide in with a staggered AnimeJS animation.

### Sponsor Type Categories

The `type` field displays a colored badge on the sponsor card. Recommended values:

| Type | Description |
| :--- | :--- |
| `Hosting Provider` | Web / cloud hosting services |
| `API Provider` | Third-party API services |
| `CDN Provider` | Content delivery network |
| `Developer Tool` | Libraries, tools, IDEs, etc. |
| `Security Partner` | VPN, firewall, DDoS protection |
| `Community Partner` | Discord, forums, communities |
| `Media Partner` | Streaming / media platforms |
| `Custom` | Any other category |

### Image Configuration

Both `logoUrl` and `bannerUrl` support **local paths** (files placed in `src/public/assets/`) and **remote URLs**.

| Field | Local Example | Remote Example | Recommended Size |
| :--- | :--- | :--- | :--- |
| `logoUrl` | `/assets/sponsor-logo.png` | `https://example.com/logo.png` | Min **72×72px**, square (displayed as 36×36 circle) |
| `bannerUrl` | `/assets/sponsor-banner.jpg` | `https://example.com/banner.jpg` | **1200×400px** (3:1 ratio), max rendered height 210px |

> [!TIP]
> For the best visual quality, use **JPEG** or **WebP** for banners and **PNG** for logos.

---

## Deployment Guide

### Prerequisites
Ensure your environment meets the following requirements:
- **Node.js** `v20.0.0` or higher
- **npm** `v10.0.0` or higher

### Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/miuubyte/API.git
cd API
npm install
```

### Execution Profiles

> [!TIP]
> Use **Cluster Performance Mode** for production environments to utilize all CPU cores and maximize throughput.

**Standard Execution** (Development / Single-Core)
```bash
npm run start
```

**Cluster Performance Mode** (Production / Multi-Core)
```bash
npm run dev:cluster
```

---

## API Reference

### Infrastructure Monitoring

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/stats` | `GET` | Detailed hardware metrics (CPU, RAM, Uptime, Network). |
| `/api/auth/check` | `GET` | Authentication token validation, tier status, and expiry info. |

---

## Security & Rate Limiting

### Per-Endpoint Rate Limits

Override the global key limit for specific routes using `endpointLimits` in `src/configs/apiKeys.js`:

```javascript
endpointLimits: {
    '/api/stats': { limit: 10,  windowMs: 60 * 1000 },  // 10 req/min
    '/api/auth':  { limit: 30,  windowMs: 60 * 1000 },  // 30 req/min
}
```

Priority: **per-endpoint override** → key global limit → guest config.

### API Key Expiry

Set `expiresAt` to an ISO 8601 date string. The key is rejected automatically after this date.

```javascript
expiresAt: '2026-12-31T23:59:59Z'  // expires end of 2026
expiresAt: null                     // no expiry
```

### API Key Scopes / Permissions

Restrict a key to only certain route prefixes. An empty array means full access.

```javascript
scopes: []                             // full access
scopes: ['/api/stats', '/api/auth']   // only these routes
```

Requests to unlisted routes will receive a `403 Forbidden` response.

### Auto IP Ban

Configured in `src/configs/apiKeys.js` under `autoBanConfig`:

```javascript
export const autoBanConfig = {
    enabled: true,
    threshold: 1000,       // requests before ban
    windowMs: 60 * 1000,   // per 1 minute
    reason: 'Automated ban: exceeded request threshold'
}
```

IPs exceeding 1000 requests/minute are automatically added to `banList` and blocked with a `403`.

### Request Logging

All API requests are automatically logged to `logs/YYYY-MM-DD.log` in newline-delimited JSON:

```json
{"ts":"2026-04-27T12:00:00.000Z","ip":"1.2.3.4","key":"abc123","path":"/api/stats","method":"GET","status":200}
```

> [!NOTE]
> The `logs/` directory is excluded from Git via `.gitignore`. Logs rotate automatically by date.

---

## Integration Example

### Standard API Request

Pass your `x-api-key` in the header or as a query parameter (`?apikey=`) to authenticate.

```bash
curl -X GET "http://localhost:4000/api/stats" \
     -H "x-api-key: your_api_token" \
     -H "Content-Type: application/json"
```

### Standard JSON Response

All responses follow a consistent, predictable JSON schema.

```json
{
  "success": true,
  "status": 200,
  "data": { ... }
}
```

---

<div align="center">
  <b>Developed by miuubyte</b><br>
  <i>Built with ❤️ for speed, reliability, and developer experience.</i>
</div>