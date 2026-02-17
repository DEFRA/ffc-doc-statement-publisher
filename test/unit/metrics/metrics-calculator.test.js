jest.mock('../../../app/metrics/get-metrics-data', () => ({
  getDateRangeForAll: jest.fn(),
  getDateRangeForYTD: jest.fn(),
  getDateRangeForYear: jest.fn(),
  getDateRangeForMonthInYear: jest.fn(),
  getDateRangeForRelativePeriod: jest.fn()
}))

jest.mock('../../../app/metrics/build-metrics', () => ({
  buildWhereClauseForDateRange: jest.fn(),
  fetchMetricsData: jest.fn()
}))

jest.mock('../../../app/metrics/create-save-metrics', () => ({
  saveMetrics: jest.fn()
}))

jest.mock('../../../app/data', () => ({
  delivery: {
    findAll: jest.fn()
  },
  statement: {},
  failure: {},
  metric: {
    upsert: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  },
  sequelize: {
    fn: jest.fn((fnName, ...args) => `${fnName}(${args.join(',')})`),
    literal: jest.fn((sql) => sql),
    col: jest.fn((col) => col)
  }
}))

const db = require('../../../app/data')
const { calculateDateRange, calculateAllMetrics, calculateMetricsForPeriod, calculateYearlyMetrics, calculateHistoricalMetrics } = require('../../../app/metrics/metrics-calculator')
const { getDateRangeForAll, getDateRangeForYTD, getDateRangeForYear, getDateRangeForMonthInYear, getDateRangeForRelativePeriod } = require('../../../app/metrics/get-metrics-data')
const { buildWhereClauseForDateRange, fetchMetricsData } = require('../../../app/metrics/build-metrics')
const { saveMetrics } = require('../../../app/metrics/create-save-metrics')
const { PERIOD_ALL, PERIOD_YTD, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY } = require('../../../app/constants/periods')

