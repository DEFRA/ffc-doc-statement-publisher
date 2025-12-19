const { startMetricsPolling, stopMetricsPolling } = require('../../app/metrics-polling')

jest.mock('../../app/metrics-calculator')
const { calculateAllMetrics } = require('../../app/metrics-calculator')

describe('metrics-polling', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    calculateAllMetrics.mockResolvedValue()
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

    test('should log starting message with interval', () => {
      process.env.METRICS_POLLING_INTERVAL_MS = '60000'

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics polling - interval: 60000ms (1 minutes)')
    })

    test('should use default interval if not set', () => {
      delete process.env.METRICS_POLLING_INTERVAL_MS

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('360000ms')
      )
    })

    test('should call calculateAllMetrics immediately on start', () => {
      startMetricsPolling()

      expect(calculateAllMetrics).toHaveBeenCalledTimes(1)
    })

    test('should return an interval', () => {
      const interval = startMetricsPolling()

      expect(interval).toBeDefined()
    })

    test('should call calculateAllMetrics periodically', () => {
      process.env.METRICS_POLLING_INTERVAL_MS = '60000'

      startMetricsPolling()

      jest.advanceTimersByTime(60000)
      expect(calculateAllMetrics).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(60000)
      expect(calculateAllMetrics).toHaveBeenCalledTimes(3)
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

    test('should handle scheduled calculation failure', async () => {
      calculateAllMetrics.mockResolvedValueOnce()
      calculateAllMetrics.mockRejectedValueOnce(new Error('Calculation failed'))

      process.env.METRICS_POLLING_INTERVAL_MS = '60000'

      startMetricsPolling()

      jest.advanceTimersByTime(60000)
      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Scheduled metrics calculation failed:',
        expect.any(Error)
      )
    })
  })

  describe('stopMetricsPolling', () => {
    test('should be a function', () => {
      expect(typeof stopMetricsPolling).toBe('function')
    })

    test('should stop the polling interval', () => {
      process.env.METRICS_POLLING_INTERVAL_MS = '60000'

      startMetricsPolling()
      stopMetricsPolling()

      const initialCallCount = calculateAllMetrics.mock.calls.length

      jest.advanceTimersByTime(60000)

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

      // Calling stop again should not throw
      expect(() => stopMetricsPolling()).not.toThrow()
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
})
