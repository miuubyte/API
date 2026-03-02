import { createRoute, z } from '@hono/zod-openapi'
import axios from 'axios'
import mime from 'mime-types'

export const blueArchiveRandomRoute = createRoute({
    method: 'get',
    path: '/api/ba/blue-archive',
    tags: ['random'],
    description: 'Get a random Blue Archive media asset directly as a buffer',
    'x-status': 'ONLINE',
    'x-auto-media': false, // Bypassing JSON framework for direct binary response
    responses: {
        200: {
            content: {
                'image/jpeg': { schema: { type: 'string', format: 'binary' } },
                'image/png': { schema: { type: 'string', format: 'binary' } },
                'video/mp4': { schema: { type: 'string', format: 'binary' } },
                'audio/mpeg': { schema: { type: 'string', format: 'binary' } }
            },
            description: 'The raw media asset buffer',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string().openapi({ example: 'Internal Server Error' }),
                        message: z.string()
                    }),
                },
            },
            description: 'Internal Server Error',
        }
    },
})

export const blueArchiveRandomHandler = async (c) => {
    try {
        const ENDPOINT = 'https://raw.githubusercontent.com/yemo-dev/blue-archive-r-img/main/links.json'
        const response = await axios.get(ENDPOINT)
        const items = response.data

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('No assets found in the database')
        }

        const randomAsset = items[Math.floor(Math.random() * items.length)]

        /* Fetch the actual binary data from the random asset URL */
        const assetResponse = await axios.get(randomAsset, { responseType: 'arraybuffer' })
        const buffer = assetResponse.data
        const contentType = mime.lookup(randomAsset) || 'application/octet-stream'

        return c.body(buffer, 200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        })
    } catch (error) {
        return c.json({
            error: 'Internal Server Error',
            message: error.message
        }, 500)
    }
}
