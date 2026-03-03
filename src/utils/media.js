import { z } from '@hono/zod-openapi';
import mime from 'mime-types';

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

export const getMediaType = (url) => {
    if (!url || typeof url !== 'string') return 'unknown';

    const mimeType = mime.lookup(url);
    if (!mimeType) return 'unknown';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';

    return 'unknown';
};

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
