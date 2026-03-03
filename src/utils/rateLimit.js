import { readFile } from 'node:fs/promises'

const clients = new Map()

const config = {
    windowMs: 10 * 60 * 1000,
    max: 100,
    whitelist: ['127.0.0.1', '::1', '::ffff:127.0.0.1'],
    banList: ['']
}

export const rateLimiter = () => {
    return async (c, next) => {
        const ip = c.req.header('x-forwarded-for')?.split(',')[0] ||
            c.req.header('x-real-ip') ||
            c.env?.incoming?.socket?.remoteAddress ||
            '127.0.0.1'

        if (config.banList.includes(ip)) {
            return c.json({
                success: false,
                status: 403,
                error: 'Forbidden',
                message: 'Your IP has been banned from accessing this API.'
            }, 403)
        }

        if (config.whitelist.includes(ip)) {
            c.header('X-RateLimit-Limit', 'UNLIMITED')
            c.header('X-RateLimit-Remaining', 'UNLIMITED')
            await next()
            return
        }

        const now = Date.now()

        if (!clients.has(ip)) {
            /* status detection */
            clients.set(ip, { count: c.req.method === 'HEAD' ? 0 : 1, resetTime: now + config.windowMs })
        } else {
            const client = clients.get(ip)
            if (now > client.resetTime) {
                clients.set(ip, { count: c.req.method === 'HEAD' ? 0 : 1, resetTime: now + config.windowMs })
            } else {
                if (c.req.method !== 'HEAD') {
                    client.count++
                }

                if (client.count > config.max) {
                    const retryAfter = Math.ceil((client.resetTime - now) / 1000);
                    c.header('X-RateLimit-Limit', config.max.toString())
                    c.header('X-RateLimit-Remaining', '0')
                    c.header('Retry-After', retryAfter.toString());

                    const formatTime = (s) => {
                        const h = Math.floor(s / 3600);
                        const m = Math.floor((s % 3600) / 60);
                        const sec = s % 60;
                        const parts = [];
                        if (h > 0) parts.push(`${h} hours`);
                        if (m > 0) parts.push(`${m} minutes`);
                        if (sec > 0 || parts.length === 0) parts.push(`${sec} seconds`);
                        return parts.join(', ');
                    };

                    const timeStr = formatTime(retryAfter);

                    if (c.req.path.startsWith('/api/') || c.req.header('accept')?.includes('json')) {
                        return c.json({
                            success: false,
                            status: 429,
                            error: 'Too Many Requests',
                            message: `Rate limit exceeded. Please try again in ${timeStr}.`,
                            retryAfter
                        }, 429);
                    }

                    return c.text(`Too Many Requests. Retry after ${timeStr}.`, 429);
                }
            }
        }

        const clientData = clients.get(ip)
        if (clientData) {
            c.header('X-RateLimit-Limit', config.max.toString())
            c.header('X-RateLimit-Remaining', Math.max(0, config.max - clientData.count).toString())
        }

        await next()
    }
}
