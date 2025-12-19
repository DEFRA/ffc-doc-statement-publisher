const { startMetricsPolling, stopMetricsPolling } = require('../../app/metrics-polling')

jest.mock('../../app/metrics-calculator')
const { calculateAllMetrics } = require('../../app/metrics-calculator')

jest.mock('../../app/config', () => ({
  isDev: false,
  metricsPollingInterval: 86400000,
  env: 'test',
  dbConfig: {
    test: {
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass',
      host: 'localhost',
      dialect: 'postgres'
    }
  }
}))

const config = require('../../app/config')

describe('metrics-polling', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    calculateAllMetrics.mockResolvedValue()
    config.isDev = false
    config.metricsPollingInterval = 86400000
  })

  afterEach(() => {
    stopMetricsPolling()
    jest.useRealTimers()
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('startMetricsPolling', () => {
    test('should be a function', () => {
      expect(typeof startMetricsPolling).toBe('function')
    })

    test('should log starting message', () => {
      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics polling')
    })

    test('should log scheduled time for production', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T10:00:00Z'))

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Metrics polling scheduled for .* \(in .* minutes\)/)
      )
    })

    test('should log interval for development', () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Metrics polling scheduled - interval: 60000ms (1 minutes)'
      )
    })

    test('should use config interval in development', () => {
      config.isDev = true
      config.metricsPollingInterval = 300000

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Metrics polling scheduled - interval: 300000ms (5 minutes)'
      )
    })

    test('should call calculateAllMetrics immediately on start', () => {
      startMetricsPolling()

      expect(calculateAllMetrics).toHaveBeenCalledTimes(1)
    })

    test('should return an interval or timeout', () => {
      const result = startMetricsPolling()

      expect(result).toBeDefined()
    })

    test('should call calculateAllMetrics periodically in development', () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()

      jest.advanceTimersByTime(60000)
      expect(calculateAllMetrics).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(60000)
      expect(calculateAllMetrics).toHaveBeenCalledTimes(3)
    })

    test('should schedule for 03:00 next day in production if current time is after 03:00', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T10:00:00Z'))

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Metrics polling scheduled for 2024-12-20 03:00:00/)
      )
    })

    test('should schedule for 03:00 today in production if current time is before 03:00', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T01:00:00Z'))

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Metrics polling scheduled for 2024-12-19 03:00:00/)
      )
    })

    test('should handle initial calculation failure', async () => {
      calculateAllMetrics.mockRejectedValueOnce(new Error('Calculation failed'))

      startMetricsPolling()

      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Initial metrics calculation failed:',
        expect.any(Error)
      )
    })

    test('should handle scheduled calculation failure in development', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000
      calculateAllMetrics.mockResolvedValueOnce()
      calculateAllMetrics.mockRejectedValueOnce(new Error('Calculation failed'))

      startMetricsPolling()

      jest.advanceTimersByTime(60000)
      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Scheduled metrics calculation failed:',
        expect.any(Error)
      )
    })

    test('should reschedule after completion in production', async () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T03:00:00Z'))
      calculateAllMetrics.mockResolvedValue()

      startMetricsPolling()

      jest.advanceTimersByTime(1000)
      await Promise.resolve()
      expect(calculateAllMetrics).toHaveBeenCalledTimes(2)
    })
  })

  describe('stopMetricsPolling', () => {
    test('should be a function', () => {
      expect(typeof stopMetricsPolling).toBe('function')
    })

    test('should stop the polling interval in development', () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()
      stopMetricsPolling()

      const initialCallCount = calculateAllMetrics.mock.calls.length

      jest.advanceTimersByTime(60000)

      expect(calculateAllMetrics).toHaveBeenCalledTimes(initialCallCount)
    })

    test('should stop the polling timeout in production', () => {
      config.isDev = false

      startMetricsPolling()
      const initialCallCount = calculateAllMetrics.mock.calls.length
      stopMetricsPolling()

      jest.advanceTimersByTime(86400000)

      expect(calculateAllMetrics).toHaveBeenCalledTimes(initialCallCount)
    })

    test('should log stopped message', () => {
      startMetricsPolling()
      stopMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith('Metrics polling stopped')
    })

    test('should handle being called when no interval is active', () => {
      expect(() => stopMetricsPolling()).not.toThrow()
    })

    test('should clear the interval reference', () => {
      startMetricsPolling()
      stopMetricsPolling()
      expect(() => stopMetricsPolling()).not.toThrow()
    })

    test('should not log stopped message when no interval is active', () => {
      consoleLogSpy.mockClear()
      stopMetricsPolling()

      expect(consoleLogSpy).not.toHaveBeenCalledWith('Metrics polling stopped')
    })
  })

  describe('module exports', () => {
    test('should export startMetricsPolling function', () => {
      expect(startMetricsPolling).toBeDefined()
      expect(typeof startMetricsPolling).toBe('function')
    })

    test('should export stopMetricsPolling function', () => {
      expect(stopMetricsPolling).toBeDefined()
      expect(typeof stopMetricsPolling).toBe('function')
    })
  })

  describe('environment-specific behavior', () => {
    test('should use setInterval in development', () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()

      jest.advanceTimersByTime(60000)
      expect(calculateAllMetrics).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(60000)
      expect(calculateAllMetrics).toHaveBeenCalledTimes(3)
    })

    test('should use setTimeout in production', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T10:00:00Z'))

      startMetricsPolling()

      const now = new Date('2024-12-19T10:00:00Z')
      const next3AM = new Date('2024-12-20T03:00:00Z')
      const delay = next3AM - now

      jest.advanceTimersByTime(delay)
      expect(calculateAllMetrics).toHaveBeenCalledTimes(2)
    })
  })
})
