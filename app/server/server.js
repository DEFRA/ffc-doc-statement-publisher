const Hapi = require('@hapi/hapi')
const config = require('../config')

const createServer = async () => {
  const server = Hapi.server({
    port: config.port,
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  // Register plugins in order
  await server.register(require('../server/plugins/errors'))
  await server.register(require('../server/plugins/router'))
  await server.register(require('../server/plugins/logging'))

  // Development-only plugins
  if (config.isDev) {
    await server.register(require('blipp'))
  }

  return server
}

module.exports = { createServer }
