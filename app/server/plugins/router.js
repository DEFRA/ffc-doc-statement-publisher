const healthyRoutes = require('../routes/healthy')
const healthzRoutes = require('../routes/healthz')
const metricsRoutes = require('../routes/metrics')
const statementsModule = require('../routes/statements')
const returnedLettersRoute = require('../routes/returned-letters')

const routes = [].concat(
  healthyRoutes,
  healthzRoutes,
  metricsRoutes,
  Array.isArray(statementsModule) ? statementsModule : statementsModule.routes,
  returnedLettersRoute
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server) => {
      server.route(routes)
    }
  }
}
