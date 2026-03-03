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
| GET | /api/stats | System CPU, RAM, Network info. | x-status |
| GET | /api/ba | Random Blue Archive image URL. | x-status |

> *Check endpoint status availability in their respective route files.*

---

## SECURITY SYSTEM

We take security seriously. This API includes a robust protection layer within `src/utils/rateLimit.js`.

| System | Default Config | Effect on Breach |
| :--- | :--- | :--- |
| **Rate Limiter** | `100 req` / `10 min` | **429** Neo-Brutalist Page |
| **IP Whitelist** | Unlimited Access | Bypasses all limits |
| **IP Ban List** | Permanent Block | **403** Access Denied Page |

> **UI Note:** Error pages are located in `page/status/` and feature a custom premium design.

---

## DEVELOPER GUIDE

### Adding a New Endpoint

We use a specific pattern to ensure **Offline/Online** status checks and **Media Previews** work automatically.

**1. Create Route File**
`src/api/example/routes.js`

```javascript
import { createRoute, z } from '@hono/zod-openapi'
import { MediaSchema } from '../../utils/media.js'

export const myRoute = createRoute({
    method: 'get',
    path: '/api/example',
    description: 'My cool media endpoint',
    'x-status': 'ONLINE', 
    'x-auto-media': true, /* magic flag */
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: MediaSchema /* standardized schema */
                }
            },
            description: 'Success'
        }
    }
})

export const myHandler = async (c) => {
    /* auto wrapper */
    return "https://example.com/image.jpg"
}
```

### Auto-Docs & Media Support

By setting `'x-auto-media': true` in your route:

- **Multi-Media Support**: If you return an array of URLs, the framework automatically formats each one and the portal renders a gallery of previews.
- **Automatic Detection**: It uses `getMediaType` internally to detect if each asset is an `image`, `video`, or `audio`.
- **Portal Previews**: The API Portal renders specialized players or viewers for every detected media asset in the response.

**If `'x-auto-media': false` (or omitted):**

- The framework still wraps string returns into a basic JSON object: `{ status: 'success', url: YOUR_STRING }`.
- **Note**: This mode does **NOT** show a media preview in the portal as it lacks the specialized `result` structure.

### Direct Binary Support

Endpoints can now return raw binary data (images, videos, etc.) directly.

- **Frontend Handling**: The API portal automatically detects binary `Content-Type` and renders a premium preview using `Blob` objects.
- **UI Logic**: When binary data is displayed, JSON-specific controls (Filter/Copy) are automatically hidden for a cleaner experience.
- **BA API Example**: `GET /api/ba` returns a standardized JSON response with image/video URL and type detection.

### Direct Link / Redirect

Need to use the API directly in an `<img>` or `<video>` tag? Just add the `redirect=true` query parameter.

**Usage:**
`GET /api/ba?redirect=true`

- **Behavior**: The API will return a **302 Redirect** directly to the raw media file.
- **Limitation**: If the endpoint returns multiple results, it will redirect to the first item.

---

## PROJECT STRUCTURE

```text
API/
├── page/
│   └── status/       # Custom 403, 404, 429, 500 Pages
├── src/
│   ├── api/          # Route Logic
│   │   ├── ba/       # Blue Archive assets
│   │   ├── stats/    # Stats endpoint logic
│   │   └── index.js  # Centralized Route Setup
│   ├── utils/        # Security & Helpers (RateLimit, Logger, Media)
│   └── index.js      # Main Entry Point (Server & Cluster)
└── package.json
```

---

<p align="center">
  <b>Built by YeMo Dev</b>
</p>
