const routes = [].concat(
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/metrics'),
  require('../routes/statements')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server) => {
      server.route(routes)
    }
  }
}
