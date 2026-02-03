describe('router plugin', () => {
  let routerPlugin
  let mockHealthyRoute
  let mockHealthzRoute
  let mockMetricsRoute
  let mockStatementsRoute

  beforeEach(() => {
    jest.resetModules()

    mockHealthyRoute = { path: '/healthy', method: 'GET' }
    mockHealthzRoute = { path: '/healthz', method: 'GET' }
    mockMetricsRoute = [{ path: '/metrics', method: 'GET' }]
    mockStatementsRoute = [{ path: '/statements', method: 'GET' }]

    jest.mock('../../../../app/server/routes/healthy', () => mockHealthyRoute)
    jest.mock('../../../../app/server/routes/healthz', () => mockHealthzRoute)
    jest.mock('../../../../app/server/routes/metrics', () => mockMetricsRoute)
    jest.mock('../../../../app/server/routes/statements', () => mockStatementsRoute)

    routerPlugin = require('../../../../app/server/plugins/router')
  })

  test('exports an object', () => {
    expect(typeof routerPlugin).toBe('object')
  })

  test('has plugin property', () => {
    expect(routerPlugin).toHaveProperty('plugin')
  })

  test('plugin has name property', () => {
    expect(routerPlugin.plugin.name).toBe('router')
  })

  test('plugin has register function', () => {
    expect(typeof routerPlugin.plugin.register).toBe('function')
  })

  describe('register function', () => {
    test('registers all routes', () => {
      const mockServer = {
        route: jest.fn()
      }

      routerPlugin.plugin.register(mockServer)

      expect(mockServer.route).toHaveBeenCalledTimes(1)
      expect(mockServer.route).toHaveBeenCalledWith([
        mockHealthyRoute,
        mockHealthzRoute,
        ...mockMetricsRoute,
        ...mockStatementsRoute
      ])
    })

    test('routes array includes healthy route', () => {
      const mockServer = {
        route: jest.fn()
      }

      routerPlugin.plugin.register(mockServer)

      const routes = mockServer.route.mock.calls[0][0]
      expect(routes).toContain(mockHealthyRoute)
    })

    test('routes array includes healthz route', () => {
      const mockServer = {
        route: jest.fn()
      }

      routerPlugin.plugin.register(mockServer)

      const routes = mockServer.route.mock.calls[0][0]
      expect(routes).toContain(mockHealthzRoute)
    })

    test('routes array includes metrics route', () => {
      const mockServer = {
        route: jest.fn()
      }

      routerPlugin.plugin.register(mockServer)

      const routes = mockServer.route.mock.calls[0][0]
      expect(routes).toContain(mockMetricsRoute[0])
    })

    test('routes array includes statements route', () => {
      const mockServer = {
        route: jest.fn()
      }

      routerPlugin.plugin.register(mockServer)

      const routes = mockServer.route.mock.calls[0][0]
      expect(routes).toContain(mockStatementsRoute[0])
    })
  })
})
