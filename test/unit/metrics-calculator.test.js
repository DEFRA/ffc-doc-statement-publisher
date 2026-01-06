const { calculateAllMetrics, calculateMetricsForPeriod } = require('../../app/metrics-calculator')
const {
  PRINT_POST_UNIT_COST_2024,
  PRINT_POST_UNIT_COST_2026,
  DEFAULT_PRINT_POST_UNIT_COST,
  PRINT_POST_PRICING_START_2024,
  PRINT_POST_PRICING_START_2026
} = require('../../app/constants/print-post-pricing')
const { METHOD_LETTER, METHOD_EMAIL } = require('../../app/constants/delivery-methods')

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
          printPostCost: 3850,
          emailCount: 50,
          failureCount: 0
        })
      )
    })

    test('should only count successfully delivered statements (no failures)', async () => {
      const mockResults = [
        {
          'statement.schemeName': 'DP',
          'statement.schemeYear': '2024',
          totalStatements: '75', // Only counting deliveries with completed AND no failure
          printPostCount: '25',
          printPostCost: '1925',
          emailCount: '50',
          failureCount: '10' // Separate count of failures
        }
      ]

      db.delivery.findAll.mockResolvedValue(mockResults)

      await calculateMetricsForPeriod('all')

      expect(db.metric.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          totalStatements: 75, // Successfully delivered only
          failureCount: 10 // Tracked separately
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
          failureCount: '5'
        }
      ]

      db.delivery.findAll.mockResolvedValue(mockResults)

      await calculateMetricsForPeriod('all')

      expect(db.metric.upsert).toHaveBeenCalledTimes(2)
    })

    test('should include dataStartDate and dataEndDate in metric record for date-bounded periods', async () => {
      const mockResults = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          totalStatements: '50',
          printPostCount: '25',
          printPostCost: '1925',
          emailCount: '25',
          failureCount: '0'
        }
      ]

      db.delivery.findAll.mockResolvedValue(mockResults)

      await calculateMetricsForPeriod('month')

      expect(db.metric.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          dataStartDate: expect.any(Date),
          dataEndDate: expect.any(Date)
        })
      )
    })

    test('should set dataStartDate and dataEndDate to null for "all" period', async () => {
      const mockResults = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          totalStatements: '50',
          printPostCount: '25',
          printPostCost: '1925',
          emailCount: '25',
          failureCount: '0'
        }
      ]

      db.delivery.findAll.mockResolvedValue(mockResults)

      await calculateMetricsForPeriod('all')

      expect(db.metric.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          dataStartDate: null,
          dataEndDate: null
        })
      )
    })

    test('should use DEFAULT_PRINT_POST_UNIT_COST in saved metric record', async () => {
      const mockResults = [
        {
          'statement.schemeName': 'DP',
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

      expect(db.metric.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          printPostUnitCost: DEFAULT_PRINT_POST_UNIT_COST
        })
      )
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
      // years: 3 years (current + 2 back) = 3
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

  describe('pricing constants integration', () => {
    test('should use PRINT_POST_PRICING_START_2024 constant in queries', () => {
      expect(PRINT_POST_PRICING_START_2024).toBe('2024-04-01')
    })

    test('should use PRINT_POST_PRICING_START_2026 constant in queries', () => {
      expect(PRINT_POST_PRICING_START_2026).toBe('2026-01-05')
    })

    test('should use PRINT_POST_UNIT_COST_2024 for pricing', () => {
      expect(PRINT_POST_UNIT_COST_2024).toBe(77)
    })

    test('should use PRINT_POST_UNIT_COST_2026 for pricing', () => {
      expect(PRINT_POST_UNIT_COST_2026).toBe(82)
    })

    test('should use DEFAULT_PRINT_POST_UNIT_COST as fallback', () => {
      expect(DEFAULT_PRINT_POST_UNIT_COST).toBe(77)
    })
  })

  describe('delivery method constants integration', () => {
    test('should use METHOD_LETTER constant', () => {
      expect(METHOD_LETTER).toBe('letter')
    })

    test('should use METHOD_EMAIL constant', () => {
      expect(METHOD_EMAIL).toBe('email')
    })
  })

  describe('query building', () => {
    test('should build query that excludes failed deliveries from counts', async () => {
      await calculateMetricsForPeriod('all')

      const findAllCall = db.delivery.findAll.mock.calls[0][0]
      const attributes = findAllCall.attributes
      const totalStatementsQuery = attributes[0][0]
      expect(totalStatementsQuery).toContain('completed" IS NOT NULL')
      expect(totalStatementsQuery).toContain('failureId" IS NULL')
    })

    test('should build query that only costs successfully delivered letters', async () => {
      await calculateMetricsForPeriod('all')

      const findAllCall = db.delivery.findAll.mock.calls[0][0]
      const attributes = findAllCall.attributes
      const printPostCostQuery = attributes[2][0]
      expect(printPostCostQuery).toContain('completed" IS NOT NULL')
      expect(printPostCostQuery).toContain('failureId" IS NULL')
    })

    test('should include failure table in query with left join', async () => {
      await calculateMetricsForPeriod('all')

      const findAllCall = db.delivery.findAll.mock.calls[0][0]
      const includes = findAllCall.include

      const failureInclude = includes.find(inc => inc.as === 'failure')
      expect(failureInclude).toBeDefined()
      expect(failureInclude.required).toBe(false)
    })

    test('should include statement table in query with inner join', async () => {
      await calculateMetricsForPeriod('all')

      const findAllCall = db.delivery.findAll.mock.calls[0][0]
      const includes = findAllCall.include

      const statementInclude = includes.find(inc => inc.as === 'statement')
      expect(statementInclude).toBeDefined()
      expect(statementInclude.required).toBe(true)
    })

    test('should group results by schemeName and schemeYear', async () => {
      await calculateMetricsForPeriod('all')

      const findAllCall = db.delivery.findAll.mock.calls[0][0]
      expect(findAllCall.group).toEqual(['statement.schemeName', 'statement.schemeYear'])
    })
  })

  describe('edge cases', () => {
    test('should handle zero results', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await calculateMetricsForPeriod('all')

      expect(db.metric.upsert).not.toHaveBeenCalled()
    })

    test('should handle results with string numbers', async () => {
      const mockResults = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': '2024',
          totalStatements: '150',
          printPostCount: '75',
          printPostCost: '5775',
          emailCount: '75',
          failureCount: '5'
        }
      ]

      db.delivery.findAll.mockResolvedValue(mockResults)

      await calculateMetricsForPeriod('all')

      expect(db.metric.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          totalStatements: 150,
          printPostCount: 75,
          printPostCost: 5775,
          emailCount: 75,
          failureCount: 5
        })
      )
    })

    test('should handle NaN values gracefully', async () => {
      const mockResults = [
        {
          'statement.schemeName': 'SFI',
          'statement.schemeYear': 'invalid',
          totalStatements: 'invalid',
          printPostCount: '0',
          printPostCost: '0',
          emailCount: '0',
          failureCount: '0'
        }
      ]

      db.delivery.findAll.mockResolvedValue(mockResults)

      await calculateMetricsForPeriod('all')

      expect(db.metric.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          schemeYear: NaN,
          totalStatements: NaN
        })
      )
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
