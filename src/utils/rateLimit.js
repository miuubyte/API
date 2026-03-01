import { readFile } from 'node:fs/promises'

const clients = new Map()

const config = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    whitelist: ['127.0.0.1'],
    banList: ['']
}

export const rateLimiter = () => {
    return async (c, next) => {
        const ip = c.req.header('x-forwarded-for') || '127.0.0.1'

        if (config.banList.includes(ip)) {
            try {
                const html = await readFile('./public/errors/403.html', 'utf8')
                return c.html(html, 403)
            } catch (e) {
                return c.text('Forbidden', 403)
            }
        }

        if (config.whitelist.includes(ip)) {
            c.header('X-RateLimit-Limit', 'UNLIMITED')
            c.header('X-RateLimit-Remaining', 'UNLIMITED')
            await next()
            return
        }

        const now = Date.now()

        if (!clients.has(ip)) {
            clients.set(ip, { count: 1, resetTime: now + config.windowMs })
        } else {
            const client = clients.get(ip)
            if (now > client.resetTime) {
                clients.set(ip, { count: 1, resetTime: now + config.windowMs })
            } else {
                client.count++
                if (client.count > config.max) {
                    c.header('X-RateLimit-Limit', config.max)
                    c.header('X-RateLimit-Remaining', 0)
                    try {
                        const html = await readFile('./public/errors/429.html', 'utf8')
                        return c.html(html, 429)
                    } catch (e) {
                        return c.text('Too Many Requests', 429)
                    }
                }
            }
        }

        const clientData = clients.get(ip)
        if (clientData) {
            c.header('X-RateLimit-Limit', config.max)
            c.header('X-RateLimit-Remaining', Math.max(0, config.max - clientData.count))
        }

        await next()
    }
}
