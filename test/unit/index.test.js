jest.mock('../../app/messaging', () => ({
  start: jest.fn(),
  stop: jest.fn()
}))

jest.mock('../../app/monitoring', () => ({
  start: jest.fn(),
  stop: jest.fn()
}))

jest.mock('../../app/storage', () => ({
  initialiseContainers: jest.fn()
}))

jest.mock('../../app/reporting', () => ({
  start: jest.fn()
}))

jest.mock('ffc-alerting-utils', () => ({
  init: jest.fn()
}))

jest.mock('../../app/insights', () => ({
  setup: jest.fn()
}))

jest.mock('../../app/metrics/metrics-polling', () => ({
  startMetricsPolling: jest.fn(),
  stopMetricsPolling: jest.fn()
}))

jest.mock('../../app/server/server', () => ({
  createServer: jest.fn().mockResolvedValue({
    start: jest.fn(),
    stop: jest.fn(),
    info: {
      uri: 'http://test-server:3010'
    }
  })
}))

const mockMessaging = require('../../app/messaging')
const mockMonitoring = require('../../app/monitoring')
const mockStorage = require('../../app/storage')
const mockReporting = require('../../app/reporting')
const mockAlerting = require('ffc-alerting-utils')
const mockInsights = require('../../app/insights')
const mockMetricsPolling = require('../../app/metrics/metrics-polling')
const mockServer = require('../../app/server/server')

const messageConfig = require('../../app/config/message')
const { DATA_PUBLISHING_ERROR } = require('../../app/constants/alerts')
const { SOURCE } = require('../../app/constants/source')

describe('app', () => {
  let consoleWarnSpy
  let consoleLogSpy
  let startup
  let signalHandlers

  beforeAll(async () => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { })
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { })

    // Capture signal handlers
    signalHandlers = {}
    const originalProcessOn = process.on
    process.on = jest.fn((signal, handler) => {
      signalHandlers[signal] = handler
      return originalProcessOn.call(process, signal, handler)
    })

    // Require and wait for the app to initialize once
    startup = require('../../app')
    await startup
  })

  afterAll(() => {
    consoleWarnSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  test('uses alerting.init when available', () => {
    expect(mockAlerting.init).toHaveBeenCalledWith({
      topic: messageConfig.alertTopic,
      source: SOURCE,
      defaultType: DATA_PUBLISHING_ERROR,
      EventPublisherClass: expect.any(Function)
    })
  })

  test('starts messaging', () => {
    expect(mockMessaging.start).toHaveBeenCalled()
  })

  test('starts monitoring', () => {
    expect(mockMonitoring.start).toHaveBeenCalled()
  })

  test('initialises reporting', () => {
    expect(mockReporting.start).toHaveBeenCalled()
  })

  test('initialises containers', () => {
    expect(mockStorage.initialiseContainers).toHaveBeenCalled()
  })

  test('sets up insights', () => {
    expect(mockInsights.setup).toHaveBeenCalled()
  })

  test('starts metrics polling', () => {
    expect(mockMetricsPolling.startMetricsPolling).toHaveBeenCalled()
  })

  test('creates and starts server', () => {
    expect(mockServer.createServer).toHaveBeenCalled()
  })

  describe('signal handlers', () => {
    test('registers SIGTERM handler', () => {
      expect(signalHandlers.SIGTERM).toBeDefined()
      expect(typeof signalHandlers.SIGTERM).toBe('function')
    })

    test('registers SIGINT handler', () => {
      expect(signalHandlers.SIGINT).toBeDefined()
      expect(typeof signalHandlers.SIGINT).toBe('function')
    })

    test('SIGTERM handler stops messaging', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { })
      jest.clearAllMocks() // Clear only for this test

      await signalHandlers.SIGTERM()

      expect(mockMessaging.stop).toHaveBeenCalled()
      expect(mockMetricsPolling.stopMetricsPolling).toHaveBeenCalled()
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockRestore()
    })

    test('SIGINT handler stops messaging', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { })
      jest.clearAllMocks() // Clear only for this test

      await signalHandlers.SIGINT()

      expect(mockMessaging.stop).toHaveBeenCalled()
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockRestore()
    })
  })
})

describe('app with alerting.init undefined', () => {
  beforeAll(() => {
    jest.resetModules()
    jest.doMock('ffc-alerting-utils', () => ({}))
  })

  test('sets environment variables when alerting.init is undefined', async () => {
    jest.doMock('../../app/messaging', () => ({
      start: jest.fn(),
      stop: jest.fn()
    }))
    jest.doMock('../../app/monitoring', () => ({
      start: jest.fn(),
      stop: jest.fn()
    }))
    jest.doMock('../../app/storage', () => ({
      initialiseContainers: jest.fn()
    }))
    jest.doMock('../../app/reporting', () => ({
      start: jest.fn()
    }))
    jest.doMock('../../app/insights', () => ({
      setup: jest.fn()
    }))
    jest.doMock('../../app/metrics/metrics-polling', () => ({
      startMetricsPolling: jest.fn(),
      stopMetricsPolling: jest.fn()
    }))
    jest.doMock('../../app/server/server', () => ({
      createServer: jest.fn().mockResolvedValue({
        start: jest.fn(),
        stop: jest.fn(),
        info: { uri: 'http://test-server:3010' }
      })
    }))

    const startup = require('../../app')
    await startup

    expect(JSON.parse(process.env.ALERT_TOPIC)).toEqual(messageConfig.alertTopic)
    expect(process.env.ALERT_SOURCE).toBe(SOURCE)
    expect(process.env.ALERT_TYPE).toBe(DATA_PUBLISHING_ERROR)
  })
})

describe('app with alerting utils error', () => {
  let warnSpy

  beforeAll(() => {
    jest.resetModules()
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { })

    jest.doMock('ffc-alerting-utils', () => {
      throw new Error('Alerting initialization failed')
    })
  })

  afterAll(() => {
    warnSpy.mockRestore()
  })

  test('warns when alerting utils fails to initialize', async () => {
    jest.doMock('../../app/messaging', () => ({
      start: jest.fn(),
      stop: jest.fn()
    }))
    jest.doMock('../../app/monitoring', () => ({
      start: jest.fn(),
      stop: jest.fn()
    }))
    jest.doMock('../../app/storage', () => ({
      initialiseContainers: jest.fn()
    }))
    jest.doMock('../../app/reporting', () => ({
      start: jest.fn()
    }))
    jest.doMock('../../app/insights', () => ({
      setup: jest.fn()
    }))
    jest.doMock('../../app/metrics/metrics-polling', () => ({
      startMetricsPolling: jest.fn(),
      stopMetricsPolling: jest.fn()
    }))
    jest.doMock('../../app/server/server', () => ({
      createServer: jest.fn().mockResolvedValue({
        start: jest.fn(),
        stop: jest.fn(),
        info: { uri: 'http://test-server:3010' }
      })
    }))

    const startup = require('../../app')
    await startup

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to initialize alerting utils:'),
      'Alerting initialization failed'
    )
  })
})
