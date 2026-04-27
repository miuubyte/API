/**
 * API Key Configuration
 *
 * ── Key Fields ──
 * name          — Display name for the key owner.
 * key           — The secret API key string.
 * limit         — Max requests per windowMs. Set to 0 for unlimited.
 * windowMs      — Time window in milliseconds. Default: 10 minutes.
 * expiresAt     — ISO 8601 date string. Key becomes invalid after this date.
 *                 Set to null for no expiry. Example: '2026-12-31T23:59:59Z'
 * scopes        — Array of allowed route prefixes. Empty array = access to all routes.
 *                 Example: ['/api/stats', '/api/auth'] — only these prefixes allowed.
 * endpointLimits — Per-endpoint rate limit overrides. Map of path prefix to { limit, windowMs }.
 *                  Example: { '/api/stats': { limit: 10, windowMs: 60000 } }
 *
 * ── Guest Config ──
 * limit         — Max requests per windowMs for unauthenticated users (by IP).
 * windowMs      — Time window for guest limits.
 *
 * ── Auto-Ban Config ──
 * enabled       — Toggle auto-ban feature.
 * threshold     — Number of requests per windowMs that triggers an automatic IP ban.
 * windowMs      — Time window for the auto-ban counter.
 * reason        — Reason string stored in the ban list.
 *
 * ── Ban List ──
 * String IPs    : '192.168.1.1'
 * Object format : { ip: '192.168.1.1', reason: 'Abuse' }
 */

export const apiKeys = [
    {
        name: 'Administrator',
        key: 'a8d9f1c2b3e4a5c6',
        limit: 0,
        windowMs: 10 * 60 * 1000,
        expiresAt: null,
        scopes: [],
        endpointLimits: {}
    }
]

export const guestConfig = {
    limit: 100,
    windowMs: 10 * 60 * 1000
}

export const autoBanConfig = {
    enabled: true,
    threshold: 1000,
    windowMs: 60 * 1000,
    reason: 'Automated ban: exceeded request threshold'
}

export const banList = []
