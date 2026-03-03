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
    app.use('*', cors({
        exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
    }))
    app.use('*', logApiRequest)
    app.use('*', prettyPrint)
    app.use('*', rateLimiter())

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

    app.use('*', serveStatic({ root: './page' }))

    app.notFound(async (c) => {
        if (c.req.path.startsWith('/api/') || c.req.path === '/docs' || c.req.header('accept')?.includes('json')) {
            return c.json({
                success: false,
                status: 404,
                error: 'Not Found',
                message: `Route ${c.req.method} ${c.req.path} not found.`
            }, 404)
        }

        try {
            const html = await readFile('./page/status/404.html', 'utf8')
            return c.html(html, 404)
        } catch (e) {
            return c.text('404 Not Found', 404)
        }
    })

    app.onError(async (err, c) => {
        logger.error(`[Error] ${err.message}`)
        if (c.req.path.startsWith('/api/') || c.req.header('accept')?.includes('json')) {
            return c.json({
                success: false,
                status: 500,
                error: 'Internal Server Error',
                message: err.message || 'An unexpected error occurred.'
            }, 500)
        }

        return c.text('Internal Server Error', 500)
    })

    const port = process.env.PORT || 3000

    serve({
        fetch: app.fetch,
        port
    }, (info) => {
        logger.ready(`Worker ${process.pid} is running on port ${info.port}`)
    })
}
