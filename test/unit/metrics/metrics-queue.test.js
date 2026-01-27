jest.useRealTimers()

jest.mock('../../../app/metrics/metrics-calculator', () => ({
  calculateMetricsForPeriod: jest.fn()
}))

const { calculateMetricsForPeriod } = require('../../../app/metrics/metrics-calculator')
const { metricsQueue } = require('../../../app/metrics/metrics-queue')

describe('MetricsCalculationQueue (minimal)', () => {
  let consoleLogSpy
  let consoleErrorSpy
  let consoleWarnSpy

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    metricsQueue.queue.clear()
    metricsQueue.processing = false
    metricsQueue.currentCalculation = null
    if (typeof metricsQueue.pausedUntil !== 'undefined') metricsQueue.pausedUntil = 0
  })

  afterEach(() => {
    jest.useRealTimers()
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  test('processes an enqueued calculation successfully', async () => {
    calculateMetricsForPeriod.mockResolvedValue()
    const p = metricsQueue.enqueue('all', null, null)
    await p
    expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(1)
    expect(metricsQueue.getStatus().processing).toBe(false)
    expect(metricsQueue.getStatus().queueLength).toBe(0)
    expect(consoleLogSpy).toHaveBeenCalled() // ensures logs covered
  })

  test('de-duplicates enqueued requests and both promises resolve', async () => {
    const originalProcessQueue = metricsQueue.processQueue
    metricsQueue.processQueue = jest.fn()

    let resolveFn
    calculateMetricsForPeriod.mockImplementation(() => new Promise((resolve) => { resolveFn = resolve }))
    const p1 = metricsQueue.enqueue('all', null, null)
    const p2 = metricsQueue.enqueue('all', null, null)

    expect(consoleLogSpy).toHaveBeenCalledWith('Calculation all-null-null already queued, reusing existing request')
    expect(calculateMetricsForPeriod).not.toHaveBeenCalled()

    metricsQueue.processQueue = originalProcessQueue.bind(metricsQueue)
    metricsQueue.processQueue()
    await Promise.resolve()
    expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(1)

    resolveFn()
    await Promise.all([p1, p2])
    expect(metricsQueue.getStatus().queueLength).toBe(0)
    expect(consoleLogSpy).toHaveBeenCalled()
  })

  test('reuses current processing promise when enqueued during processing', async () => {
    let resolveFn
    calculateMetricsForPeriod.mockImplementation(() => new Promise((resolve) => { resolveFn = resolve }))

    const p1 = metricsQueue.enqueue('all', 2024, 6)
    await Promise.resolve()
    expect(metricsQueue.currentCalculation).not.toBeNull()

    const p2 = metricsQueue.enqueue('all', 2024, 6)

    expect(consoleLogSpy).toHaveBeenCalledWith('Calculation all-2024-6 currently processing, waiting for completion')
    expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(1)

    resolveFn()
    await Promise.all([p1, p2])
  })

  test('rejects promise when calculation fails', async () => {
    calculateMetricsForPeriod.mockRejectedValue(new Error('calc-failed'))
    const p = metricsQueue.enqueue('all', null, null)
    await expect(p).rejects.toThrow('calc-failed')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  test('processes multiple queued items in order', async () => {
    jest.useRealTimers()
    const order = []
    calculateMetricsForPeriod
      .mockImplementationOnce(async () => { order.push('first') })
      .mockImplementationOnce(async () => { order.push('second') })

    const p1 = metricsQueue.enqueue('all', 2023, 1)
    const p2 = metricsQueue.enqueue('monthInYear', 2023, 2)

    await Promise.all([p1, p2])
    expect(order).toEqual(['first', 'second'])
    jest.useFakeTimers()
  })

  test('getStatus returns sensible fields and queued ids', async () => {
    calculateMetricsForPeriod.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10)))
    metricsQueue.enqueue('all', null, null)
    metricsQueue.enqueue('monthInYear', 2022, 2)
    const status = metricsQueue.getStatus()
    expect(typeof status.queueLength).toBe('number')
    expect(Array.isArray(status.queuedCalculations)).toBe(true)
    expect(typeof status.processing === 'boolean').toBe(true)

    jest.runAllTimers()
    await Promise.resolve()
  })

  test('getCalculationId produces expected format', () => {
    const id = metricsQueue.getCalculationId('periodType', 2025, 10)
    expect(id).toBe('periodType-2025-10')
    const id2 = metricsQueue.getCalculationId('periodType', null, null)
    expect(id2).toBe('periodType-null-null')
  })
})
