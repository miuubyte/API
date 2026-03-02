import { statsRoute, statsHandler } from './stats/routes.js'
import { blueArchiveRandomRoute, blueArchiveRandomHandler } from './ba/routes.js'

import { register } from '../utils/route.js'

export const setupRoutes = (app) => {
    register(app, statsRoute, statsHandler)
    register(app, blueArchiveRandomRoute, blueArchiveRandomHandler)
}
