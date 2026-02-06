const healthyRoutes = require('../routes/healthy')
const healthzRoutes = require('../routes/healthz')
const metricsRoutes = require('../routes/metrics')
const statementsModule = require('../routes/statements')

const routes = [].concat(
  healthyRoutes,
  healthzRoutes,
  metricsRoutes,
  Array.isArray(statementsModule) ? statementsModule : statementsModule.routes
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server) => {
      server.route(routes)
    }
  }
}
