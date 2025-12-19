describe('createServer', () => {
  let mockHapi
  let mockConfig
  let mockErrorsPlugin
  let mockRouterPlugin
  let mockLoggingPlugin
  let mockBlipp
  let server

  beforeEach(() => {
    jest.clearAllMocks()

    server = {
      register: jest.fn().mockResolvedValue(),
      route: jest.fn(),
      info: { uri: 'http://localhost:3010' }
    }

    mockHapi = {
      server: jest.fn().mockReturnValue(server)
    }

    mockConfig = {
      port: 3010,
      isDev: false
    }

    mockErrorsPlugin = { plugin: { name: 'errors' } }
    mockRouterPlugin = { plugin: { name: 'router' } }
    mockLoggingPlugin = { plugin: { name: 'logging' } }
    mockBlipp = { plugin: { name: 'blipp' } }

    jest.mock('@hapi/hapi', () => mockHapi)
    jest.mock('../../../app/config', () => mockConfig)
    jest.mock('../../../app/server/plugins/errors', () => mockErrorsPlugin)
    jest.mock('../../../app/server/plugins/router', () => mockRouterPlugin)
    jest.mock('../../../app/server/plugins/logging', () => mockLoggingPlugin)
    jest.mock('blipp', () => mockBlipp)
  })

  afterEach(() => {
    jest.resetModules()
  })

  test('createServer is a function', () => {
    const { createServer } = require('../../../app/server/server')
    expect(typeof createServer).toBe('function')
  })

  test('creates Hapi server with correct config', async () => {
    const { createServer } = require('../../../app/server/server')
    await createServer()

    expect(mockHapi.server).toHaveBeenCalledTimes(1)
    expect(mockHapi.server).toHaveBeenCalledWith({
      port: 3010,
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
  })

  test('registers plugins in correct order', async () => {
    const { createServer } = require('../../../app/server/server')
    await createServer()

    expect(server.register).toHaveBeenCalledTimes(3)
    expect(server.register.mock.calls[0][0]).toBe(mockErrorsPlugin)
    expect(server.register.mock.calls[1][0]).toBe(mockRouterPlugin)
    expect(server.register.mock.calls[2][0]).toBe(mockLoggingPlugin)
  })

  test('returns server instance', async () => {
    const { createServer } = require('../../../app/server/server')
    const result = await createServer()
    expect(result).toBe(server)
  })

  test('registers blipp plugin in development mode', async () => {
    mockConfig.isDev = true
    const { createServer } = require('../../../app/server/server')
    await createServer()

    expect(server.register).toHaveBeenCalledTimes(4)
    expect(server.register.mock.calls[3][0]).toBe(mockBlipp)
  })

  test('does not register blipp plugin in production mode', async () => {
    mockConfig.isDev = false
    const { createServer } = require('../../../app/server/server')
    await createServer()

    expect(server.register).toHaveBeenCalledTimes(3)
  })
})
