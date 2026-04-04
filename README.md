# YEMO API

High-performance, scalable, and secure API infrastructure built with the Hono framework and Node.js. Designed for developers who require a professional, modular, and high-performance base for their services.

---

## Technical Architecture

The system is built on a modern, lightweight, and type-safe stack designed for low latency and high scalability.

- **Engine**: Powered by Hono and @hono/node-server.
- **Validation**: Schema-based validation using Zod and @hono/zod-openapi.
- **Documentation**: Automatic OpenAPI (Swagger) generation.
- **Portal**: Custom-built, high-performance API Portal with integrated media previews.
- **Multitasking**: Built-in Node.js Cluster support for multi-core scaling.
- **IPC-Sync**: Inter-Process Communication for unified state management across workers.

---

## Key Features

### High-Performance Core

- Optimized request handling with Hono.
- Minimal overhead for core middleware.
- JSON-first responses with optional redirect support for media assets.

### Advanced Cluster Synchronization

When running in cluster mode, the API utilizes a centralized state management system. All worker processes synchronize their internal state (including rate limits) with the primary process via IPC. This ensures that security policies are enforced consistently across all CPU cores.

### Integrated Security Layer

- **Global Rate Limiting**: Distributed counting across all workers.
- **Dynamic IP Management**: Integrated whitelist for trusted sources and a ban list for permanent blocks.
- **Intelligent Detection**: Normalized IP detection supporting reverse proxies and local variations.

### Developer Experience

- **Live Portal**: A custom, high-end technical interface for exploring and testing endpoints.
- **Code Generation**: Real-time generation of cURL, Fetch, and Python snippets.
- **Binary Support**: Native support for direct binary rendering (images/videos) in the browser.

---

## Getting Started

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yemo-dev/API.git
   cd API
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Running the Server

- **Development Mode**:

  ```bash
  npm run dev
  ```

- **Clustered Production Mode**:

  ```bash
  npm run dev:cluster
  ```

Access the API Portal at: **<http://localhost:3000>**

---

## GitHub Pages Hosting (Portal Only)

This repository includes a GitHub Actions workflow to deploy the `page/` portal to GitHub Pages.

### Enable Deployment

1. Go to **Settings → Pages** in your repository.
2. Set **Source** to **GitHub Actions**.
3. Push changes to `main` (or run the workflow manually).

### Configure API URL

Because GitHub Pages is static hosting, the API server still needs to run separately.

You can point the portal to your API using one of these methods:

- Set `window.PORTAL_CONFIG.apiBaseUrl` in `page/config.js`
- Or open the portal with query param:

```text
https://<user>.github.io/<repo>/?api=https://your-api-domain.com
```

The query parameter takes priority and is saved in local storage.

---

## Security Configuration

Configuration is managed centrally within the `src/utils/rateLimit.js` utility.

| Component | Default Configuration | Effect |
| :--- | :--- | :--- |
| **Rate Limiter** | 100 requests / 10 minutes | Returns 429 Too Many Requests |
| **Whitelist** | Internal local IPs | Bypasses all rate limit counters |
| **Ban List** | Dynamic | Returns 403 Forbidden |

---

## Developer Guide

### Adding New Routes

Routes should be defined in their respective directories under `src/api/`.

```javascript
import { createRoute, z } from '@hono/zod-openapi'
import { MediaSchema } from '../../utils/media.js'

export const exampleRoute = createRoute({
    method: 'get',
    path: '/api/example',
    description: 'Endpoint technical description',
    'x-status': 'ONLINE',
    'x-auto-media': true,
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: MediaSchema
                }
            },
            description: 'Operation successful'
        }
    }
})
```

---

## Project Structure

```text
API/
├── page/
│   └── status/       # Custom Error Pages (403, 404, 429)
├── src/
│   ├── api/          # Route and Handler Implementations
│   │   ├── stats/    # Internal stats logic
│   │   └── index.js  # Main Router setup
│   ├── utils/        # Core utilities (Security, Logger, IPC)
│   └── index.js      # Server entry point and Cluster logic
└── package.json
```

---

**Maintained by the YeMo Dev Team.**
