# YEMO API

> **High-Performance. Scalable. Neo-Brutalist.**
> *Built with Hono, Node.js, and a focus on Developer Experience.*

---

## CORE FEATURES

| Feature | Description |
| :--- | :--- |
| **Ultrafast** | Powered by `Hono` + `Node.js` for low latency. |
| **Neo-Swagger** | Custom-designed API Portal (Not your boring swagger). |
| **Productivity** | Built-in Code Snippets (cURL, Fetch, Python). |
| **Accessibility** | Bookmarking (Favorites) & Precise Deep Linking. |
| **Fortified** | Built-in Rate Limiting, IP Whitelist & Ban System. |
| **Cluster Mode** | Auto-scales to use all available CPU cores. |
| **Type-Safe** | Full validation using `Zod` & `OpenAPI`. |
| **Modular** | Clean architecture for easy scalability. |

---

## PORTAL FEATURES

Our custom UI is designed for high-performance development workflows.

| Feature | Functionality |
| :--- | :--- |
| **Favorites (⭐)** | Bookmarks endpoints with LocalStorage persistence. |
| **Code Snippets** | Real-time generation for cURL, Fetch, and Python. |
| **Spec Download** | One-click download of the `openapi.json` definition. |
| **Accordion UX** | Auto-collapses other endpoints for focused debugging. |
| **Deep Link v2** | Precision hash routing (e.g., `#/get/api/stats`). |
| **Copy Feedback** | Instant "COPIED!" visual confirmation on all actions. |

---

## QUICK START

### 1. Clone & Install

```bash
git clone https://github.com/yemo-dev/API.git
cd API
npm install
```

### 2. Run Server

```bash
npm run dev
```

> **Note:** To run in **Cluster Mode** (multi-core support), use:
>
> ```bash
> npm run dev:cluster
> ```
>
> Access Portal: **<http://localhost:3000>**

---

## API ENDPOINTS

| Method | Endpoint | Description | Status Config |
| :--- | :--- | :--- | :--- |
| `GET` | **/api/stats** | System CPU, RAM, Network info. | `x-status` |

> *Check endpoint status availability in their respective route files.*

---

## SECURITY SYSTEM

We take security seriously. This API includes a robust protection layer within `src/utils/rateLimit.js`.

| System | Default Config | Effect on Breach |
| :--- | :--- | :--- |
| **Rate Limiter** | `100 req` / `15 min` | **429** Neo-Brutalist Page |
| **IP Whitelist** | Unlimited Access | Bypasses all limits |
| **IP Ban List** | Permanent Block | **403** Access Denied Page |

> **UI Note:** Error pages are located in `public/errors/` and feature a custom premium design.

---

## DEVELOPER GUIDE

### Adding a New Endpoint

 We use a specific pattern to ensure **Offline/Online** status checks work automatically.

**1. Create Route File**
`src/api/example/routes.js`

```javascript
import { createRoute, z } from '@hono/zod-openapi'

export const myRoute = createRoute({
    method: 'get',
    path: '/api/example',
    description: 'My cool endpoint',
    'x-status': 'ONLINE', // Config Status Here
    responses: { ... }
})

export const myHandler = (c) => c.json({ hello: 'world' })
```

**2. Register in `src/api/index.js`**
> **IMPORTANT:** Add your route and handler to the `setupRoutes` function.

```javascript
import { myRoute, myHandler } from './example/routes.js'
import { register } from '../utils/route.js'

export const setupRoutes = (app) => {
    // ... existing registers
    register(app, myRoute, myHandler)
}
```

---

## PROJECT STRUCTURE

```
API/
├── public/
│   └── errors/       # Custom 403, 404, 429, 500 Pages
├── src/
│   ├── api/          # Route Logic
│   │   ├── stats/    # Stats endpoint logic
│   │   └── index.js  # Centralized Route Setup
│   ├── utils/        # Security & Helpers (RateLimit, Logger)
│   └── index.js      # Main Entry Point (Server & Cluster)
└── package.json
```

---

---

## LICENSE

Proyek ini dilisensikan di bawah **MIT License**. Lihat file [LICENSE](LICENSE) untuk detail selengkapnya.

---

<p align="center">
  <b>Built by YeMo Dev</b>
</p>
