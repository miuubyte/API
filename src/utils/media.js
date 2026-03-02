import { z } from '@hono/zod-openapi';
import mime from 'mime-types';

/**
 * Standardized Zod schema for media responses.
 * Used for automatic documentation in OpenAPI.
 */
export const MediaSchema = z.object({
    status: z.string().openapi({ example: 'success' }),
    result: z.union([
        z.object({
            url: z.string().openapi({ example: 'https://example.com/asset.jpg' }),
            type: z.string().openapi({ example: 'image' })
        }),
        z.array(z.object({
            url: z.string().openapi({ example: 'https://example.com/asset.jpg' }),
            type: z.string().openapi({ example: 'image' })
        }))
    ])
});

/**
 * Advanced utility for media type detection using mime-types.
 * Supports a vast range of industrial file formats.
 */
export const getMediaType = (url) => {
    if (!url || typeof url !== 'string') return 'unknown';

    const mimeType = mime.lookup(url);
    if (!mimeType) return 'unknown';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';

    return 'unknown';
};

/**
 * Wraps raw data into a standardized media response object.
 * Supports passing a single URL string, an object, or an array of URLs/objects.
 */
export const wrapMedia = (data) => {
    const formatItem = (item) => {
        const url = typeof item === 'string' ? item : item.url;
        return {
            url,
            type: getMediaType(url)
        };
    };

    const result = Array.isArray(data) ? data.map(formatItem) : formatItem(data);

    return {
        status: 'success',
        result
    };
};
