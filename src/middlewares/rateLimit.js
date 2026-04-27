import cluster from 'node:cluster'
import { apiKeys, guestConfig, banList } from '../configs/apiKeys.js'

const clients = new Map()

const syncRateLimit = (data) => {
    return new Promise((resolve) => {
        const handler = (msg) => {
            if (msg.type === 'RATE_LIMIT_SYNC_RES' && msg.data.id === data.id) {
                process.off('message', handler)
                resolve(msg.data)
            }
        }
        process.on('message', handler)
        process.send({ type: 'RATE_LIMIT_SYNC', data })
    })
}

export const rateLimiter = () => {
    return async (c, next) => {
        const headers = c.req.header()
        let ip = headers['cf-connecting-ip'] || 
                 headers['x-forwarded-for']?.split(',')[0] || 
                 headers['x-real-ip'] || 
                 c.env?.incoming?.socket?.remoteAddress || 
                 '127.0.0.1'

        if (ip === '::1') ip = '127.0.0.1'
        if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '')

        if (banList.some(b => b === ip || b.ip === ip)) {
            const banInfo = typeof banList[0] === 'object' ? banList.find(b => b.ip === ip) : null;
            return c.json({
                success: false,
                status: 403,
                error: 'Forbidden',
                message: banInfo?.reason ? `Your IP has been banned from accessing this API. Reason: ${banInfo.reason}` : 'Your IP has been banned from accessing this API.'
            }, 403)
        }

        const apiKey = headers['x-api-key'] || c.req.query('apikey') || c.req.query('apiKey');
        const keyData = apiKeys.find(k => k.key === apiKey)

        let id = apiKey && keyData ? `key:${apiKey}` : `ip:${ip}`
        const config = keyData ? { max: keyData.limit, windowMs: keyData.windowMs } : { max: guestConfig.limit, windowMs: guestConfig.windowMs }

        if (c.req.path === '/' || c.req.path === '/docs') return await next()
        if (!c.req.path.startsWith('/api/')) return await next()

        if (config.max === 0) {
            c.header('X-RateLimit-Limit', 'UNLIMITED')
            c.header('X-RateLimit-Remaining', 'UNLIMITED')
            return await next()
        }

        const now = Date.now()
        let clientData

        if (cluster.isWorker) {
            clientData = await syncRateLimit({ id, method: c.req.method, windowMs: config.windowMs })
        } else {
            if (!clients.has(id)) {
                clients.set(id, { count: c.req.method === 'HEAD' ? 0 : 1, resetTime: now + config.windowMs })
            } else {
                const client = clients.get(id)
                if (now > client.resetTime) {
                    clients.set(id, { count: c.req.method === 'HEAD' ? 0 : 1, resetTime: now + config.windowMs })
                } else {
                    if (c.req.method !== 'HEAD') client.count++
                }
            }
            clientData = clients.get(id)
        }

        const remaining = Math.max(0, config.max - clientData.count)
        const resetSeconds = Math.ceil((clientData.resetTime - now) / 1000)

        c.header('X-RateLimit-Limit', config.max.toString())
        c.header('X-RateLimit-Remaining', remaining.toString())
        c.header('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000).toString())

        if (clientData.count > config.max) {
            c.header('Retry-After', resetSeconds.toString())
            return c.json({
                success: false,
                status: 429,
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Please try again in ${resetSeconds} seconds.`,
                retryAfter: resetSeconds
            }, 429)
        }

        await next()
    }
}

export const getClientData = async (id, windowMs) => {
    if (cluster.isWorker) {
        return await syncRateLimit({ id, method: 'HEAD', windowMs })
    }
    return clients.get(id) || { count: 0, resetTime: Date.now() + windowMs }
}
