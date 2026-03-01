import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { readFile } from 'node:fs/promises'
import cluster from 'node:cluster'
import os from 'node:os'

import logger from './utils/logger.js'
import { setupRoutes } from './api/index.js'

import { logApiRequest } from './utils/logApiRequest.js'
import { rateLimiter } from './utils/rateLimit.js'
import { prettyPrint } from './utils/pretty.js'

const numCPUs = os.cpus().length
const isCluster = process.argv.includes('--cluster')

if (isCluster && cluster.isPrimary) {
    logger.info(`Primary ${process.pid} is running`)
    logger.info(`Starting ${numCPUs} workers...`)

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died. Restarting...`)
        cluster.fork()
    })
} else {
    const app = new OpenAPIHono()

    app.use('*', secureHeaders())
    app.use('*', cors())
    app.use('*', logApiRequest)
    app.use('*', rateLimiter())
    app.use('*', prettyPrint)

    setupRoutes(app)

    const openApiConfig = {
        openapi: '3.0.0',
        info: {
            version: '1.0.0',
            title: 'YeMo',
            description: 'About Simple and easy to use API. ⭐️ Star to support our work!',
        },
        servers: [{ url: 'http://localhost:3000', description: 'Development Server' }]
    }

    app.doc('/docs', openApiConfig)

    app.get('/static/*', serveStatic({ root: './' }))
    app.get('/', serveStatic({ path: './public/index.html' }))
    app.get('/style.css', serveStatic({ path: './public/style.css' }))
    app.get('/app.js', serveStatic({ path: './public/app.js' }))

    app.notFound(async (c) => {
        if (c.req.path.startsWith('/api/') || c.req.path === '/docs') {
            return c.json({
                error: 'Not Found',
                message: 'The requested API endpoint does not exist.',
                path: c.req.path,
                status: 404
            }, 404)
        }

        try {
            const html = await readFile('./public/errors/404.html', 'utf8')
            return c.html(html, 404)
        } catch (e) {
            return c.text('404 Not Found', 404)
        }
    })

    app.onError(async (err, c) => {
        logger.error(`[Error] ${err.message}`)
        if (c.req.path.startsWith('/api/')) {
            return c.json({
                error: 'Internal Server Error',
                message: err.message,
                status: 500
            }, 500)
        }

        try {
            const html = await readFile('./public/errors/500.html', 'utf8')
            return c.html(html, 500)
        } catch (e) {
            return c.text('Internal Server Error', 500)
        }
    })

    const port = process.env.PORT || 3000

    serve({
        fetch: app.fetch,
        port
    }, (info) => {
        logger.ready(`Worker ${process.pid} is running on port ${info.port}`)
    })
}
