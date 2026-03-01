import { statsRoute, statsHandler } from './stats/routes.js'

import { register } from '../utils/route.js'

export const setupRoutes = (app) => {
    register(app, statsRoute, statsHandler)
}
