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
const { PERIOD_ALL, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_YTD, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY } = require('../../../app/constants/periods')

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
    test('should return empty where clause for PERIOD_ALL', () => {
      const result = buildWhereClauseForDateRange(PERIOD_ALL, null, null, false)
      expect(result).toEqual({})
    })

    test('should return empty where clause if startDate is missing', () => {
      const result = buildWhereClauseForDateRange(PERIOD_YTD, null, new Date(), false)
      expect(result).toEqual({})
    })

    test('should return empty where clause if endDate is missing', () => {
      const result = buildWhereClauseForDateRange(PERIOD_YTD, new Date(), null, false)
      expect(result).toEqual({})
    })

    test('should return empty where clause if useSchemeYear is true and period is not PERIOD_MONTH_IN_YEAR', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 11, 31)
      const result = buildWhereClauseForDateRange(PERIOD_YTD, startDate, endDate, true)
      expect(result).toEqual({})
    })

    test('should build where clause for PERIOD_YTD with lt operator', () => {
      const startDate = new Date(2023, 0, 1)
      const endDate = new Date(2023, 5, 15)
      const result = buildWhereClauseForDateRange(PERIOD_YTD, startDate, endDate, false)

      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lt]: endDate
        }
      })
    })

    test('should build where clause for PERIOD_YEAR with lte operator', () => {
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

    test('should build where clause for PERIOD_MONTH_IN_YEAR with lte operator', () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 5, 30, 23, 59, 59, 999)
      const result = buildWhereClauseForDateRange(PERIOD_MONTH_IN_YEAR, startDate, endDate, false)

      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lte]: endDate
        }
      })
    })

    test('should build where clause for PERIOD_MONTH_IN_YEAR even with useSchemeYear true', () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 5, 30, 23, 59, 59, 999)
      const result = buildWhereClauseForDateRange(PERIOD_MONTH_IN_YEAR, startDate, endDate, true)

      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lte]: endDate
        }
      })
    })

    test('should build where clause for PERIOD_MONTH with lt operator', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 0, 31)
      const result = buildWhereClauseForDateRange(PERIOD_MONTH, startDate, endDate, false)

      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lt]: endDate
        }
      })
    })

    test('should build where clause for PERIOD_WEEK with lt operator', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 0, 8)
      const result = buildWhereClauseForDateRange(PERIOD_WEEK, startDate, endDate, false)

      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lt]: endDate
        }
      })
    })

    test('should build where clause for PERIOD_DAY with lt operator', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 0, 2)
      const result = buildWhereClauseForDateRange(PERIOD_DAY, startDate, endDate, false)

      expect(result).toEqual({
        completed: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lt]: endDate
        }
      })
    })

    test('should return empty object when both dates are null', () => {
      const result = buildWhereClauseForDateRange(PERIOD_YEAR, null, null, false)
      expect(result).toEqual({})
    })

    test('should prioritize PERIOD_MONTH_IN_YEAR logic over useSchemeYear check', () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 5, 30)
      const result = buildWhereClauseForDateRange(PERIOD_MONTH_IN_YEAR, startDate, endDate, true)

      expect(result.completed).toBeDefined()
      expect(result.completed[db.Sequelize.Op.gte]).toEqual(startDate)
      expect(result.completed[db.Sequelize.Op.lte]).toEqual(endDate)
    })
  })

  describe('buildStatementInclude', () => {
    test('should build statement include with schemeYear in attributes by default', () => {
      const result = buildStatementInclude(false, null)

      expect(result).toEqual({
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName', 'schemeYear'],
        required: true,
        where: {}
      })
    })

    test('should build statement include without schemeYear when includeSchemeYearInSelect is false', () => {
      const result = buildStatementInclude(false, null, false)

      expect(result).toEqual({
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName'],
        required: true,
        where: {}
      })
    })

    test('should build statement include with schemeYear when includeSchemeYearInSelect is true', () => {
      const result = buildStatementInclude(false, null, true)

      expect(result).toEqual({
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName', 'schemeYear'],
        required: true,
        where: {}
      })
    })

    test('should build statement include with useSchemeYear true but no schemeYear value', () => {
      const result = buildStatementInclude(true, null)

      expect(result).toEqual({
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName', 'schemeYear'],
        required: true,
        where: {}
      })
    })

    test('should build statement include with schemeYear filter when provided', () => {
      const result = buildStatementInclude(true, 2024)

      expect(result).toEqual({
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName', 'schemeYear'],
        required: true,
        where: { schemeYear: '2024' }
      })
    })

    test('should build statement include with schemeYear filter and without schemeYear in attributes', () => {
      const result = buildStatementInclude(true, 2024, false)

      expect(result).toEqual({
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName'],
        required: true,
        where: { schemeYear: '2024' }
      })
    })

    test('should convert schemeYear to string for where clause', () => {
      const result = buildStatementInclude(true, 2024)

      expect(result.where.schemeYear).toBe('2024')
      expect(typeof result.where.schemeYear).toBe('string')
    })

    test('should not add where clause when useSchemeYear is false', () => {
      const result = buildStatementInclude(false, 2024)

      expect(result.where).toEqual({})
    })

    test('should not add where clause when schemeYear is null even if useSchemeYear is true', () => {
      const result = buildStatementInclude(true, null)

      expect(result.where).toEqual({})
    })
  })

  describe('buildFailureInclude', () => {
    test('should build failure include with correct structure', () => {
      const result = buildFailureInclude()

      expect(result).toEqual({
        model: db.failure,
        as: 'failure',
        attributes: [],
        required: false
      })
    })

    test('should always return same structure', () => {
      const result1 = buildFailureInclude()
      const result2 = buildFailureInclude()

      expect(result1).toEqual(result2)
    })

    test('should set required to false for left join', () => {
      const result = buildFailureInclude()

      expect(result.required).toBe(false)
    })

    test('should have empty attributes array', () => {
      const result = buildFailureInclude()

      expect(result.attributes).toEqual([])
      expect(Array.isArray(result.attributes)).toBe(true)
    })
  })

  describe('buildQueryAttributes', () => {
    test('should return array of 6 query attributes when includeMonth is false', () => {
      const attrs = buildQueryAttributes(false)

      expect(Array.isArray(attrs)).toBe(true)
      expect(attrs).toHaveLength(6)
    })

    test('should return array of 6 query attributes by default', () => {
      const attrs = buildQueryAttributes()

      expect(Array.isArray(attrs)).toBe(true)
      expect(attrs).toHaveLength(6)
    })

    test('should return array of 7 query attributes when includeMonth is true', () => {
      const attrs = buildQueryAttributes(true)

      expect(Array.isArray(attrs)).toBe(true)
      expect(attrs).toHaveLength(7)
    })

    test('should include receivedYear extraction', () => {
      const attrs = buildQueryAttributes()

      expect(attrs[0][0]).toContain('EXTRACT(YEAR')
      expect(attrs[0][0]).toContain('"delivery"."completed"')
      expect(attrs[0][1]).toBe('receivedYear')
    })

    test('should include receivedMonth extraction when includeMonth is true', () => {
      const attrs = buildQueryAttributes(true)

      expect(attrs[1][0]).toContain('EXTRACT(MONTH')
      expect(attrs[1][0]).toContain('"delivery"."completed"')
      expect(attrs[1][1]).toBe('receivedMonth')
    })

    test('should not include receivedMonth extraction when includeMonth is false', () => {
      const attrs = buildQueryAttributes(false)

      const hasMonth = attrs.some(attr => attr[1] === 'receivedMonth')
      expect(hasMonth).toBe(false)
    })

    test('should include totalStatements count without month', () => {
      const attrs = buildQueryAttributes(false)

      expect(attrs[1][0]).toContain('COUNT(DISTINCT')
      expect(attrs[1][0]).toContain('"delivery"."deliveryId"')
      expect(attrs[1][0]).toContain('"failure"."failureId" IS NULL')
      expect(attrs[1][1]).toBe('totalStatements')
    })

    test('should include totalStatements count with month', () => {
      const attrs = buildQueryAttributes(true)

      expect(attrs[2][0]).toContain('COUNT(DISTINCT')
      expect(attrs[2][0]).toContain('"delivery"."deliveryId"')
      expect(attrs[2][0]).toContain('"failure"."failureId" IS NULL')
      expect(attrs[2][1]).toBe('totalStatements')
    })

    test('should include printPostCount with METHOD_LETTER without month', () => {
      const attrs = buildQueryAttributes(false)

      expect(attrs[2][0]).toContain(`COUNT(CASE WHEN "delivery"."method" = '${METHOD_LETTER}'`)
      expect(attrs[2][0]).toContain('"failure"."failureId" IS NULL')
      expect(attrs[2][1]).toBe('printPostCount')
    })

    test('should include printPostCount with METHOD_LETTER with month', () => {
      const attrs = buildQueryAttributes(true)

      expect(attrs[3][0]).toContain(`COUNT(CASE WHEN "delivery"."method" = '${METHOD_LETTER}'`)
      expect(attrs[3][0]).toContain('"failure"."failureId" IS NULL')
      expect(attrs[3][1]).toBe('printPostCount')
    })

    test('should include printPostCost with tiered pricing without month', () => {
      const attrs = buildQueryAttributes(false)
      const costAttr = attrs[3][0]

      expect(costAttr).toContain('SUM(')
      expect(costAttr).toContain(`WHEN "delivery"."method" = '${METHOD_LETTER}'`)
      expect(costAttr).toContain('"failure"."failureId" IS NULL')
      expect(costAttr).toContain(PRINT_POST_PRICING_START_2026)
      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2026))
      expect(costAttr).toContain(PRINT_POST_PRICING_START_2024)
      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2024))
      expect(costAttr).toContain(String(DEFAULT_PRINT_POST_UNIT_COST))
      expect(attrs[3][1]).toBe('printPostCost')
    })

    test('should include printPostCost with tiered pricing with month', () => {
      const attrs = buildQueryAttributes(true)
      const costAttr = attrs[4][0]

      expect(costAttr).toContain('SUM(')
      expect(costAttr).toContain(`WHEN "delivery"."method" = '${METHOD_LETTER}'`)
      expect(costAttr).toContain('"failure"."failureId" IS NULL')
      expect(costAttr).toContain(PRINT_POST_PRICING_START_2026)
      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2026))
      expect(costAttr).toContain(PRINT_POST_PRICING_START_2024)
      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2024))
      expect(costAttr).toContain(String(DEFAULT_PRINT_POST_UNIT_COST))
      expect(attrs[4][1]).toBe('printPostCost')
    })

    test('should include emailCount with METHOD_EMAIL without month', () => {
      const attrs = buildQueryAttributes(false)

      expect(attrs[4][0]).toContain(`COUNT(CASE WHEN "delivery"."method" = '${METHOD_EMAIL}'`)
      expect(attrs[4][0]).toContain('"failure"."failureId" IS NULL')
      expect(attrs[4][1]).toBe('emailCount')
    })

    test('should include emailCount with METHOD_EMAIL with month', () => {
      const attrs = buildQueryAttributes(true)

      expect(attrs[5][0]).toContain(`COUNT(CASE WHEN "delivery"."method" = '${METHOD_EMAIL}'`)
      expect(attrs[5][0]).toContain('"failure"."failureId" IS NULL')
      expect(attrs[5][1]).toBe('emailCount')
    })

    test('should include failureCount without month', () => {
      const attrs = buildQueryAttributes(false)

      expect(attrs[5][0]).toContain('COUNT(failure.failureId)')
      expect(attrs[5][1]).toBe('failureCount')
    })

    test('should include failureCount with month', () => {
      const attrs = buildQueryAttributes(true)

      expect(attrs[6][0]).toContain('COUNT(failure.failureId)')
      expect(attrs[6][1]).toBe('failureCount')
    })
  })

  describe('fetchMetricsData', () => {
    test('should fetch metrics data for PERIOD_ALL with schemeYear in group and attributes', async () => {
      const mockResults = [{ 'statement.schemeName': 'SFI', 'statement.schemeYear': '2024' }]
      db.delivery.findAll.mockResolvedValue(mockResults)
      const whereClause = {}

      const result = await fetchMetricsData(whereClause, false, null, null, PERIOD_ALL)

      expect(db.delivery.findAll).toHaveBeenCalledWith({
        attributes: buildQueryAttributes(false),
        include: [
          buildStatementInclude(false, null, true),
          buildFailureInclude()
        ],
        where: whereClause,
        group: expect.arrayContaining([
          expect.stringContaining('EXTRACT(YEAR FROM "delivery"."completed")'),
          expect.stringContaining('statement."schemeName"'),
          expect.stringContaining('statement."schemeYear"')
        ]),
        raw: true
      })
      expect(result).toBe(mockResults)
    })

    test('should fetch metrics data for PERIOD_YEAR without schemeYear in group', async () => {
      const mockResults = [{ 'statement.schemeName': 'SFI' }]
      db.delivery.findAll.mockResolvedValue(mockResults)
      const whereClause = { completed: { [db.Sequelize.Op.gte]: new Date() } }

      const result = await fetchMetricsData(whereClause, false, 2024, null, PERIOD_YEAR)

      expect(db.delivery.findAll).toHaveBeenCalledWith({
        attributes: buildQueryAttributes(false),
        include: [
          buildStatementInclude(false, 2024, false),
          buildFailureInclude()
        ],
        where: whereClause,
        group: expect.not.arrayContaining([
          expect.stringContaining('statement."schemeYear"')
        ]),
        raw: true
      })
      expect(result).toBe(mockResults)
    })

    test('should fetch metrics data for PERIOD_MONTH_IN_YEAR with month in group', async () => {
      const mockResults = []
      db.delivery.findAll.mockResolvedValue(mockResults)
      const whereClause = {}

      const result = await fetchMetricsData(whereClause, true, 2024, 6, PERIOD_MONTH_IN_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.attributes).toEqual(buildQueryAttributes(true))
      expect(call.include[0]).toEqual(buildStatementInclude(true, 2024, false))
      expect(call.group).toHaveLength(3)
      expect(call.group).toContain('EXTRACT(MONTH FROM "delivery"."completed")')
      expect(result).toBe(mockResults)
    })

    test('should pass schemeYear filter to buildStatementInclude when useSchemeYear is true', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, true, 2024, 6, PERIOD_MONTH_IN_YEAR)

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

    test('should handle PERIOD_YTD without schemeYear in group', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_YTD)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
      expect(call.include[0].attributes).toEqual(['schemeName'])
    })

    test('should handle PERIOD_MONTH without schemeYear in group', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_MONTH)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
      expect(call.include[0].attributes).toEqual(['schemeName'])
    })

    test('should handle PERIOD_WEEK without schemeYear in group', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_WEEK)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
    })

    test('should handle PERIOD_DAY without schemeYear in group', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_DAY)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
    })

    test('should always include failure in query', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_ALL)

      expect(db.delivery.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            buildFailureInclude()
          ])
        })
      )
    })

    test('should set raw to true for plain objects', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_ALL)

      expect(db.delivery.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          raw: true
        })
      )
    })

    test('should propagate error from db.delivery.findAll', async () => {
      db.delivery.findAll.mockRejectedValue(new Error('DB error'))

      await expect(fetchMetricsData({}, false, null, null, PERIOD_ALL))
        .rejects.toThrow('DB error')
    })

    test('should return empty array when no results', async () => {
      db.delivery.findAll.mockResolvedValue([])

      const result = await fetchMetricsData({}, false, null, null, PERIOD_ALL)

      expect(result).toEqual([])
    })

    test('should handle complex where clause', async () => {
      const complexWhere = {
        completed: {
          [db.Sequelize.Op.gte]: new Date(2024, 0, 1),
          [db.Sequelize.Op.lte]: new Date(2024, 11, 31)
        }
      }
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData(complexWhere, false, null, null, PERIOD_YEAR)

      expect(db.delivery.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: complexWhere
        })
      )
    })

    test('should group by receivedYear and schemeName for non-ALL, non-MONTH_IN_YEAR periods', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toContain('EXTRACT(YEAR FROM "delivery"."completed")')
      expect(call.group).toContain('statement."schemeName"')
      expect(call.group).toHaveLength(2)
    })

    test('should group by receivedYear, schemeName, and schemeYear for PERIOD_ALL', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_ALL)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toContain('EXTRACT(YEAR FROM "delivery"."completed")')
      expect(call.group).toContain('statement."schemeName"')
      expect(call.group).toContain('statement."schemeYear"')
      expect(call.group).toHaveLength(3)
    })

    test('should group by receivedYear, receivedMonth, and schemeName for PERIOD_MONTH_IN_YEAR', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_MONTH_IN_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toContain('EXTRACT(YEAR FROM "delivery"."completed")')
      expect(call.group).toContain('EXTRACT(MONTH FROM "delivery"."completed")')
      expect(call.group).toContain('statement."schemeName"')
      expect(call.group).toHaveLength(3)
    })
  })

  describe('pricing constants integration', () => {
    test('should use PRINT_POST_PRICING_START_2024 constant in queries', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[3][0]

      expect(costAttr).toContain(PRINT_POST_PRICING_START_2024)
    })

    test('should use PRINT_POST_PRICING_START_2026 constant in queries', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[3][0]

      expect(costAttr).toContain(PRINT_POST_PRICING_START_2026)
    })

    test('should use PRINT_POST_UNIT_COST_2024 for pricing tier', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[3][0]

      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2024))
    })

    test('should use PRINT_POST_UNIT_COST_2026 for pricing tier', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[3][0]

      expect(costAttr).toContain(String(PRINT_POST_UNIT_COST_2026))
    })

    test('should use DEFAULT_PRINT_POST_UNIT_COST as fallback', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[3][0]

      expect(costAttr).toContain(String(DEFAULT_PRINT_POST_UNIT_COST))
    })

    test('should apply pricing in correct chronological order', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[3][0]

      const index2026 = costAttr.indexOf(PRINT_POST_PRICING_START_2026)
      const index2024 = costAttr.indexOf(PRINT_POST_PRICING_START_2024)

      expect(index2026).toBeGreaterThan(-1)
      expect(index2024).toBeGreaterThan(-1)
      expect(index2026).toBeLessThan(index2024)
    })
  })

  describe('delivery method constants integration', () => {
    test('should use METHOD_LETTER constant for print post count', () => {
      const attrs = buildQueryAttributes()
      const printPostCount = attrs[2][0]

      expect(printPostCount).toContain(METHOD_LETTER)
    })

    test('should use METHOD_LETTER constant for cost calculation', () => {
      const attrs = buildQueryAttributes()
      const costAttr = attrs[3][0]

      expect(costAttr).toContain(METHOD_LETTER)
    })

    test('should use METHOD_EMAIL constant for email count', () => {
      const attrs = buildQueryAttributes()
      const emailAttr = attrs[4][0]

      expect(emailAttr).toContain(METHOD_EMAIL)
    })
  })

  describe('query building - failure exclusion logic', () => {
    test('should exclude failed deliveries from totalStatements count', () => {
      const attrs = buildQueryAttributes()
      const totalStatements = attrs[1][0]

      expect(totalStatements).toContain('"failure"."failureId" IS NULL')
      expect(totalStatements).toContain('"delivery"."completed" IS NOT NULL')
    })

    test('should exclude failed deliveries from printPostCount', () => {
      const attrs = buildQueryAttributes()
      const printPostCount = attrs[2][0]

      expect(printPostCount).toContain('"failure"."failureId" IS NULL')
      expect(printPostCount).toContain('"delivery"."completed" IS NOT NULL')
    })

    test('should exclude failed deliveries from emailCount', () => {
      const attrs = buildQueryAttributes()
      const emailCount = attrs[4][0]

      expect(emailCount).toContain('"failure"."failureId" IS NULL')
      expect(emailCount).toContain('"delivery"."completed" IS NOT NULL')
    })

    test('should only cost successfully delivered letters', () => {
      const attrs = buildQueryAttributes()
      const printPostCost = attrs[3][0]

      expect(printPostCost).toContain('"failure"."failureId" IS NULL')
      expect(printPostCost).toContain('"delivery"."completed" IS NOT NULL')
    })

    test('should include all failures in failureCount regardless of delivery status', () => {
      const attrs = buildQueryAttributes()
      const failureCount = attrs[5][0]

      expect(failureCount).toContain('COUNT(failure.failureId)')
      expect(failureCount).not.toContain('IS NULL')
    })
  })

  describe('edge cases and defensive programming', () => {
    test('should handle null month parameter in fetchMetricsData', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await expect(fetchMetricsData({}, false, null, null, PERIOD_YEAR))
        .resolves.toEqual([])
    })

    test('should handle undefined period parameter gracefully', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, undefined)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
    })

    test('should handle empty where clause', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_ALL)

      expect(db.delivery.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}
        })
      )
    })
  })
})
