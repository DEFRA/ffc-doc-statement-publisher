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
    test('returns empty where clause for PERIOD_ALL', () => {
      const result = buildWhereClauseForDateRange(PERIOD_ALL, null, null, false)
      expect(result).toEqual({})
    })

    test('returns empty where clause when startDate is missing', () => {
      const result = buildWhereClauseForDateRange(PERIOD_YTD, null, new Date(), false)
      expect(result).toEqual({})
    })

    test('returns empty where clause when endDate is missing', () => {
      const result = buildWhereClauseForDateRange(PERIOD_YTD, new Date(), null, false)
      expect(result).toEqual({})
    })

    test('returns empty where clause when useSchemeYear is true and not PERIOD_MONTH_IN_YEAR', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 11, 31)
      const result = buildWhereClauseForDateRange(PERIOD_YTD, startDate, endDate, true)
      expect(result).toEqual({})
    })

    test('builds where clause for PERIOD_YEAR with lte operator', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 11, 31)
      const result = buildWhereClauseForDateRange(PERIOD_YEAR, startDate, endDate, false)

      expect(result[db.Sequelize.Op.or]).toBeDefined()
      expect(result[db.Sequelize.Op.or]).toHaveLength(2)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.gte]).toEqual(startDate)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.lte]).toEqual(endDate)
      expect(result[db.Sequelize.Op.or][1].method).toBe(METHOD_LETTER)
      expect(result[db.Sequelize.Op.or][1].requested[db.Sequelize.Op.gte]).toEqual(startDate)
      expect(result[db.Sequelize.Op.or][1].requested[db.Sequelize.Op.lte]).toEqual(endDate)
    })

    test('builds where clause for PERIOD_MONTH_IN_YEAR with lte operator', () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 5, 30)
      const result = buildWhereClauseForDateRange(PERIOD_MONTH_IN_YEAR, startDate, endDate, false)

      expect(result[db.Sequelize.Op.or]).toBeDefined()
      expect(result[db.Sequelize.Op.or]).toHaveLength(2)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.gte]).toEqual(startDate)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.lte]).toEqual(endDate)
      expect(result[db.Sequelize.Op.or][1].method).toBe(METHOD_LETTER)
    })

    test('builds where clause for PERIOD_MONTH_IN_YEAR even when useSchemeYear is true', () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 5, 30)
      const result = buildWhereClauseForDateRange(PERIOD_MONTH_IN_YEAR, startDate, endDate, true)

      expect(result[db.Sequelize.Op.or]).toBeDefined()
      expect(result[db.Sequelize.Op.or]).toHaveLength(2)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.gte]).toEqual(startDate)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.lte]).toEqual(endDate)
    })

    test('builds where clause for PERIOD_YTD with lt operator', () => {
      const startDate = new Date(2023, 0, 1)
      const endDate = new Date(2023, 5, 15)
      const result = buildWhereClauseForDateRange(PERIOD_YTD, startDate, endDate, false)

      expect(result[db.Sequelize.Op.or]).toBeDefined()
      expect(result[db.Sequelize.Op.or]).toHaveLength(2)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.gte]).toEqual(startDate)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.lt]).toEqual(endDate)
      expect(result[db.Sequelize.Op.or][1].method).toBe(METHOD_LETTER)
      expect(result[db.Sequelize.Op.or][1].requested[db.Sequelize.Op.lt]).toEqual(endDate)
    })

    test('builds where clause for PERIOD_MONTH with lt operator', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 0, 31)
      const result = buildWhereClauseForDateRange(PERIOD_MONTH, startDate, endDate, false)

      expect(result[db.Sequelize.Op.or]).toBeDefined()
      expect(result[db.Sequelize.Op.or]).toHaveLength(2)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.lt]).toEqual(endDate)
    })

    test('builds where clause for PERIOD_WEEK with lt operator', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 0, 8)
      const result = buildWhereClauseForDateRange(PERIOD_WEEK, startDate, endDate, false)

      expect(result[db.Sequelize.Op.or]).toBeDefined()
      expect(result[db.Sequelize.Op.or]).toHaveLength(2)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.lt]).toEqual(endDate)
    })

    test('builds where clause for PERIOD_DAY with lt operator', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 0, 2)
      const result = buildWhereClauseForDateRange(PERIOD_DAY, startDate, endDate, false)

      expect(result[db.Sequelize.Op.or]).toBeDefined()
      expect(result[db.Sequelize.Op.or]).toHaveLength(2)
      expect(result[db.Sequelize.Op.or][0].completed[db.Sequelize.Op.lt]).toEqual(endDate)
    })

    test('returns empty object when both dates are null', () => {
      const result = buildWhereClauseForDateRange(PERIOD_YEAR, null, null, false)
      expect(result).toEqual({})
    })
  })

  describe('buildStatementInclude', () => {
    test('includes schemeYear in attributes by default', () => {
      const result = buildStatementInclude(false, null)

      expect(result.model).toBe(db.statement)
      expect(result.as).toBe('statement')
      expect(result.attributes).toEqual(['schemeName', 'schemeYear'])
      expect(result.required).toBe(true)
      expect(result.where).toEqual({})
    })

    test('excludes schemeYear from attributes when includeSchemeYearInSelect is false', () => {
      const result = buildStatementInclude(false, null, false)

      expect(result.attributes).toEqual(['schemeName'])
    })

    test('includes schemeYear when includeSchemeYearInSelect is true', () => {
      const result = buildStatementInclude(false, null, true)

      expect(result.attributes).toEqual(['schemeName', 'schemeYear'])
    })

    test('adds empty where clause when useSchemeYear is false', () => {
      const result = buildStatementInclude(false, 2024)

      expect(result.where).toEqual({})
    })

    test('adds schemeYear filter when useSchemeYear is true and schemeYear is provided', () => {
      const result = buildStatementInclude(true, 2024)

      expect(result.where).toEqual({ schemeYear: '2024' })
    })

    test('converts schemeYear to string in where clause', () => {
      const result = buildStatementInclude(true, 2024)

      expect(typeof result.where.schemeYear).toBe('string')
      expect(result.where.schemeYear).toBe('2024')
    })

    test('omits where clause when useSchemeYear is true but schemeYear is null', () => {
      const result = buildStatementInclude(true, null)

      expect(result.where).toEqual({})
    })

    test('combines useSchemeYear and includeSchemeYearInSelect flags correctly', () => {
      const result = buildStatementInclude(true, 2024, false)

      expect(result.where).toEqual({ schemeYear: '2024' })
      expect(result.attributes).toEqual(['schemeName'])
    })
  })

  describe('buildFailureInclude', () => {
    test('returns correct structure with required false', () => {
      const result = buildFailureInclude()

      expect(result.model).toBe(db.failure)
      expect(result.as).toBe('failure')
      expect(result.attributes).toEqual([])
      expect(result.required).toBe(false)
    })

    test('returns consistent structure on multiple calls', () => {
      const result1 = buildFailureInclude()
      const result2 = buildFailureInclude()

      expect(result1).toEqual(result2)
    })
  })

  describe('buildQueryAttributes', () => {
    test('returns 4 attributes without year or month', () => {
      const attrs = buildQueryAttributes(false, false)

      expect(Array.isArray(attrs)).toBe(true)
      expect(attrs).toHaveLength(4)
    })

    test('returns 5 attributes with year only', () => {
      const attrs = buildQueryAttributes(false, true)

      expect(attrs).toHaveLength(5)
    })

    test('returns 5 attributes with month only', () => {
      const attrs = buildQueryAttributes(true, false)

      expect(attrs).toHaveLength(5)
    })

    test('returns 6 attributes with year and month', () => {
      const attrs = buildQueryAttributes(true, true)

      expect(attrs).toHaveLength(6)
    })

    test('includes receivedYear with COALESCE when includeYear is true', () => {
      const attrs = buildQueryAttributes(false, true)

      expect(attrs[0][0]).toContain('COALESCE')
      expect(attrs[0][0]).toContain('EXTRACT(YEAR')
      expect(attrs[0][0]).toContain('"delivery"."completed"')
      expect(attrs[0][0]).toContain('"delivery"."requested"')
      expect(attrs[0][1]).toBe('receivedYear')
    })

    test('omits receivedYear when includeYear is false', () => {
      const attrs = buildQueryAttributes(false, false)

      const hasYear = attrs.some(attr => attr[1] === 'receivedYear')
      expect(hasYear).toBe(false)
    })

    test('includes receivedMonth with COALESCE when includeMonth is true', () => {
      const attrs = buildQueryAttributes(true, true)

      expect(attrs[1][0]).toContain('COALESCE')
      expect(attrs[1][0]).toContain('EXTRACT(MONTH')
      expect(attrs[1][0]).toContain('"delivery"."completed"')
      expect(attrs[1][0]).toContain('"delivery"."requested"')
      expect(attrs[1][1]).toBe('receivedMonth')
    })

    test('omits receivedMonth when includeMonth is false', () => {
      const attrs = buildQueryAttributes(false, true)

      const hasMonth = attrs.some(attr => attr[1] === 'receivedMonth')
      expect(hasMonth).toBe(false)
    })

    test('totalStatements counts distinct deliveries not failed', () => {
      const attrs = buildQueryAttributes(false, true)
      const totalStmt = attrs[1]

      expect(totalStmt[0]).toContain('COUNT(DISTINCT')
      expect(totalStmt[0]).toContain('"delivery"."deliveryId"')
      expect(totalStmt[0]).toContain('CASE WHEN')
      expect(totalStmt[0]).toContain('"failure"."failureId" IS NULL')
      expect(totalStmt[1]).toBe('totalStatements')
    })

    test('totalStatements includes both completed and letter conditions', () => {
      const attrs = buildQueryAttributes(false, true)
      const totalStmt = attrs[1]

      expect(totalStmt[0]).toContain('OR')
      expect(totalStmt[0]).toContain('"delivery"."completed" IS NOT NULL')
      expect(totalStmt[0]).toContain(`"delivery"."method" = '${METHOD_LETTER}'`)
    })

    test('printPostCount counts letters only without completed requirement', () => {
      const attrs = buildQueryAttributes(false, true)
      const printPost = attrs[2]

      expect(printPost[0]).toContain('COUNT(CASE')
      expect(printPost[0]).toContain(`"delivery"."method" = '${METHOD_LETTER}'`)
      expect(printPost[0]).toContain('"failure"."failureId" IS NULL')
      expect(printPost[0]).not.toContain('"delivery"."completed" IS NOT NULL')
      expect(printPost[1]).toBe('printPostCount')
    })

    test('printPostCost applies 2026 pricing for recent dates', () => {
      const attrs = buildQueryAttributes(false, true)
      const cost = attrs[3]

      expect(cost[0]).toContain('SUM(')
      expect(cost[0]).toContain(`WHEN "delivery"."method" = '${METHOD_LETTER}'`)
      expect(cost[0]).toContain('COALESCE')
      expect(cost[0]).toContain('"delivery"."completed", "delivery"."requested"')
      expect(cost[0]).toContain(`>= '${PRINT_POST_PRICING_START_2026}'`)
      expect(cost[0]).toContain(`THEN ${PRINT_POST_UNIT_COST_2026}`)
    })

    test('printPostCost applies 2024 pricing for dates after start', () => {
      const attrs = buildQueryAttributes(false, true)
      const cost = attrs[3]

      expect(cost[0]).toContain('COALESCE')
      expect(cost[0]).toContain('"delivery"."completed", "delivery"."requested"')
      expect(cost[0]).toContain(`>= '${PRINT_POST_PRICING_START_2024}'`)
      expect(cost[0]).toContain(`THEN ${PRINT_POST_UNIT_COST_2024}`)
    })

    test('printPostCost applies default pricing for older dates', () => {
      const attrs = buildQueryAttributes(false, true)
      const cost = attrs[3]

      expect(cost[0]).toContain(`WHEN "delivery"."method" = '${METHOD_LETTER}'`)
      expect(cost[0]).toContain('"failure"."failureId" IS NULL')
      expect(cost[0]).toContain(`THEN ${DEFAULT_PRINT_POST_UNIT_COST}`)
    })

    test('printPostCost excludes failed deliveries', () => {
      const attrs = buildQueryAttributes(false, true)
      const cost = attrs[3]

      expect(cost[0]).toContain('"failure"."failureId" IS NULL')
    })

    test('emailCount requires completed timestamp and not failed', () => {
      const attrs = buildQueryAttributes(false, true)
      const email = attrs[4]

      expect(email[0]).toContain('COUNT(CASE')
      expect(email[0]).toContain(`"delivery"."method" = '${METHOD_EMAIL}'`)
      expect(email[0]).toContain('"delivery"."completed" IS NOT NULL')
      expect(email[0]).toContain('"failure"."failureId" IS NULL')
      expect(email[1]).toBe('emailCount')
    })

    test('maintains correct attribute order', () => {
      const attrs = buildQueryAttributes(true, true)

      expect(attrs[0][1]).toBe('receivedYear')
      expect(attrs[1][1]).toBe('receivedMonth')
      expect(attrs[2][1]).toBe('totalStatements')
      expect(attrs[3][1]).toBe('printPostCount')
      expect(attrs[4][1]).toBe('printPostCost')
      expect(attrs[5][1]).toBe('emailCount')
    })
  })

  describe('fetchMetricsData', () => {
    test('fetches metrics for PERIOD_ALL without receivedYear', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_ALL)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.where).toEqual(whereClause)
      expect(call.group).toContain('statement."schemeName"')
      expect(call.group).toContain('statement."schemeYear"')
      expect(call.group).toHaveLength(2)
      expect(call.raw).toBe(true)
    })

    test('fetches metrics for PERIOD_YEAR with receivedYear in group', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
      expect(call.group[0]).toContain('EXTRACT(YEAR')
      expect(call.group[1]).toBe('statement."schemeName"')
    })

    test('fetches metrics for PERIOD_MONTH_IN_YEAR with year and month in group', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, true, 2024, 6, PERIOD_MONTH_IN_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(3)
      expect(call.group[0]).toContain('EXTRACT(MONTH')
      expect(call.group[1]).toContain('EXTRACT(YEAR')
      expect(call.group[2]).toBe('statement."schemeName"')
    })

    test('fetches metrics for PERIOD_YTD with receivedYear', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_YTD)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
      expect(call.group[0]).toContain('EXTRACT(YEAR')
    })

    test('fetches metrics for PERIOD_MONTH with receivedYear', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_MONTH)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
      expect(call.group[0]).toContain('EXTRACT(YEAR')
    })

    test('fetches metrics for PERIOD_WEEK with receivedYear', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_WEEK)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
      expect(call.group[0]).toContain('EXTRACT(YEAR')
    })

    test('fetches metrics for PERIOD_DAY with receivedYear', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const whereClause = {}

      await fetchMetricsData(whereClause, false, null, null, PERIOD_DAY)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.group).toHaveLength(2)
      expect(call.group[0]).toContain('EXTRACT(YEAR')
    })

    test('includes statement join with useSchemeYear filter', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, true, 2024, null, PERIOD_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      const statement = call.include.find(inc => inc.as === 'statement')
      expect(statement.where).toEqual({ schemeYear: '2024' })
    })

    test('includes statement join without filter when useSchemeYear is false', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      const statement = call.include.find(inc => inc.as === 'statement')
      expect(statement.where).toEqual({})
    })

    test('includes failure join with required false', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      const failure = call.include.find(inc => inc.as === 'failure')
      expect(failure.required).toBe(false)
      expect(failure.attributes).toEqual([])
    })

    test('passes attributes from buildQueryAttributes for PERIOD_ALL', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_ALL)

      const call = db.delivery.findAll.mock.calls[0][0]
      const expected = buildQueryAttributes(false, false)
      expect(call.attributes).toEqual(expected)
    })

    test('passes attributes from buildQueryAttributes for PERIOD_MONTH_IN_YEAR', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_MONTH_IN_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      const expected = buildQueryAttributes(true, true)
      expect(call.attributes).toEqual(expected)
    })

    test('passes attributes from buildQueryAttributes for non-ALL periods', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      const expected = buildQueryAttributes(false, true)
      expect(call.attributes).toEqual(expected)
    })

    test('sets raw to true', async () => {
      db.delivery.findAll.mockResolvedValue([])

      await fetchMetricsData({}, false, null, null, PERIOD_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.raw).toBe(true)
    })

    test('returns results from findAll', async () => {
      const mockResults = [{ schemeName: 'SFI', totalStatements: 10 }]
      db.delivery.findAll.mockResolvedValue(mockResults)

      const result = await fetchMetricsData({}, false, null, null, PERIOD_YEAR)

      expect(result).toBe(mockResults)
    })

    test('handles complex where clauses', async () => {
      db.delivery.findAll.mockResolvedValue([])
      const complexWhere = {
        [db.Sequelize.Op.or]: [
          { completed: { [db.Sequelize.Op.gte]: new Date() } },
          { method: METHOD_LETTER }
        ]
      }

      await fetchMetricsData(complexWhere, false, null, null, PERIOD_YEAR)

      const call = db.delivery.findAll.mock.calls[0][0]
      expect(call.where).toEqual(complexWhere)
    })

    test('propagates errors from findAll', async () => {
      const error = new Error('Database error')
      db.delivery.findAll.mockRejectedValue(error)

      await expect(fetchMetricsData({}, false, null, null, PERIOD_YEAR)).rejects.toEqual(error)
    })

    test('returns empty array when no results found', async () => {
      db.delivery.findAll.mockResolvedValue([])

      const result = await fetchMetricsData({}, false, null, null, PERIOD_YEAR)

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
