const {
  buildWhereClauseForDateRange,
  buildStatementInclude,
  buildFailureInclude,
  buildQueryAttributes,
  fetchMetricsData
} = require('../../../app/metrics/build-metrics')
const {
  PRINT_POST_UNIT_COST_2024,
  PRINT_POST_UNIT_COST_2026,
  DEFAULT_PRINT_POST_UNIT_COST,
  PRINT_POST_PRICING_START_2024,
  PRINT_POST_PRICING_START_2026
} = require('../../../app/constants/print-post-pricing')
const { METHOD_LETTER, METHOD_EMAIL } = require('../../../app/constants/delivery-methods')
const { PERIOD_YEAR, PERIOD_MONTH_IN_YEAR } = require('../../../app/constants/periods')

jest.mock('../../../app/data', () => {
  const Sequelize = require('sequelize')
  return {
    Sequelize: {
      Op: Sequelize.Op
    },
    delivery: { findAll: jest.fn() },
    statement: {},
    failure: {},
    sequelize: {
      fn: jest.fn((fnName, ...args) => `${fnName}(${args.join(',')})`),
      literal: jest.fn((sql) => sql),
      col: jest.fn((col) => col)
    }
  }
})

const db = require('../../../app/data')

describe('build-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buildWhereClauseForDateRange', () => {
    test('should return empty where clause for all period', () => {
      const result = buildWhereClauseForDateRange('all', null, null, false)
      expect(result).toEqual({})
    })

    test('should return empty where clause if startDate is missing', () => {
      const result = buildWhereClauseForDateRange('ytd', null, new Date(), false)
      expect(result).toEqual({})
    })

    test('should return empty where clause if endDate is missing', () => {
      const result = buildWhereClauseForDateRange('ytd', new Date(), null, false)
      expect(result).toEqual({})
    })

    test('should return empty where clause if useSchemeYear is true and period is not PERIOD_MONTH_IN_YEAR', () => {
      const result = buildWhereClauseForDateRange('ytd', new Date(), new Date(), true)
      expect(result).toEqual({})
    })

    test('should build where clause for PERIOD_MONTH_IN_YEAR with useSchemeYear false', () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 6, 0, 23, 59, 59, 999)
      const result = buildWhereClauseForDateRange(PERIOD_MONTH_IN_YEAR, startDate, endDate, false)
      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lte]: endDate
        }
      })
    })

    test('should build where clause for ytd period', () => {
      const startDate = new Date(2023, 0, 1)
      const endDate = new Date(2023, 5, 15)
      const result = buildWhereClauseForDateRange('ytd', startDate, endDate, false)
      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lt]: endDate
        }
      })
    })

    test('should build where clause for year period with lte', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 11, 31, 23, 59, 59, 999)
      const result = buildWhereClauseForDateRange(PERIOD_YEAR, startDate, endDate, false)
      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lte]: endDate
        }
      })
    })

    test('should build where clause for month_in_year period with gte and lte', () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 6, 0, 23, 59, 59, 999)
      const result = buildWhereClauseForDateRange(PERIOD_MONTH_IN_YEAR, startDate, endDate, true)
      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lte]: endDate
        }
      })
    })
  })

  describe('buildStatementInclude', () => {
    test('should build statement include without schemeYear filter', () => {
      const result = buildStatementInclude(false, null)
      expect(result).toEqual({
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName', 'schemeYear'],
        required: true,
        where: {}
      })
    })

    test('should build statement include with useSchemeYear true but no schemeYear', () => {
      const result = buildStatementInclude(true, null)
      expect(result).toEqual({
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName', 'schemeYear'],
        required: true,
        where: {}
      })
    })

    test('should build statement include with schemeYear filter', () => {
      const result = buildStatementInclude(true, 2024)
      expect(result).toEqual({
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName', 'schemeYear'],
        required: true,
        where: { schemeYear: '2024' }
      })
    })
  })

  describe('buildFailureInclude', () => {
    test('should build failure include', () => {
      const result = buildFailureInclude()
      expect(result).toEqual({
        model: db.failure,
        as: 'failure',
        attributes: [],
        required: false
      })
    })
  })

  describe('buildQueryAttributes', () => {
    test('should return array of query attributes', () => {
      const attrs = buildQueryAttributes()
      expect(Array.isArray(attrs)).toBe(true)
      expect(attrs).toHaveLength(7)
      expect(attrs[0][0]).toContain('EXTRACT(YEAR')
      expect(attrs[1][0]).toContain('EXTRACT(MONTH')
      expect(attrs[2][0]).toContain('COUNT(DISTINCT')
      expect(attrs[3][0]).toContain(`COUNT(CASE WHEN "delivery"."method" = '${METHOD_LETTER}'`)
      const costAttr = attrs[4][0]
      // SUM is multiline in the literal so assert presence of SUM and WHEN clause separately
      expect(costAttr).toContain('SUM(')
      expect(costAttr).toContain(`WHEN "delivery"."method" = '${METHOD_LETTER}'`)
      expect(costAttr).toContain(PRINT_POST_PRICING_START_2026)
      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2026))
      expect(costAttr).toContain(PRINT_POST_PRICING_START_2024)
      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2024))
      expect(costAttr).toContain(String(DEFAULT_PRINT_POST_UNIT_COST))
      expect(attrs[5][0]).toContain(`COUNT(CASE WHEN "delivery"."method" = '${METHOD_EMAIL}'`)
      expect(attrs[6][0]).toContain('COUNT(failure.failureId)')
    })

    test('should always return an array', () => {
      expect(Array.isArray(buildQueryAttributes())).toBe(true)
    })
  })

  describe('fetchMetricsData', () => {
    test('should call db.delivery.findAll with correct parameters', async () => {
      const mockResults = []
      db.delivery.findAll.mockResolvedValue(mockResults)
      const whereClause = { completed: { [db.Sequelize.Op.gte]: new Date() } }
      const result = await fetchMetricsData(whereClause, false, null, null)
      expect(db.delivery.findAll).toHaveBeenCalledWith({
        attributes: buildQueryAttributes(),
        include: [
          buildStatementInclude(false, null),
          buildFailureInclude()
        ],
        where: whereClause,
        group: expect.any(Array),
        raw: true
      })
      expect(result).toBe(mockResults)
    })

    test('should propagate error from db.delivery.findAll', async () => {
      db.delivery.findAll.mockRejectedValue(new Error('DB error'))
      await expect(fetchMetricsData({}, false, null, null)).rejects.toThrow('DB error')
    })

    test('should call db.delivery.findAll with schemeYear filter when useSchemeYear is true', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}
      await fetchMetricsData(whereClause, true, 2024, 6)
      expect(db.delivery.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              where: { schemeYear: '2024' }
            })
          ])
        })
      )
    })
  })

  describe('pricing constants integration', () => {
    test('should use PRINT_POST_PRICING_START_2024 constant in queries', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[4][0]
      expect(costAttr).toContain(PRINT_POST_PRICING_START_2024)
    })

    test('should use PRINT_POST_PRICING_START_2026 constant in queries', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[4][0]
      expect(costAttr).toContain(PRINT_POST_PRICING_START_2026)
    })

    test('should use PRINT_POST_UNIT_COST_2024 for pricing', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[4][0]
      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2024))
    })

    test('should use PRINT_POST_UNIT_COST_2026 for pricing', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[4][0]
      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2026))
    })

    test('should use DEFAULT_PRINT_POST_UNIT_COST as fallback', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[4][0]
      expect(costAttr).toContain(String(DEFAULT_PRINT_POST_UNIT_COST))
    })
  })

  describe('delivery method constants integration', () => {
    test('should use METHOD_LETTER constant', () => {
      const attrs = buildQueryAttributes()
      const printPostAttr = attrs[3][0]
      expect(printPostAttr).toContain(METHOD_LETTER)
      const costAttr = attrs[4][0]
      expect(costAttr).toContain(METHOD_LETTER)
    })

    test('should use METHOD_EMAIL constant', () => {
      const attrs = buildQueryAttributes()
      const emailAttr = attrs[5][0]
      expect(emailAttr).toContain(METHOD_EMAIL)
    })
  })

  describe('query building', () => {
    test('should build query that excludes failed deliveries from counts', () => {
      const attrs = buildQueryAttributes()
      const totalStatements = attrs[2][0]
      expect(totalStatements).toContain('"failure"."failureId" IS NULL')
      const printPostCount = attrs[3][0]
      expect(printPostCount).toContain('"failure"."failureId" IS NULL')
      const emailCount = attrs[5][0]
      expect(emailCount).toContain('"failure"."failureId" IS NULL')
    })

    test('should build query that only costs successfully delivered letters', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[4][0]
      expect(costAttr).toContain('"failure"."failureId" IS NULL')
    })
  })
})