describe('metrics-calculator', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    db.delivery.findAll.mockResolvedValue([])
    db.metric.upsert.mockResolvedValue({})
    db.metric.findOne.mockResolvedValue(null)
    db.metric.update.mockResolvedValue([1])
    db.metric.create.mockResolvedValue({})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    delete process.env.METRICS_CALCULATION_YEARS
  })

  describe('calculateDateRange', () => {
    test('should call getDateRangeForAll for PERIOD_ALL', () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })

      const result = calculateDateRange(PERIOD_ALL)

      expect(getDateRangeForAll).toHaveBeenCalledWith()
      expect(result).toEqual({ startDate: null, endDate: null, useSchemeYear: false })
    })

    test('should call getDateRangeForYTD for PERIOD_YTD', () => {
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      getDateRangeForYTD.mockReturnValue({ startDate: startOfYear, endDate: now, useSchemeYear: false })

      const result = calculateDateRange(PERIOD_YTD)

      expect(getDateRangeForYTD).toHaveBeenCalledWith(expect.any(Date))
      expect(result.useSchemeYear).toBe(false)
      expect(result.startDate).toEqual(startOfYear)
    })

    test('should call getDateRangeForYear for PERIOD_YEAR with scheme year', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 11, 31)
      getDateRangeForYear.mockReturnValue({ startDate, endDate, useSchemeYear: false })

      const result = calculateDateRange(PERIOD_YEAR, 2024)

      expect(getDateRangeForYear).toHaveBeenCalledWith(2024)
      expect(result.startDate).toEqual(startDate)
      expect(result.endDate).toEqual(endDate)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should call getDateRangeForMonthInYear for PERIOD_MONTH_IN_YEAR', () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 5, 30)
      getDateRangeForMonthInYear.mockReturnValue({ startDate, endDate, useSchemeYear: true })

      const result = calculateDateRange(PERIOD_MONTH_IN_YEAR, 2024, 6)

      expect(getDateRangeForMonthInYear).toHaveBeenCalledWith(2024, 6)
      expect(result.startDate).toEqual(startDate)
      expect(result.endDate).toEqual(endDate)
      expect(result.useSchemeYear).toBe(true)
    })

    test('should call getDateRangeForRelativePeriod for PERIOD_MONTH with 30 days', () => {
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      getDateRangeForRelativePeriod.mockReturnValue({ startDate: monthAgo, endDate: now, useSchemeYear: false })

      const result = calculateDateRange(PERIOD_MONTH)

      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(expect.any(Date), 30)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should call getDateRangeForRelativePeriod for PERIOD_WEEK with 7 days', () => {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      getDateRangeForRelativePeriod.mockReturnValue({ startDate: weekAgo, endDate: now, useSchemeYear: false })

      const result = calculateDateRange(PERIOD_WEEK)

      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(expect.any(Date), 7)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should call getDateRangeForRelativePeriod for PERIOD_DAY with 1 day', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      getDateRangeForRelativePeriod.mockReturnValue({ startDate: yesterday, endDate: now, useSchemeYear: false })

      const result = calculateDateRange(PERIOD_DAY)

      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(expect.any(Date), 1)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should throw error for unknown period type', () => {
      expect(() => calculateDateRange('unknown')).toThrow('Unknown period type: unknown')
    })

    test('should pass null schemeYear and month for relative periods', () => {
      getDateRangeForRelativePeriod.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })

      calculateDateRange(PERIOD_MONTH)

      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(expect.any(Date), 30)
    })
  })

  describe('calculateMetricsForPeriod', () => {
    test('should calculate metrics for PERIOD_ALL and return counts', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 5, updated: 3 })

      const result = await calculateMetricsForPeriod(PERIOD_ALL)

      expect(getDateRangeForAll).toHaveBeenCalledWith()
      expect(buildWhereClauseForDateRange).toHaveBeenCalledWith(PERIOD_ALL, null, null, false)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, false, null, null, PERIOD_ALL)
      expect(saveMetrics).toHaveBeenCalledWith([], PERIOD_ALL, expect.any(String), null, null)
      expect(result).toEqual({ inserted: 5, updated: 3 })
    })

    test('should calculate metrics for PERIOD_YTD with dates', async () => {
      const startDate = new Date(2026, 0, 1)
      const endDate = new Date()
      getDateRangeForYTD.mockReturnValue({ startDate, endDate, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({ received: { $gte: startDate, $lte: endDate } })
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 2, updated: 1 })

      const result = await calculateMetricsForPeriod(PERIOD_YTD)

      expect(getDateRangeForYTD).toHaveBeenCalledWith(expect.any(Date))
      expect(buildWhereClauseForDateRange).toHaveBeenCalledWith(PERIOD_YTD, startDate, endDate, false)
      expect(fetchMetricsData).toHaveBeenCalledWith(expect.any(Object), false, null, null, PERIOD_YTD)
      expect(saveMetrics).toHaveBeenCalledWith([], PERIOD_YTD, expect.any(String), startDate, endDate)
      expect(result).toEqual({ inserted: 2, updated: 1 })
    })

    test('should calculate metrics for PERIOD_YEAR with schemeYear', async () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 11, 31)
      getDateRangeForYear.mockReturnValue({ startDate, endDate, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([{ 'statement.schemeName': 'SFI', totalStatements: '100' }])
      saveMetrics.mockResolvedValue({ inserted: 1, updated: 0 })

      const result = await calculateMetricsForPeriod(PERIOD_YEAR, 2024)

      expect(getDateRangeForYear).toHaveBeenCalledWith(2024)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, false, 2024, null, PERIOD_YEAR)
      expect(saveMetrics).toHaveBeenCalledWith(expect.any(Array), PERIOD_YEAR, expect.any(String), startDate, endDate)
      expect(result).toEqual({ inserted: 1, updated: 0 })
    })

    test('should calculate metrics for PERIOD_MONTH_IN_YEAR with year and month', async () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 5, 30)
      getDateRangeForMonthInYear.mockReturnValue({ startDate, endDate, useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 1 })

      const result = await calculateMetricsForPeriod(PERIOD_MONTH_IN_YEAR, 2024, 6)

      expect(getDateRangeForMonthInYear).toHaveBeenCalledWith(2024, 6)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, true, 2024, 6, PERIOD_MONTH_IN_YEAR)
      expect(saveMetrics).toHaveBeenCalledWith([], PERIOD_MONTH_IN_YEAR, expect.any(String), startDate, endDate)
      expect(result).toEqual({ inserted: 0, updated: 1 })
    })

    test('should calculate metrics for PERIOD_MONTH', async () => {
      const startDate = new Date()
      const endDate = new Date()
      getDateRangeForRelativePeriod.mockReturnValue({ startDate, endDate, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 3, updated: 2 })

      const result = await calculateMetricsForPeriod(PERIOD_MONTH)

      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(expect.any(Date), 30)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, false, null, null, PERIOD_MONTH)
      expect(result).toEqual({ inserted: 3, updated: 2 })
    })

    test('should calculate metrics for PERIOD_WEEK', async () => {
      const startDate = new Date()
      const endDate = new Date()
      getDateRangeForRelativePeriod.mockReturnValue({ startDate, endDate, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 1, updated: 1 })

      const result = await calculateMetricsForPeriod(PERIOD_WEEK)

      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(expect.any(Date), 7)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, false, null, null, PERIOD_WEEK)
      expect(result).toEqual({ inserted: 1, updated: 1 })
    })

    test('should calculate metrics for PERIOD_DAY', async () => {
      const startDate = new Date()
      const endDate = new Date()
      getDateRangeForRelativePeriod.mockReturnValue({ startDate, endDate, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 0 })

      const result = await calculateMetricsForPeriod(PERIOD_DAY)

      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(expect.any(Date), 1)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, false, null, null, PERIOD_DAY)
      expect(result).toEqual({ inserted: 0, updated: 0 })
    })

    test('should generate correct snapshotDate in ISO format', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 0 })

      await calculateMetricsForPeriod(PERIOD_ALL)

      const snapshotDateArg = saveMetrics.mock.calls[0][2]
      expect(snapshotDateArg).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('should handle multiple results from fetchMetricsData', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      const mockResults = [
        { 'statement.schemeName': 'SFI', totalStatements: '100' },
        { 'statement.schemeName': 'DP', totalStatements: '200' }
      ]
      fetchMetricsData.mockResolvedValue(mockResults)
      saveMetrics.mockResolvedValue({ inserted: 2, updated: 0 })

      const result = await calculateMetricsForPeriod(PERIOD_ALL)

      expect(saveMetrics).toHaveBeenCalledWith(mockResults, PERIOD_ALL, expect.any(String), null, null)
      expect(result).toEqual({ inserted: 2, updated: 0 })
    })

    test('should propagate error from saveMetrics', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockRejectedValue(new Error('Save error'))

      await expect(calculateMetricsForPeriod(PERIOD_ALL)).rejects.toThrow('Save error')
    })

    test('should propagate error from fetchMetricsData', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockRejectedValue(new Error('Fetch error'))

      await expect(calculateMetricsForPeriod(PERIOD_ALL)).rejects.toThrow('Fetch error')
    })

    test('should throw error for unknown period type', async () => {
      await expect(calculateMetricsForPeriod('unknown')).rejects.toThrow('Unknown period type: unknown')
    })
  })

  describe('calculateYearlyMetrics', () => {
    test('should calculate metrics for year and all 12 months', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 0, 31), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 1, updated: 0 })

      const result = await calculateYearlyMetrics(2024)

      expect(saveMetrics).toHaveBeenCalledTimes(13) // 1 year + 12 months
      expect(saveMetrics.mock.calls[0][1]).toBe(PERIOD_YEAR)
      expect(saveMetrics.mock.calls[1][1]).toBe(PERIOD_MONTH_IN_YEAR)
      expect(result).toEqual({ inserted: 13, updated: 0 })
    })

    test('should accumulate inserted and updated counts correctly', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 0, 31), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])

      // Year returns 5 inserted, 3 updated
      // Each month returns 2 inserted, 1 updated
      saveMetrics
        .mockResolvedValueOnce({ inserted: 5, updated: 3 })
        .mockResolvedValue({ inserted: 2, updated: 1 })

      const result = await calculateYearlyMetrics(2024)

      // 5 + (2 * 12) = 29 inserted
      // 3 + (1 * 12) = 15 updated
      expect(result).toEqual({ inserted: 29, updated: 15 })
    })

    test('should call calculateMetricsForPeriod with correct parameters for each month', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 0, 31), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 0 })

      await calculateYearlyMetrics(2024)

      // Verify each month was called
      for (let month = 1; month <= 12; month++) {
        expect(getDateRangeForMonthInYear).toHaveBeenCalledWith(2024, month)
      }
      expect(getDateRangeForMonthInYear).toHaveBeenCalledTimes(12)
    })

    test('should propagate error from year calculation', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockRejectedValue(new Error('Year calc error'))

      await expect(calculateYearlyMetrics(2024)).rejects.toThrow('Year calc error')
    })

    test('should propagate error from month calculation', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 0, 31), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics
        .mockResolvedValueOnce({ inserted: 1, updated: 0 })
        .mockRejectedValueOnce(new Error('Month calc error'))

      await expect(calculateYearlyMetrics(2024)).rejects.toThrow('Month calc error')
    })

    test('should handle year with no data', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2020, 0, 1), endDate: new Date(2020, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2020, 0, 1), endDate: new Date(2020, 0, 31), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 0 })

      const result = await calculateYearlyMetrics(2020)

      expect(result).toEqual({ inserted: 0, updated: 0 })
    })
  })

  describe('calculateHistoricalMetrics', () => {
    test('should calculate metrics for multiple years', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 1, updated: 0 })

      // yearsToCalculate = 2 means 3 years total (current + 2 previous)
      const result = await calculateHistoricalMetrics(2026, 2)

      // 3 years * 13 saves each = 39 total
      expect(saveMetrics).toHaveBeenCalledTimes(39)
      expect(result).toEqual({ inserted: 39, updated: 0 })
    })

    test('should calculate correct years in descending order', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 0 })

      await calculateHistoricalMetrics(2026, 2)

      // Should be called for years: 2026, 2025, 2024
      expect(getDateRangeForYear).toHaveBeenCalledWith(2026)
      expect(getDateRangeForYear).toHaveBeenCalledWith(2025)
      expect(getDateRangeForYear).toHaveBeenCalledWith(2024)
      expect(getDateRangeForYear).toHaveBeenCalledTimes(3)
    })

    test('should handle yearsToCalculate = 0 (single year)', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 1, updated: 0 })

      const result = await calculateHistoricalMetrics(2026, 0)

      // 1 year * 13 saves = 13 total
      expect(saveMetrics).toHaveBeenCalledTimes(13)
      expect(result).toEqual({ inserted: 13, updated: 0 })
    })

    test('should accumulate counts from all years', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])

      // Each year/month returns 2 inserted, 1 updated
      saveMetrics.mockResolvedValue({ inserted: 2, updated: 1 })

      const result = await calculateHistoricalMetrics(2026, 1)

      // 2 years * 13 operations * (2 inserted, 1 updated) = 52 inserted, 26 updated
      expect(result).toEqual({ inserted: 52, updated: 26 })
    })

    test('should propagate error from yearly calculation', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockRejectedValue(new Error('Historical calc error'))

      await expect(calculateHistoricalMetrics(2026, 1)).rejects.toThrow('Historical calc error')
    })

    test('should process years sequentially', async () => {
      const yearCallOrder = []
      getDateRangeForYear.mockImplementation((year) => {
        yearCallOrder.push(year)
        return { startDate: new Date(), endDate: new Date(), useSchemeYear: false }
      })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 0 })

      await calculateHistoricalMetrics(2026, 2)

      expect(yearCallOrder).toEqual([2026, 2025, 2024])
    })
  })

  describe('calculateAllMetrics', () => {
    beforeEach(() => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      getDateRangeForYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
    })

    test('should log start message', async () => {
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 0 })

      await calculateAllMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics calculation...')
    })

    test('should calculate PERIOD_ALL metrics', async () => {
      saveMetrics.mockResolvedValue({ inserted: 5, updated: 3 })

      await calculateAllMetrics()

      expect(getDateRangeForAll).toHaveBeenCalled()
      expect(saveMetrics.mock.calls.some(call => call[1] === PERIOD_ALL)).toBe(true)
    })

    test('should calculate historical metrics with default years', async () => {
      saveMetrics.mockResolvedValue({ inserted: 1, updated: 0 })
      delete process.env.METRICS_CALCULATION_YEARS

      await calculateAllMetrics()

      expect(saveMetrics).toHaveBeenCalledTimes(53)
    })

    test('should use METRICS_CALCULATION_YEARS env variable', async () => {
      process.env.METRICS_CALCULATION_YEARS = '1'
      saveMetrics.mockResolvedValue({ inserted: 1, updated: 0 })

      await calculateAllMetrics()

      expect(saveMetrics).toHaveBeenCalledTimes(27)
    })

    test('should log success with counts', async () => {
      saveMetrics.mockResolvedValue({ inserted: 10, updated: 5 })

      await calculateAllMetrics()

      const totalCalls = saveMetrics.mock.calls.length
      const totalInserted = 10 * totalCalls
      const totalUpdated = 5 * totalCalls

      expect(consoleLogSpy).toHaveBeenCalledWith(`✓ Metrics calculated: ${totalInserted} created, ${totalUpdated} updated`)
    })

    test('should log error and rethrow on failure', async () => {
      const error = new Error('Calculation failed')
      saveMetrics.mockRejectedValue(error)

      await expect(calculateAllMetrics()).rejects.toThrow('Calculation failed')

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Error calculating metrics:', error)
    })

    test('should accumulate counts from all operations', async () => {
      // PERIOD_ALL returns 100 inserted, 50 updated
      // Each historical operation returns 10 inserted, 5 updated
      saveMetrics
        .mockResolvedValueOnce({ inserted: 100, updated: 50 })
        .mockResolvedValue({ inserted: 10, updated: 5 })

      process.env.METRICS_CALCULATION_YEARS = '0'

      await calculateAllMetrics()

      // 1 (all: 100,50) + 1 year * 13 operations (10,5 each) = 100+130=230 inserted, 50+65=115 updated
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Metrics calculated: 230 created, 115 updated')
    })

    test('should handle zero counts', async () => {
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 0 })

      await calculateAllMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Metrics calculated: 0 created, 0 updated')
    })

    test('should parse METRICS_CALCULATION_YEARS as integer', async () => {
      process.env.METRICS_CALCULATION_YEARS = '2'
      saveMetrics.mockResolvedValue({ inserted: 0, updated: 0 })

      await calculateAllMetrics()

      // 1 (all) + 3 years (0,1,2) * 13 = 40 calls
      expect(saveMetrics).toHaveBeenCalledTimes(40)
    })

    test('should call calculateAllMetrics in correct sequence', async () => {
      const periodOrder = []
      saveMetrics.mockImplementation((results, period) => {
        periodOrder.push(period)
        return Promise.resolve({ inserted: 0, updated: 0 })
      })

      process.env.METRICS_CALCULATION_YEARS = '0'

      await calculateAllMetrics()

      // First should be PERIOD_ALL
      expect(periodOrder[0]).toBe(PERIOD_ALL)
      // Then PERIOD_YEAR for current year
      expect(periodOrder[1]).toBe(PERIOD_YEAR)
      // Then 12 PERIOD_MONTH_IN_YEAR
      for (let i = 2; i <= 13; i++) {
        expect(periodOrder[i]).toBe(PERIOD_MONTH_IN_YEAR)
      }
    })
  })

  describe('module exports', () => {
    test('should export calculateDateRange', () => {
      expect(typeof calculateDateRange).toBe('function')
    })

    test('should export calculateAllMetrics', () => {
      expect(typeof calculateAllMetrics).toBe('function')
    })

    test('should export calculateMetricsForPeriod', () => {
      expect(typeof calculateMetricsForPeriod).toBe('function')
    })

    test('should export calculateYearlyMetrics', () => {
      expect(typeof calculateYearlyMetrics).toBe('function')
    })

    test('should export calculateHistoricalMetrics', () => {
      expect(typeof calculateHistoricalMetrics).toBe('function')
    })
  })
})
