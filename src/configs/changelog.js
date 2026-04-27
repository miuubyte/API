/**
 * Changelog Configuration
 *
 * enabled   — Toggle the changelog modal on/off (true | false).
 * title     — Title shown in the modal header.
 * entries   — Array of changelog entries, newest first.
 *
 * ── Entry Fields ──
 * version   — Version string, e.g. 'v1.2.0'
 * date      — Release date string, e.g. '2026-04-27'
 * changes   — Array of change description strings.
 *             Prefix conventions:
 *               '[+]' — New feature added
 *               '[*]' — Improvement or change
 *               '[-]' — Removed feature
 *               '[!]' — Bug fix
 */

export const changelogConfig = {
    enabled: true,
    title: 'Changelog',
    entries: [
        {
            version: 'v1.2.0',
            date: '2026-04-27',
            changes: [
                '[+] Status indicator in header showing server up/down',
                '[+] Changelog modal with version history',
                '[+] Per-endpoint rate limiting',
                '[+] API key expiry and scope permissions',
                '[+] Auto IP ban on threshold exceeded',
                '[+] Daily request logging to logs/YYYY-MM-DD.log',
                '[+] Sponsor Ads modal with AnimeJS animations',
            ]
        },
        {
            version: 'v1.1.0',
            date: '2026-04-26',
            changes: [
                '[+] Rate limit indicator in navigation header',
                '[+] Toast notification for invalid API keys',
                '[+] Custom branding and preloader animation',
                '[*] MiuuAPI preloader improved with letter-by-letter animation',
                '[-] Removed legacy media endpoints',
            ]
        },
        {
            version: 'v1.0.0',
            date: '2026-04-25',
            changes: [
                '[+] Initial release of MiuuAPI Gateway',
                '[+] OpenAPI 3.1.0 documentation via Scalar',
                '[+] Global rate limiting with cluster support',
                '[+] IP ban list with reason tracking',
            ]
        }
    ]
};
