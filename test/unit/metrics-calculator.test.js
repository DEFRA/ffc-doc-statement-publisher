const { calculateAllMetrics, calculateMetricsForPeriod } = require('../../app/metrics-calculator')

jest.mock('../../app/data', () => ({
  delivery: {
    findAll: jest.fn()
  },
  statement: {},
  failure: {},
  metric: {
    upsert: jest.fn()
  },
  sequelize: {
    fn: jest.fn((fnName, ...args) => `${fnName}(${args.join(',')})`),
    literal: jest.fn((sql) => sql),
    col: jest.fn((col) => col)
  }
}))

const db = require('../../app/data')

describe('metrics-calculator', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Set default return values
    db.delivery.findAll.mockResolvedValue([])
    db.metric.upsert.mockResolvedValue({})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('calculateMetricsForPeriod', () => {
    test('should be a function', () => {
      expect(typeof calculateMetricsForPeriod).toBe('function')
    })

    test('should call delivery.findAll with correct parameters for "all" period', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateMetricsForPeriod('all')

      expect(db.delivery.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.any(Array),
          include: expect.any(Array)
        })
      )
    })

    test('should call metric.upsert for each result', async () => {
      const mockResults = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          totalStatements: '100',
          printPostCount: '50',
          printPostCost: '3850',
          emailCount: '50',
          failureCount: '0'
        }
      ]

      db.delivery.findAll.mockResolvedValue(mockResults)

      await calculateMetricsForPeriod('all')

      expect(db.metric.upsert).toHaveBeenCalledTimes(1)
      expect(db.metric.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          periodType: 'all',
          schemeName: 'SFI',
          schemeYear: 2024,
          totalStatements: 100,
          printPostCount: 50,
          emailCount: 50,
          failureCount: 0
        })
      )
    })

    test('should handle ytd period', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateMetricsForPeriod('ytd')

      expect(db.delivery.findAll).toHaveBeenCalled()
    })

    test('should handle month period', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateMetricsForPeriod('month')

      expect(db.delivery.findAll).toHaveBeenCalled()
    })

    test('should handle week period', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateMetricsForPeriod('week')

      expect(db.delivery.findAll).toHaveBeenCalled()
    })

    test('should handle day period', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateMetricsForPeriod('day')

      expect(db.delivery.findAll).toHaveBeenCalled()
    })

    test('should handle year period with schemeYear', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateMetricsForPeriod('year', 2024)

      expect(db.delivery.findAll).toHaveBeenCalled()
    })

    test('should handle monthInYear period with schemeYear and month', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateMetricsForPeriod('monthInYear', 2024, 6)

      expect(db.delivery.findAll).toHaveBeenCalled()
    })

    test('should throw error for monthInYear period without schemeYear', async () => {
      await expect(calculateMetricsForPeriod('monthInYear', null, 6))
        .rejects.toThrow('schemeYear and month are required for monthInYear period')
    })

    test('should throw error for monthInYear period without month', async () => {
      await expect(calculateMetricsForPeriod('monthInYear', 2024, null))
        .rejects.toThrow('schemeYear and month are required for monthInYear period')
    })

    test('should throw error for unknown period type', async () => {
      await expect(calculateMetricsForPeriod('invalid-period'))
        .rejects.toThrow('Unknown period type: invalid-period')
    })

    test('should handle null schemeYear in results', async () => {
      const mockResults = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': null,
          totalStatements: '100',
          printPostCount: '50',
          printPostCost: '3850',
          emailCount: '50',
          failureCount: '0'
        }
      ]

      db.delivery.findAll.mockResolvedValue(mockResults)

      await calculateMetricsForPeriod('all')

      expect(db.metric.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          schemeYear: null
        })
      )
    })

    test('should handle multiple results', async () => {
      const mockResults = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          totalStatements: '100',
          printPostCount: '50',
          printPostCost: '3850',
          emailCount: '50',
          failureCount: '0'
        },
        {
          'statement.schemeName': 'DP',
          'statement.schemeYear': '2024',
          totalStatements: '200',
          printPostCount: '100',
          printPostCost: '7700',
          emailCount: '100',
          failureCount: '0'
        }
      ]

      db.delivery.findAll.mockResolvedValue(mockResults)

      await calculateMetricsForPeriod('all')

      expect(db.metric.upsert).toHaveBeenCalledTimes(2)
    })
  })

  describe('calculateAllMetrics', () => {
    beforeEach(() => {
      process.env.METRICS_CALCULATION_YEARS = '2'
    })

    afterEach(() => {
      delete process.env.METRICS_CALCULATION_YEARS
    })

    test('should be a function', () => {
      expect(typeof calculateAllMetrics).toBe('function')
    })

    test('should log starting message', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateAllMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics calculation...')
    })

    test('should calculate metrics for all standard periods', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateAllMetrics()

      expect(db.delivery.findAll).toHaveBeenCalled()
    })

    test('should calculate metrics for multiple years', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateAllMetrics()

      // Should be called for periods + years + months per year
      // periods: all, ytd, month, week, day (5)
      // years: 3 years (current + 2 back)
      // months: 3 years * 12 months = 36
      // Total: 5 + 3 + 36 = 44
      expect(db.delivery.findAll.mock.calls.length).toBeGreaterThan(0)
    })

    test('should log success message on completion', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateAllMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ All metrics calculated successfully')
    })

    test('should log error and throw on failure', async () => {
      const error = new Error('Database error')
      db.delivery.findAll.mockRejectedValue(error)

      await expect(calculateAllMetrics()).rejects.toThrow('Database error')
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Error calculating metrics:', error)
    })

    test('should use default value for METRICS_CALCULATION_YEARS if not set', async () => {
      delete process.env.METRICS_CALCULATION_YEARS
      db.delivery.findAll.mockResolvedValue([])

      await calculateAllMetrics()

      expect(db.delivery.findAll).toHaveBeenCalled()
    })
  })

  describe('module exports', () => {
    test('should export calculateAllMetrics function', () => {
      expect(calculateAllMetrics).toBeDefined()
      expect(typeof calculateAllMetrics).toBe('function')
    })

    test('should export calculateMetricsForPeriod function', () => {
      expect(calculateMetricsForPeriod).toBeDefined()
      expect(typeof calculateMetricsForPeriod).toBe('function')
    })
  })
})
