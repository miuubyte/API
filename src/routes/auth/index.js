import { createRoute, z } from '@hono/zod-openapi'
import { apiKeys } from '../../configs/apiKeys.js'
import { ErrorSchema, RateLimitSchema, UnauthorizedSchema, ForbiddenSchema } from '../../configs/app.js'

const KeyStatusResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    key: z.string().openapi({ example: 'your_api_key_here' }),
    type: z.string().openapi({ example: 'Premium' }),
    limit: z.number().openapi({ example: 1000 }),
    description: z.string().openapi({ example: 'High performance API access' }),
    owner: z.string().openapi({ example: 'Miuu Support' })
})

export const keyStatusRoute = createRoute({
    method: 'get',
    path: '/api/auth/check',
    tags: ['auth'],
    summary: 'Check API Key Status',
    description: 'Verify your API Key and retrieve limit information.',
    security: [{ ApiKeyAuth: [] }],
    request: {
        headers: z.object({
            'x-api-key': z.string().optional().openapi({
                description: 'The API Key to check (can also be passed via query as apikey)',
                example: 'your_api_key_here'
            })
        })
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: KeyStatusResponseSchema
                }
            },
            description: 'Key is valid'
        },
        401: {
            content: {
                'application/json': {
                    schema: UnauthorizedSchema
                }
            },
            description: 'Invalid API Key'
        },
        403: {
            content: {
                'application/json': {
                    schema: ForbiddenSchema
                }
            },
            description: 'Access denied'
        },
        429: {
            content: {
                'application/json': {
                    schema: RateLimitSchema
                }
            },
            description: 'Rate limit exceeded'
        },
        500: {
            content: {
                'application/json': {
                    schema: ErrorSchema
                }
            },
            description: 'Internal Server Error'
        }
    }
})

export const keyStatusHandler = (c) => {
    const apiKey = c.req.header('x-api-key') || c.req.query('apikey') || c.req.query('apiKey');
    
    if (!apiKey) {
        // Return default guest config if no API key provided
        return c.json({
            success: true,
            key: 'Guest',
            type: 'Default',
            limit: 100,
            description: 'Default guest rate limit',
            owner: 'Guest User'
        }, 200)
    }

    const keyInfo = apiKeys.find(k => k.key === apiKey)

    if (!keyInfo) {
        return c.json({
            success: false,
            status: 401,
            error: 'Unauthorized',
            message: 'Invalid API Key'
        }, 401)
    }

    return c.json({
        success: true,
        key: apiKey,
        ...keyInfo
    }, 200)
}
