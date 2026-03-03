import { wrapMedia } from './media.js'

export const register = (app, route, handler) => {
    app.openapi(route, async (c) => {
        if (route['x-status'] === 'OFFLINE') {
            return c.json({
                error: 'Service Unavailable',
                message: 'This endpoint is currently OFFLINE.',
                status: 503
            }, 503)
        }

        const data = await handler(c)

        if (data instanceof Response || (data && data.constructor && data.constructor.name === 'Response')) {
            return data
        }

        if (route['x-auto-media'] && c.req.query('redirect') === 'true') {
            const url = Array.isArray(data) ? (typeof data[0] === 'string' ? data[0] : data[0].url) : (typeof data === 'string' ? data : data.url)
            if (url) return c.redirect(url, 302)
        }

        if (route['x-auto-media']) {
            return c.json(wrapMedia(data), 200)
        }

        const url = typeof data === 'string' ? data : (data.url || data)
        return c.json({
            status: 'success',
            url: url
        }, 200)
    })
}
