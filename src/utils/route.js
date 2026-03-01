export const register = (app, route, handler) => {
    app.openapi(route, (c) => {
        if (route['x-status'] === 'OFFLINE') {
            return c.json({
                error: 'Service Unavailable',
                message: 'This endpoint is currently OFFLINE.',
                status: 503
            }, 503)
        }
        return handler(c)
    })
}
