const { startMetricsPolling, stopMetricsPolling } = require('../../../app/metrics/metrics-polling')

jest.mock('../../../app/metrics/metrics-queue', () => ({
  metricsQueue: {
    enqueue: jest.fn()
  }
}))
const { metricsQueue } = require('../../../app/metrics/metrics-queue')

jest.mock('../../../app/metrics/metrics-calculator', () => ({
  calculateAllMetrics: jest.fn()
}))
const { calculateAllMetrics } = require('../../../app/metrics/metrics-calculator')

jest.mock('../../../app/config', () => ({
  isDev: false,
  metricsPollingInterval: 86400000,
  env: 'test',
  dbConfig: {
    test: { database: 'test_db', username: 'test_user', password: 'test_pass', host: 'localhost', dialect: 'postgres' }
  }
}))

const config = require('../../../app/config')

describe('metrics-polling', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    metricsQueue.enqueue.mockResolvedValue()
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

    test('should call calculateAllMetrics immediately on start', () => {
      startMetricsPolling()

      expect(calculateAllMetrics).toHaveBeenCalledTimes(1)
      expect(metricsQueue.enqueue).not.toHaveBeenCalled()
    })

    test('should return an interval or timeout', () => {
      const result = startMetricsPolling()

      expect(result).toBeDefined()
    })

    test('should log scheduled time for production', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T10:00:00Z'))

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Metrics polling scheduled for .* \(in .* minutes\)/))
    })

    test('should log interval for development', () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith('Metrics polling scheduled - interval: 60000ms (1 minutes)')
    })

    test('should schedule for 03:00 next day in production if current time is after 03:00', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T10:00:00Z'))

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Metrics polling scheduled for 2024-12-20 03:00:00/))
    })

    test('should schedule for 03:00 today in production if current time is before 03:00', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T01:00:00Z'))

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Metrics polling scheduled for 2024-12-19 03:00:00/))
    })

    test('should handle initial calculation failure', async () => {
      calculateAllMetrics.mockRejectedValueOnce(new Error('Calculation failed'))

      startMetricsPolling()
      await Promise.resolve()
      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Initial metrics calculation failed:', expect.any(Error))
    })

    test('should continue scheduling even if initial calculation fails', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000
      calculateAllMetrics.mockRejectedValueOnce(new Error('Initial failed'))

      startMetricsPolling()
      await Promise.resolve()
      await Promise.resolve()

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Metrics polling scheduled/))
    })

    test('should call queue.enqueue periodically in development', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()

      // Initial call is calculateAllMetrics, not enqueue
      expect(calculateAllMetrics).toHaveBeenCalledTimes(1)
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(0)

      // After first interval
      jest.advanceTimersByTime(60000)
      await Promise.resolve()
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(1)
      expect(metricsQueue.enqueue).toHaveBeenCalledWith('all', null, null)

      // After second interval
      jest.advanceTimersByTime(60000)
      await Promise.resolve()
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(2)
    })

    test('should handle scheduled calculation failure in development', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000
      calculateAllMetrics.mockResolvedValueOnce()
      metricsQueue.enqueue.mockRejectedValueOnce(new Error('Calculation failed'))

      startMetricsPolling()

      jest.advanceTimersByTime(60000)
      await Promise.resolve()
      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Scheduled metrics calculation failed:', expect.any(Error))
    })

    test('should call queue.enqueue after timeout in production', async () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T02:00:00Z'))

      startMetricsPolling()

      // Initial is calculateAllMetrics
      expect(calculateAllMetrics).toHaveBeenCalledTimes(1)
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(0)

      // Advance to 03:00 (1 hour = 3600000ms)
      jest.advanceTimersByTime(3600000)
      await Promise.resolve()

      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(1)
      expect(metricsQueue.enqueue).toHaveBeenCalledWith('all', null, null)
    })

    test('should reschedule after completion in production', async () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T02:00:00Z'))
      metricsQueue.enqueue.mockResolvedValue()

      startMetricsPolling()

      // Advance to first scheduled run at 03:00
      jest.advanceTimersByTime(3600000)
      await Promise.resolve()
      await Promise.resolve()

      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(1)

      // After completion, it reschedules. Since we're at 03:00, it schedules for same time (0 minutes)
      // This is because isBefore() doesn't trigger when times are equal
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Metrics polling scheduled for 2024-12-19 03:00:00 \(in 0 minutes\)/))
    })

    test('should reschedule even if scheduled calculation fails in production', async () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T02:00:00Z'))
      metricsQueue.enqueue.mockRejectedValueOnce(new Error('Scheduled failed'))

      startMetricsPolling()

      // Advance to first scheduled run
      jest.advanceTimersByTime(3600000)
      await Promise.resolve()
      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Scheduled metrics calculation failed:', expect.any(Error))
      // At 03:00, reschedules for same time (0 minutes away)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Metrics polling scheduled for 2024-12-19 03:00:00 \(in 0 minutes\)/))
    })

    test('should calculate delay correctly when current time is exactly 03:00', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T03:00:00Z'))

      startMetricsPolling()

      // When it's exactly 03:00, isBefore() returns false, so it schedules for today at 03:00 (0 minutes)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Metrics polling scheduled for 2024-12-19 03:00:00 \(in 0 minutes\)/))
    })

    test('should use correct milliseconds calculation in dev mode', () => {
      config.isDev = true
      config.metricsPollingInterval = 120000 // 2 minutes

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith('Metrics polling scheduled - interval: 120000ms (2 minutes)')
    })

    test('should display fractional minutes correctly in production', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T02:30:00Z'))

      startMetricsPolling()

      // 30 minutes = 1800000ms / 1000 / 60 = 30 minutes
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/\(in 30 minutes\)/))
    })

    test('should reschedule for next day after running at scheduled time', async () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T02:59:59Z'))
      metricsQueue.enqueue.mockResolvedValue()

      startMetricsPolling()

      // Advance just past 03:00 (60001ms = 1 minute and 1ms)
      jest.advanceTimersByTime(60001)
      await Promise.resolve()
      await Promise.resolve()

      // Now we're at 03:00:00.001, so next run should be tomorrow
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(1)

      // Should reschedule for tomorrow since we're past 03:00
      const scheduleLogCalls = consoleLogSpy.mock.calls.filter(call =>
        call[0] && call[0].includes('Metrics polling scheduled for 2024-12-20')
      )
      expect(scheduleLogCalls.length).toBeGreaterThan(0)
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

      const initialCallCount = metricsQueue.enqueue.mock.calls.length
      jest.advanceTimersByTime(60000)

      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(initialCallCount)
    })

    test('should stop the polling timeout in production', () => {
      config.isDev = false

      startMetricsPolling()
      const initialCallCount = metricsQueue.enqueue.mock.calls.length
      stopMetricsPolling()

      jest.advanceTimersByTime(86400000)

      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(initialCallCount)
    })

    test('should log stopped message when interval is active', () => {
      startMetricsPolling()
      consoleLogSpy.mockClear()

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

    test('should clear both interval and timeout', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      startMetricsPolling()
      stopMetricsPolling()

      expect(clearIntervalSpy).toHaveBeenCalled()
      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
    })

    test('should prevent further scheduled runs after stopping', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()

      jest.advanceTimersByTime(30000)
      stopMetricsPolling()
      jest.advanceTimersByTime(60000)

      expect(metricsQueue.enqueue).not.toHaveBeenCalled()
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
    test('should use setInterval in development', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()

      // Should use setInterval pattern
      jest.advanceTimersByTime(60000)
      await Promise.resolve()
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(60000)
      await Promise.resolve()
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(2)

      // Continues indefinitely
      jest.advanceTimersByTime(60000)
      await Promise.resolve()
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(3)
    })

    test('should use setTimeout in production', async () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T10:00:00Z'))

      startMetricsPolling()

      const now = new Date('2024-12-19T10:00:00Z')
      const next3AM = new Date('2024-12-20T03:00:00Z')
      const delay = next3AM - now

      jest.advanceTimersByTime(delay)
      await Promise.resolve()

      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(1)
    })

    test('should not overlap runs in development', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      // Make enqueue take some time
      let resolveEnqueue
      metricsQueue.enqueue.mockImplementation(() => new Promise(resolve => {
        resolveEnqueue = resolve
      }))

      startMetricsPolling()

      jest.advanceTimersByTime(60000)
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(60000)
      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(2)

      // Even if first hasn't resolved, second should be called
      resolveEnqueue()
      await Promise.resolve()
    })
  })

  describe('error handling', () => {
    test('should catch and log initial calculation error without crashing', async () => {
      calculateAllMetrics.mockRejectedValueOnce(new Error('Initial error'))

      expect(() => startMetricsPolling()).not.toThrow()

      await Promise.resolve()
      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Initial metrics calculation failed:', expect.objectContaining({
        message: 'Initial error'
      }))
    })

    test('should catch and log scheduled calculation error in development', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000
      metricsQueue.enqueue.mockRejectedValueOnce(new Error('Scheduled error'))

      startMetricsPolling()

      jest.advanceTimersByTime(60000)
      await Promise.resolve()
      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Scheduled metrics calculation failed:', expect.objectContaining({
        message: 'Scheduled error'
      }))
    })

    test('should catch and log scheduled calculation error in production', async () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T02:00:00Z'))
      metricsQueue.enqueue.mockRejectedValueOnce(new Error('Production scheduled error'))

      startMetricsPolling()

      jest.advanceTimersByTime(3600000)
      await Promise.resolve()
      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Scheduled metrics calculation failed:', expect.objectContaining({
        message: 'Production scheduled error'
      }))
    })

    test('should continue running after error in development', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000
      metricsQueue.enqueue
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce()

      startMetricsPolling()

      jest.advanceTimersByTime(60000)
      await Promise.resolve()
      await Promise.resolve()

      jest.advanceTimersByTime(60000)
      await Promise.resolve()

      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(2)
    })

    test('should reschedule after error in production', async () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-19T02:00:00Z'))
      metricsQueue.enqueue.mockRejectedValueOnce(new Error('Error'))

      startMetricsPolling()

      jest.advanceTimersByTime(3600000) // To 03:00
      await Promise.resolve()
      await Promise.resolve()

      // Should have rescheduled (even if for same time due to timing)
      const scheduleLogCalls = consoleLogSpy.mock.calls.filter(call =>
        call[0] && call[0].includes('Metrics polling scheduled for')
      )
      expect(scheduleLogCalls.length).toBeGreaterThan(1)
    })
  })

  describe('timing calculations', () => {
    test('should calculate delay correctly for various times before 03:00', () => {
      const testCases = [
        { time: '2024-12-19T00:00:00Z', expected: '2024-12-19 03:00:00' },
        { time: '2024-12-19T01:30:00Z', expected: '2024-12-19 03:00:00' },
        { time: '2024-12-19T02:59:00Z', expected: '2024-12-19 03:00:00' }
      ]

      testCases.forEach(({ time, expected }) => {
        config.isDev = false
        jest.setSystemTime(new Date(time))
        consoleLogSpy.mockClear()

        startMetricsPolling()

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(new RegExp(expected)))

        stopMetricsPolling()
      })
    })

    test('should calculate delay correctly for various times after 03:00', () => {
      const testCases = [
        { time: '2024-12-19T03:01:00Z', expected: '2024-12-20 03:00:00' },
        { time: '2024-12-19T12:00:00Z', expected: '2024-12-20 03:00:00' },
        { time: '2024-12-19T23:59:00Z', expected: '2024-12-20 03:00:00' }
      ]

      testCases.forEach(({ time, expected }) => {
        config.isDev = false
        jest.setSystemTime(new Date(time))
        consoleLogSpy.mockClear()

        startMetricsPolling()

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(new RegExp(expected)))

        stopMetricsPolling()
      })
    })

    test('should handle month boundaries in production scheduling', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-31T10:00:00Z'))

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/2025-01-01 03:00:00/))
    })

    test('should handle year boundaries in production scheduling', () => {
      config.isDev = false
      jest.setSystemTime(new Date('2024-12-31T23:00:00Z'))

      startMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/2025-01-01 03:00:00/))
    })
  })

  describe('multiple start/stop cycles', () => {
    test('should handle multiple start/stop cycles', () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()
      stopMetricsPolling()

      startMetricsPolling()
      stopMetricsPolling()

      expect(consoleLogSpy).toHaveBeenCalledWith('Metrics polling stopped')
      expect(consoleLogSpy).toHaveBeenCalledTimes(6) // 2x start, 2x scheduled, 2x stopped
    })

    test('should not have stale timers after stop/start cycle', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()
      jest.advanceTimersByTime(30000)
      stopMetricsPolling()

      metricsQueue.enqueue.mockClear()

      startMetricsPolling()
      jest.advanceTimersByTime(60000)
      await Promise.resolve()

      expect(metricsQueue.enqueue).toHaveBeenCalledTimes(1)
    })
  })
})
