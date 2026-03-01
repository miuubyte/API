import { createRoute, z } from '@hono/zod-openapi'
import os from 'os'

export const statsRoute = createRoute({
    method: 'get',
    path: '/api/stats',
    tags: ['stats'],
    description: 'Get detailed server system information (CPU, RAM, OS, etc)',
    'x-status': 'ONLINE',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.string().openapi({ example: 'online' }),
                        system: z.object({
                            platform: z.string(),
                            release: z.string(),
                            type: z.string(),
                            arch: z.string(),
                            hostname: z.string(),
                            uptime: z.string()
                        }),
                        cpu: z.object({
                            model: z.string(),
                            speed: z.string(),
                            cores: z.number(),
                            load_avg: z.array(z.number())
                        }),
                        memory: z.object({
                            total: z.string(),
                            free: z.string(),
                            used: z.string(),
                            active_process_rss: z.string(),
                            heap_total: z.string(),
                            heap_used: z.string()
                        }),
                        network: z.record(z.array(z.object({
                            address: z.string(),
                            netmask: z.string(),
                            family: z.string(),
                            mac: z.string(),
                            internal: z.boolean()
                        }))),
                        process: z.object({
                            pid: z.number(),
                            node_version: z.string(),
                            uptime: z.string(),
                            title: z.string()
                        }),
                        time: z.string(),
                        date: z.string()
                    }),
                },
            },
            description: 'Retrieve detailed server statistics',
        },
    },
})

export const statsHandler = (c) => {

    const formatUptime = (seconds) => {
        const d = Math.floor(seconds / (3600 * 24))
        const h = Math.floor(seconds % (3600 * 24) / 3600)
        const m = Math.floor(seconds % 3600 / 60)
        const s = Math.floor(seconds % 60)
        return `${d}d ${h}h ${m}m ${s}s`
    }

    const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

    const cpus = os.cpus()
    const cpuModel = cpus[0].model
    const cpuSpeed = `${cpus[0].speed} MHz`
    const cpuCores = cpus.length

    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const processMem = process.memoryUsage()

    const data = {
        status: 'online',
        system: {
            platform: os.platform(),
            release: os.release(),
            type: os.type(),
            arch: os.arch(),
            hostname: os.hostname(),
            uptime: formatUptime(os.uptime())
        },
        cpu: {
            model: cpuModel,
            speed: cpuSpeed,
            cores: cpuCores,
            load_avg: os.loadavg()
        },
        memory: {
            total: formatBytes(totalMem),
            free: formatBytes(freeMem),
            used: formatBytes(usedMem),
            active_process_rss: formatBytes(processMem.rss),
            heap_total: formatBytes(processMem.heapTotal),
            heap_used: formatBytes(processMem.heapUsed)
        },
        network: os.networkInterfaces(),
        process: {
            pid: process.pid,
            node_version: process.version,
            uptime: formatUptime(process.uptime()),
            title: process.title
        },
        time: new Date().toLocaleTimeString('id-ID', { hour12: false }),
        date: new Date().toLocaleDateString('id-ID')
    }

    return c.json(data, 200)
}
