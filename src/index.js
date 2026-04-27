import { execSync } from 'node:child_process'
import { platform } from 'node:os'
import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { renderApiReference } from '@scalar/client-side-rendering'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { serveStatic } from '@hono/node-server/serve-static'
import cluster from 'node:cluster'
import os from 'node:os'

import logger from './utils/logger.js'
import { appConfig, openApiConfig, scalarConfig } from './configs/app.js'
import { setupRoutes } from './routes/index.js'
import { logApiRequest } from './middlewares/accessLog.js'
import { rateLimiter } from './middlewares/rateLimit.js'
import { prettyPrint } from './middlewares/pretty.js'
import { buildBrandingScript } from './custom/index.js'

const port = appConfig.port

const minNodeVersion = 20
const currentVersion = parseInt(process.versions.node.split('.')[0])

if (currentVersion < minNodeVersion) {
    logger.error(`Node.js version ${process.versions.node} is not supported.`)
    logger.error(`MiuuAPI requires Node.js v${minNodeVersion} or higher to run.`)
    process.exit(1)
}

const killPort = () => {
    try {
        if (platform() === 'win32') {
            const cmd = `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"`
            execSync(cmd, { stdio: 'ignore' })
        } else {
            const commands = [`lsof -t -i:${port} | xargs kill -9`, `fuser -k ${port}/tcp`]
            for (const cmd of commands) {
                try { execSync(cmd, { stdio: 'ignore' }) } catch (e) { }
            }
        }
    } catch (e) { }
}

const numCPUs = os.cpus().length
const isCluster = process.argv.includes('--cluster')

if (cluster.isPrimary) {
    killPort()
}

if (isCluster && cluster.isPrimary) {
    logger.info(`Primary ${process.pid} is running`)
    logger.info(`Starting ${numCPUs} workers...`)

    const masterClients = new Map()

    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork()

        worker.on('message', (msg) => {
            if (msg.type === 'RATE_LIMIT_SYNC') {
                const { id, windowMs, method } = msg.data
                const now = Date.now()

                if (!masterClients.has(id)) {
                    masterClients.set(id, {
                        count: method === 'HEAD' ? 0 : 1,
                        resetTime: now + windowMs
                    })
                } else {
                    const client = masterClients.get(id)
                    if (now > client.resetTime) {
                        masterClients.set(id, {
                            count: method === 'HEAD' ? 0 : 1,
                            resetTime: now + windowMs
                        })
                    } else {
                        if (method !== 'HEAD') client.count++
                    }
                }

                const clientData = masterClients.get(id)
                worker.send({
                    type: 'RATE_LIMIT_SYNC_RES',
                    data: { id, ...clientData }
                })
            }
        })
    }

    setInterval(() => {
        const now = Date.now()
        for (const [id, data] of masterClients.entries()) {
            if (now > data.resetTime) masterClients.delete(id)
        }
    }, 10 * 60 * 1000)

    cluster.on('exit', (worker) => {
        logger.warn(`Worker ${worker.process.pid} died. Restarting...`)
        cluster.fork()
    })
} else {
    const app = new OpenAPIHono()

    app.use('*', secureHeaders())
    app.use('*', cors({
        origin: '*',
        allowHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'x-api-key', 'Authorization', 'Content-Type'],
        exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
    }))
    app.use('*', logApiRequest)
    app.use('*', prettyPrint)
    app.use('*', rateLimiter())
    app.use('/assets/*', serveStatic({ root: './src/public' }))
    app.use('/favicon.ico', serveStatic({ path: './src/public/favicon.png' }))
    app.use('/favicon.png', serveStatic({ path: './src/public/favicon.png' }))

    setupRoutes(app)

    app.openAPIRegistry.registerComponent('securitySchemes', 'ApiKeyAuth', {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Enter your custom API Key to get higher rate limits.'
    })

    app.get('/docs', (c) => {
        const url = new URL(c.req.url)
        const proto = c.req.header('x-forwarded-proto') || (url.protocol.includes('https') || c.req.header('cf-visitor')?.includes('https') ? 'https' : 'http')
        const host = c.req.header('x-forwarded-host') || c.req.header('host') || url.host
        const origin = `${proto}://${host}`
        const fullSpec = app.getOpenAPIDocument(openApiConfig)
        return c.json({
            ...fullSpec,
            servers: [
                { url: origin, description: 'Current Server' },
                ...(fullSpec.servers || []).filter(s => s.url !== origin)
            ]
        })
    })

    app.get('/', (c) => {
        const { branding, ...config } = scalarConfig
        const html = renderApiReference({
            config: { ...config, spec: { url: '/docs' } },
            pageTitle: `${appConfig.title} - Documentation Portal`
        })
        return c.html(html.replace('</body>', `${buildBrandingScript()}</body>`))
    })

    app.notFound((c) => {
        return c.json({
            success: false,
            status: 404,
            error: 'Not Found',
            message: `Route ${c.req.method} ${c.req.path} not found.`
        }, 404)
    })

    app.onError(async (err, c) => {
        logger.error(`[Error] ${err.message}`)
        return c.json({
            success: false,
            status: 500,
            error: 'Internal Server Error',
            message: err.message || 'An unexpected error occurred.'
        }, 500)
    })

    serve({ fetch: app.fetch, port: appConfig.port }, (info) => {
        logger.ready(`Worker ${process.pid} is running on port ${info.port}`)
    })
}
