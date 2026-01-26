const { calculateDateRange, calculateAllMetrics, calculateMetricsForPeriod, calculateYearlyMetrics, calculateHistoricalMetrics } = require('../../../app/metrics/metrics-calculator')

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

const { getDateRangeForAll, getDateRangeForYTD, getDateRangeForYear, getDateRangeForMonthInYear, getDateRangeForRelativePeriod } = require('../../../app/metrics/get-metrics-data')
const { buildWhereClauseForDateRange, fetchMetricsData } = require('../../../app/metrics/build-metrics')
const { saveMetrics } = require('../../../app/metrics/create-save-metrics')

const db = require('../../../app/data')

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
    test('should call getDateRangeForAll for all period', () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      const result = calculateDateRange('all')
      expect(getDateRangeForAll).toHaveBeenCalledWith()
      expect(result).toEqual({ startDate: null, endDate: null, useSchemeYear: false })
    })

    test('should call getDateRangeForYTD for ytd period', () => {
      const now = new Date()
      getDateRangeForYTD.mockReturnValue({ startDate: new Date(now.getFullYear(), 0, 1), endDate: now, useSchemeYear: false })
      const result = calculateDateRange('ytd')
      expect(getDateRangeForYTD).toHaveBeenCalledWith(now)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should call getDateRangeForYear for year period', () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), useSchemeYear: false })
      const result = calculateDateRange('year', 2024)
      expect(getDateRangeForYear).toHaveBeenCalledWith(2024)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should call getDateRangeForMonthInYear for monthInYear period', () => {
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2024, 5, 1), endDate: new Date(2024, 6, 0), useSchemeYear: true })
      const result = calculateDateRange('monthInYear', 2024, 6)
      expect(getDateRangeForMonthInYear).toHaveBeenCalledWith(2024, 6)
      expect(result.useSchemeYear).toBe(true)
    })

    test('should call getDateRangeForRelativePeriod for month period', () => {
      const now = new Date()
      getDateRangeForRelativePeriod.mockReturnValue({ startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), endDate: now, useSchemeYear: false })
      const result = calculateDateRange('month')
      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(now, 30)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should call getDateRangeForRelativePeriod for week period', () => {
      const now = new Date()
      getDateRangeForRelativePeriod.mockReturnValue({ startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), endDate: now, useSchemeYear: false })
      const result = calculateDateRange('week')
      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(now, 7)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should call getDateRangeForRelativePeriod for day period', () => {
      const now = new Date()
      getDateRangeForRelativePeriod.mockReturnValue({ startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), endDate: now, useSchemeYear: false })
      const result = calculateDateRange('day')
      expect(getDateRangeForRelativePeriod).toHaveBeenCalledWith(now, 1)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should throw error for unknown period type', () => {
      expect(() => calculateDateRange('unknown')).toThrow('Unknown period type: unknown')
    })
  })

  describe('calculateMetricsForPeriod', () => {
    test('should be a function', () => {
      expect(typeof calculateMetricsForPeriod).toBe('function')
    })

    test('should call calculateDateRange, buildWhereClause, fetchMetricsData, and saveMetrics for all period', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('all')
      expect(getDateRangeForAll).toHaveBeenCalled()
      expect(buildWhereClauseForDateRange).toHaveBeenCalledWith('all', null, null, false)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, false, null, null)
      expect(saveMetrics).toHaveBeenCalledWith([], 'all', expect.any(String), null, null)
    })

    test('should handle ytd period', async () => {
      getDateRangeForYTD.mockReturnValue({ startDate: new Date(2023, 0, 1), endDate: new Date(), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('ytd')
      expect(getDateRangeForYTD).toHaveBeenCalled()
    })

    test('should handle month/week/day period', async () => {
      getDateRangeForRelativePeriod.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('month')
      await calculateMetricsForPeriod('week')
      await calculateMetricsForPeriod('day')
      expect(getDateRangeForRelativePeriod).toHaveBeenCalled()
    })

    test('should handle year period with schemeYear', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('year', 2024)
      expect(getDateRangeForYear).toHaveBeenCalledWith(2024)
    })

    test('should handle monthInYear period with schemeYear and month', async () => {
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2024, 5, 1), endDate: new Date(2024, 6, 0), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('monthInYear', 2024, 6)
      expect(getDateRangeForMonthInYear).toHaveBeenCalledWith(2024, 6)
    })

    test('should throw error for unknown period type', async () => {
      await expect(calculateMetricsForPeriod('unknown')).rejects.toThrow('Unknown period type: unknown')
    })

    test('should handle null schemeYear in results', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([{
        'statement.schemeName': 'SFI',
        'statement.schemeYear': null,
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('all')
      expect(saveMetrics).toHaveBeenCalled()
    })

    test('should handle multiple results', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          receivedYear: '2024',
          receivedMonth: '1',
          totalStatements: '100',
          printPostCount: '50',
          printPostCost: '3850',
          emailCount: '50',
          failureCount: '0'
        },
        {
          'statement.schemeName': 'DP',
          'statement.schemeYear': '2024',
          receivedYear: '2024',
          receivedMonth: '1',
          totalStatements: '200',
          printPostCount: '100',
          printPostCost: '7700',
          emailCount: '100',
          failureCount: '10'
        }
      ])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('all')
      expect(saveMetrics).toHaveBeenCalledWith(expect.any(Array), 'all', expect.any(String), null, null)
    })

    test('should include dataStartDate and dataEndDate in metric record for date-bounded periods', async () => {
      getDateRangeForYTD.mockReturnValue({ startDate: new Date(2023, 0, 1), endDate: new Date(), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([{
        'statement.schemeName': 'SFI',
        'statement.schemeYear': '2024',
        receivedYear: '2024',
        receivedMonth: '1',
        totalStatements: '100',
        printPostCount: '50',
        printPostCost: '3850',
        emailCount: '50',
        failureCount: '0'
      }])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('ytd')
      expect(saveMetrics).toHaveBeenCalledWith(expect.any(Array), 'ytd', expect.any(String), expect.any(Date), expect.any(Date))
    })

    test('should set dataStartDate and dataEndDate to null for "all" period', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('all')
      expect(saveMetrics).toHaveBeenCalledWith([], 'all', expect.any(String), null, null)
    })

    test('should handle zero results', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()
      await calculateMetricsForPeriod('all')
      expect(saveMetrics).toHaveBeenCalledWith([], 'all', expect.any(String), null, null)
    })

    test('should propagate error from saveMetrics', async () => {
      getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null, useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockRejectedValue(new Error('Save error'))
      await expect(calculateMetricsForPeriod('all')).rejects.toThrow('Save error')
    })
  })

  describe('calculateYearlyMetrics', () => {
    test('should be a function', () => {
      expect(typeof calculateYearlyMetrics).toBe('function')
    })

    test('should call calculateMetricsForPeriod for year and each month (13 save operations)', async () => {
      // Prepare dependency mocks so calculateMetricsForPeriod can run quickly
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2024, 5, 1), endDate: new Date(2024, 6, 0), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()

      await calculateYearlyMetrics(2024)

      // One save for the year, and one for each month (total 13)
      expect(saveMetrics).toHaveBeenCalledTimes(13)
      // First call should have period 'year'
      expect(saveMetrics.mock.calls[0][1]).toBe('year')
    })

    test('should propagate error from a failing saveMetrics during yearly calc', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2024, 5, 1), endDate: new Date(2024, 6, 0), useSchemeYear: true })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockRejectedValue(new Error('Calc error'))

      await expect(calculateYearlyMetrics(2024)).rejects.toThrow('Calc error')
    })
  })

  describe('calculateHistoricalMetrics', () => {
    test('should be a function', () => {
      expect(typeof calculateHistoricalMetrics).toBe('function')
    })

    test('should call yearly calculation for each year in range (3 years => 39 saves)', async () => {
      // Setup dependency mocks used by calculateYearlyMetrics/calculateMetricsForPeriod
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 31), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()

      // currentYear 2026, yearsToCalculate = 2 => 3 years (2026, 2025, 2024)
      await calculateHistoricalMetrics(2026, 2)

      // 3 years * 13 operations each = 39
      expect(saveMetrics).toHaveBeenCalledTimes(39)
    })

    test('should handle yearsToCalculate = 0 (1 year => 13 saves)', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 31), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()

      await calculateHistoricalMetrics(2026, 0)

      expect(saveMetrics).toHaveBeenCalledTimes(13)
    })

    test('should propagate error from failing saveMetrics during historical calc', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 11, 31), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 31), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      // Fail on first call
      saveMetrics.mockRejectedValueOnce(new Error('Yearly error'))

      await expect(calculateHistoricalMetrics(2026, 1)).rejects.toThrow('Yearly error')
    })
  })

  describe('calculateAllMetrics', () => {
    test('should be a function', () => {
      expect(typeof calculateAllMetrics).toBe('function')
    })

    test('should log starting message and complete successfully', async () => {
      // Make the downstream flows no-op and resolvable
      getDateRangeForYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()

      await calculateAllMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics calculation...')
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ All metrics calculated successfully')
    })

    test('should log error and throw on failure', async () => {
      getDateRangeForYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockRejectedValue(new Error('Calc error'))

      await expect(calculateAllMetrics()).rejects.toThrow('Calc error')
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Error calculating metrics:', expect.any(Error))
    })

    test('should run successfully with env METRICS_CALCULATION_YEARS set', async () => {
      process.env.METRICS_CALCULATION_YEARS = '2'
      getDateRangeForYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(), endDate: new Date(), useSchemeYear: false })
      buildWhereClauseForDateRange.mockReturnValue({})
      fetchMetricsData.mockResolvedValue([])
      saveMetrics.mockResolvedValue()

      await calculateAllMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics calculation...')
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ All metrics calculated successfully')
    })
  })

  describe('module exports', () => {
    test('should export calculateAllMetrics function', () => {
      expect(typeof calculateAllMetrics).toBe('function')
    })

    test('should export calculateMetricsForPeriod function', () => {
      expect(typeof calculateMetricsForPeriod).toBe('function')
    })

    test('should export calculateYearlyMetrics function', () => {
      expect(typeof calculateYearlyMetrics).toBe('function')
    })

    test('should export calculateHistoricalMetrics function', () => {
      expect(typeof calculateHistoricalMetrics).toBe('function')
    })
  })
})
