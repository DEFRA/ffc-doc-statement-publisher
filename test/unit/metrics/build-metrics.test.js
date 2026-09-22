const {
  PRINT_POST_UNIT_COST_2024,
  PRINT_POST_UNIT_COST_2026,
  DEFAULT_PRINT_POST_UNIT_COST,
  PRINT_POST_PRICING_START_2024,
  PRINT_POST_PRICING_START_2026
} = require('../../../app/constants/print-post-pricing')
const { METHOD_LETTER, METHOD_EMAIL } = require('../../../app/constants/delivery-methods')
const { PERIOD_ALL, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_YTD, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY } = require('../../../app/constants/periods')

const { createKnexMock, createQueryBuilder } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['delivery'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const {
  buildWhereClauseForDateRange,
  buildStatementInclude,
  buildFailureInclude,
  buildQueryAttributes,
  fetchMetricsData
} = require('../../../app/metrics/build-metrics')

describe('build-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves([])
  })

  describe('buildWhereClauseForDateRange', () => {
    test('returns a no-op modifier for PERIOD_ALL', () => {
      const modifier = buildWhereClauseForDateRange(PERIOD_ALL, null, null, false)
      expect(typeof modifier).toBe('function')

      const builder = createQueryBuilder()
      modifier(builder)
      expect(builder.where).not.toHaveBeenCalled()
    })

    test('returns a no-op modifier when startDate is missing', () => {
      const modifier = buildWhereClauseForDateRange(PERIOD_YTD, null, new Date(), false)
      const builder = createQueryBuilder()
      modifier(builder)
      expect(builder.where).not.toHaveBeenCalled()
    })

    test('returns a no-op modifier when endDate is missing', () => {
      const modifier = buildWhereClauseForDateRange(PERIOD_YTD, new Date(), null, false)
      const builder = createQueryBuilder()
      modifier(builder)
      expect(builder.where).not.toHaveBeenCalled()
    })

    test('returns a no-op modifier when useSchemeYear is true', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 11, 31)
      const modifier = buildWhereClauseForDateRange(PERIOD_YTD, startDate, endDate, true)
      const builder = createQueryBuilder()
      modifier(builder)
      expect(builder.where).not.toHaveBeenCalled()
    })

    test('returns a no-op modifier when both dates are null', () => {
      const modifier = buildWhereClauseForDateRange(PERIOD_YEAR, null, null, false)
      const builder = createQueryBuilder()
      modifier(builder)
      expect(builder.where).not.toHaveBeenCalled()
    })

    const assertRangeModifier = (modifier, startDate, endDate, upperBoundOperator) => {
      const outerBuilder = createQueryBuilder()
      modifier(outerBuilder)

      expect(outerBuilder.where).toHaveBeenCalledWith(expect.any(Function))
      const whereFn = outerBuilder.where.mock.calls[0][0]

      const innerBuilder = createQueryBuilder()
      whereFn.call(innerBuilder)

      expect(innerBuilder.where).toHaveBeenCalledWith('deliveries.completed', '>=', startDate)
      expect(innerBuilder.andWhere).toHaveBeenCalledWith('deliveries.completed', upperBoundOperator, endDate)
      expect(innerBuilder.orWhere).toHaveBeenCalledWith(expect.any(Function))

      const orWhereFn = innerBuilder.orWhere.mock.calls[0][0]
      const orInnerBuilder = createQueryBuilder()
      orWhereFn.call(orInnerBuilder)

      expect(orInnerBuilder.where).toHaveBeenCalledWith('deliveries.method', METHOD_LETTER)
      expect(orInnerBuilder.andWhere).toHaveBeenCalledWith('deliveries.requested', '>=', startDate)
      expect(orInnerBuilder.andWhere).toHaveBeenCalledWith('deliveries.requested', upperBoundOperator, endDate)
    }

    test('builds a date-range modifier for PERIOD_YEAR using <= as the upper bound', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 11, 31)
      const modifier = buildWhereClauseForDateRange(PERIOD_YEAR, startDate, endDate, false)
      assertRangeModifier(modifier, startDate, endDate, '<=')
    })

    test('builds a date-range modifier for PERIOD_MONTH_IN_YEAR using <= as the upper bound', () => {
      const startDate = new Date(2024, 5, 1)
      const endDate = new Date(2024, 5, 30)
      const modifier = buildWhereClauseForDateRange(PERIOD_MONTH_IN_YEAR, startDate, endDate, false)
      assertRangeModifier(modifier, startDate, endDate, '<=')
    })

    test('builds a date-range modifier for PERIOD_YTD using < as the upper bound', () => {
      const startDate = new Date(2023, 0, 1)
      const endDate = new Date(2023, 5, 15)
      const modifier = buildWhereClauseForDateRange(PERIOD_YTD, startDate, endDate, false)
      assertRangeModifier(modifier, startDate, endDate, '<')
    })

    test('builds a date-range modifier for PERIOD_MONTH using < as the upper bound', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 0, 31)
      const modifier = buildWhereClauseForDateRange(PERIOD_MONTH, startDate, endDate, false)
      assertRangeModifier(modifier, startDate, endDate, '<')
    })

    test('builds a date-range modifier for PERIOD_WEEK using < as the upper bound', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 0, 8)
      const modifier = buildWhereClauseForDateRange(PERIOD_WEEK, startDate, endDate, false)
      assertRangeModifier(modifier, startDate, endDate, '<')
    })

    test('builds a date-range modifier for PERIOD_DAY using < as the upper bound', () => {
      const startDate = new Date(2024, 0, 1)
      const endDate = new Date(2024, 0, 2)
      const modifier = buildWhereClauseForDateRange(PERIOD_DAY, startDate, endDate, false)
      assertRangeModifier(modifier, startDate, endDate, '<')
    })
  })

  describe('buildStatementInclude', () => {
    test('joins statements and selects schemeName plus schemeYear by default', () => {
      const modifier = buildStatementInclude(false, null)
      const builder = createQueryBuilder()
      modifier(builder)

      expect(builder.innerJoin).toHaveBeenCalledWith('statements', 'statements.statementId', 'deliveries.statementId')
      expect(builder.select).toHaveBeenCalledTimes(2)
      expect(mockDb.knex.raw).toHaveBeenCalledWith('statements."schemeName" as "statement.schemeName"')
      expect(mockDb.knex.raw).toHaveBeenCalledWith('statements."schemeYear" as "statement.schemeYear"')
      expect(builder.andWhere).not.toHaveBeenCalled()
    })

    test('excludes schemeYear from the select when includeSchemeYearInSelect is false', () => {
      const modifier = buildStatementInclude(false, null, false)
      const builder = createQueryBuilder()
      modifier(builder)

      expect(builder.select).toHaveBeenCalledTimes(1)
      expect(mockDb.knex.raw).not.toHaveBeenCalledWith('statements."schemeYear" as "statement.schemeYear"')
    })

    test('includes schemeYear in the select when includeSchemeYearInSelect is true', () => {
      const modifier = buildStatementInclude(false, null, true)
      const builder = createQueryBuilder()
      modifier(builder)

      expect(builder.select).toHaveBeenCalledTimes(2)
    })

    test('does not filter by schemeYear when useSchemeYear is false', () => {
      const modifier = buildStatementInclude(false, 2024)
      const builder = createQueryBuilder()
      modifier(builder)

      expect(builder.andWhere).not.toHaveBeenCalled()
    })

    test('filters by schemeYear (converted to a string) when useSchemeYear is true and schemeYear is provided', () => {
      const modifier = buildStatementInclude(true, 2024)
      const builder = createQueryBuilder()
      modifier(builder)

      expect(builder.andWhere).toHaveBeenCalledWith('statements.schemeYear', '2024')
      expect(typeof builder.andWhere.mock.calls[0][1]).toBe('string')
    })

    test('omits the schemeYear filter when useSchemeYear is true but schemeYear is null', () => {
      const modifier = buildStatementInclude(true, null)
      const builder = createQueryBuilder()
      modifier(builder)

      expect(builder.andWhere).not.toHaveBeenCalled()
    })

    test('combines useSchemeYear and includeSchemeYearInSelect flags correctly', () => {
      const modifier = buildStatementInclude(true, 2024, false)
      const builder = createQueryBuilder()
      modifier(builder)

      expect(builder.andWhere).toHaveBeenCalledWith('statements.schemeYear', '2024')
      expect(builder.select).toHaveBeenCalledTimes(1)
    })
  })

  describe('buildFailureInclude', () => {
    test('left joins failures on deliveryId', () => {
      const modifier = buildFailureInclude()
      const builder = createQueryBuilder()
      modifier(builder)

      expect(builder.leftJoin).toHaveBeenCalledWith('failures', 'failures.deliveryId', 'deliveries.deliveryId')
    })

    test('returns a fresh modifier function on each call', () => {
      const modifier1 = buildFailureInclude()
      const modifier2 = buildFailureInclude()

      expect(typeof modifier1).toBe('function')
      expect(typeof modifier2).toBe('function')
      expect(modifier1).not.toBe(modifier2)
    })
  })

  describe('buildQueryAttributes', () => {
    test('returns 4 attributes without year or month', () => {
      const attrs = buildQueryAttributes(false, false)
      expect(Array.isArray(attrs)).toBe(true)
      expect(attrs).toHaveLength(4)
    })

    test('returns 5 attributes with year only', () => {
      expect(buildQueryAttributes(false, true)).toHaveLength(5)
    })

    test('returns 5 attributes with month only', () => {
      expect(buildQueryAttributes(true, false)).toHaveLength(5)
    })

    test('returns 6 attributes with year and month', () => {
      expect(buildQueryAttributes(true, true)).toHaveLength(6)
    })

    test('includes receivedYear with COALESCE when includeYear is true', () => {
      const attrs = buildQueryAttributes(false, true)
      expect(attrs[0].sql).toContain('COALESCE')
      expect(attrs[0].sql).toContain('EXTRACT(YEAR')
      expect(attrs[0].sql).toContain('"deliveries"."completed"')
      expect(attrs[0].sql).toContain('"deliveries"."requested"')
      expect(attrs[0].sql).toContain('as "receivedYear"')
    })

    test('omits receivedYear when includeYear is false', () => {
      const attrs = buildQueryAttributes(false, false)
      expect(attrs.some(attr => attr.sql.includes('as "receivedYear"'))).toBe(false)
    })

    test('includes receivedMonth with COALESCE when includeMonth is true', () => {
      const attrs = buildQueryAttributes(true, true)
      expect(attrs[1].sql).toContain('COALESCE')
      expect(attrs[1].sql).toContain('EXTRACT(MONTH')
      expect(attrs[1].sql).toContain('"deliveries"."completed"')
      expect(attrs[1].sql).toContain('"deliveries"."requested"')
      expect(attrs[1].sql).toContain('as "receivedMonth"')
    })

    test('omits receivedMonth when includeMonth is false', () => {
      const attrs = buildQueryAttributes(false, true)
      expect(attrs.some(attr => attr.sql.includes('as "receivedMonth"'))).toBe(false)
    })

    test('totalStatements counts distinct deliveries not failed', () => {
      const attrs = buildQueryAttributes(false, true)
      const totalStmt = attrs[1]

      expect(totalStmt.sql).toContain('COUNT(DISTINCT')
      expect(totalStmt.sql).toContain('"deliveries"."deliveryId"')
      expect(totalStmt.sql).toContain('CASE WHEN')
      expect(totalStmt.sql).toContain('"failures"."failureId" IS NULL')
      expect(totalStmt.sql).toContain('as "totalStatements"')
    })

    test('totalStatements includes both completed and letter conditions', () => {
      const attrs = buildQueryAttributes(false, true)
      const totalStmt = attrs[1]

      expect(totalStmt.sql).toContain('OR')
      expect(totalStmt.sql).toContain('"deliveries"."completed" IS NOT NULL')
      expect(totalStmt.sql).toContain(`"deliveries"."method" = '${METHOD_LETTER}'`)
    })

    test('printPostCount counts letters only without completed requirement', () => {
      const attrs = buildQueryAttributes(false, true)
      const printPost = attrs[2]

      expect(printPost.sql).toContain('COUNT(CASE')
      expect(printPost.sql).toContain(`"deliveries"."method" = '${METHOD_LETTER}'`)
      expect(printPost.sql).toContain('"failures"."failureId" IS NULL')
      expect(printPost.sql).not.toContain('"deliveries"."completed" IS NOT NULL')
      expect(printPost.sql).toContain('as "printPostCount"')
    })

    test('printPostCost applies 2026 pricing for recent dates', () => {
      const attrs = buildQueryAttributes(false, true)
      const cost = attrs[3]

      expect(cost.sql).toContain('SUM(')
      expect(cost.sql).toContain(`WHEN "deliveries"."method" = '${METHOD_LETTER}'`)
      expect(cost.sql).toContain('COALESCE')
      expect(cost.sql).toContain('"deliveries"."completed", "deliveries"."requested"')
      expect(cost.sql).toContain(`>= '${PRINT_POST_PRICING_START_2026}'`)
      expect(cost.sql).toContain(`THEN ${PRINT_POST_UNIT_COST_2026}`)
    })

    test('printPostCost applies 2024 pricing for dates after start', () => {
      const attrs = buildQueryAttributes(false, true)
      const cost = attrs[3]

      expect(cost.sql).toContain('COALESCE')
      expect(cost.sql).toContain('"deliveries"."completed", "deliveries"."requested"')
      expect(cost.sql).toContain(`>= '${PRINT_POST_PRICING_START_2024}'`)
      expect(cost.sql).toContain(`THEN ${PRINT_POST_UNIT_COST_2024}`)
    })

    test('printPostCost applies default pricing for older dates', () => {
      const attrs = buildQueryAttributes(false, true)
      const cost = attrs[3]

      expect(cost.sql).toContain(`WHEN "deliveries"."method" = '${METHOD_LETTER}'`)
      expect(cost.sql).toContain('"failures"."failureId" IS NULL')
      expect(cost.sql).toContain(`THEN ${DEFAULT_PRINT_POST_UNIT_COST}`)
    })

    test('printPostCost excludes failed deliveries', () => {
      const attrs = buildQueryAttributes(false, true)
      expect(attrs[3].sql).toContain('"failures"."failureId" IS NULL')
    })

    test('emailCount requires completed timestamp and not failed', () => {
      const attrs = buildQueryAttributes(false, true)
      const email = attrs[4]

      expect(email.sql).toContain('COUNT(CASE')
      expect(email.sql).toContain(`"deliveries"."method" = '${METHOD_EMAIL}'`)
      expect(email.sql).toContain('"deliveries"."completed" IS NOT NULL')
      expect(email.sql).toContain('"failures"."failureId" IS NULL')
      expect(email.sql).toContain('as "emailCount"')
    })

    test('maintains correct attribute order', () => {
      const attrs = buildQueryAttributes(true, true)

      expect(attrs[0].sql).toContain('as "receivedYear"')
      expect(attrs[1].sql).toContain('as "receivedMonth"')
      expect(attrs[2].sql).toContain('as "totalStatements"')
      expect(attrs[3].sql).toContain('as "printPostCount"')
      expect(attrs[4].sql).toContain('as "printPostCost"')
      expect(attrs[5].sql).toContain('as "emailCount"')
    })
  })

  describe('fetchMetricsData', () => {
    const noopWhere = () => {}

    test('joins statements and failures and groups by schemeName + schemeYear for PERIOD_ALL', async () => {
      await fetchMetricsData(noopWhere, false, null, null, PERIOD_ALL)

      expect(mockDb.tables.delivery).toHaveBeenCalledWith()
      expect(mockDb.builder.innerJoin).toHaveBeenCalledWith('statements', 'statements.statementId', 'deliveries.statementId')
      expect(mockDb.builder.leftJoin).toHaveBeenCalledWith('failures', 'failures.deliveryId', 'deliveries.deliveryId')
      expect(mockDb.builder.groupByRaw).toHaveBeenCalledWith('statements."schemeName", statements."schemeYear"')
    })

    test('groups by receivedYear + schemeName for PERIOD_YEAR', async () => {
      await fetchMetricsData(noopWhere, false, null, null, PERIOD_YEAR)

      const groupArg = mockDb.builder.groupByRaw.mock.calls[0][0]
      expect(groupArg.startsWith('COALESCE(EXTRACT(YEAR')).toBe(true)
      expect(groupArg.endsWith('statements."schemeName"')).toBe(true)
      expect(groupArg).not.toContain('EXTRACT(MONTH')
      expect(groupArg).not.toContain('schemeYear')
    })

    test('groups by receivedMonth + receivedYear + schemeName for PERIOD_MONTH_IN_YEAR', async () => {
      await fetchMetricsData(noopWhere, true, 2024, 6, PERIOD_MONTH_IN_YEAR)

      const groupArg = mockDb.builder.groupByRaw.mock.calls[0][0]
      expect(groupArg.startsWith('COALESCE(EXTRACT(MONTH')).toBe(true)
      expect(groupArg).toContain('COALESCE(EXTRACT(YEAR')
      expect(groupArg.endsWith('statements."schemeName"')).toBe(true)
      expect(groupArg.indexOf('EXTRACT(MONTH')).toBeLessThan(groupArg.indexOf('EXTRACT(YEAR'))
      expect(groupArg.indexOf('EXTRACT(YEAR')).toBeLessThan(groupArg.indexOf('statements."schemeName"'))
    })

    test.each([PERIOD_YTD, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY])('groups by receivedYear + schemeName for %s', async (period) => {
      await fetchMetricsData(noopWhere, false, null, null, period)

      const groupArg = mockDb.builder.groupByRaw.mock.calls[0][0]
      expect(groupArg.startsWith('COALESCE(EXTRACT(YEAR')).toBe(true)
      expect(groupArg.endsWith('statements."schemeName"')).toBe(true)
      expect(groupArg).not.toContain('EXTRACT(MONTH')
    })

    test('filters by schemeYear when useSchemeYear is true and schemeYear provided', async () => {
      await fetchMetricsData(noopWhere, true, 2024, null, PERIOD_YEAR)

      expect(mockDb.builder.andWhere).toHaveBeenCalledWith('statements.schemeYear', '2024')
    })

    test('does not filter by schemeYear when useSchemeYear is false', async () => {
      await fetchMetricsData(noopWhere, false, null, null, PERIOD_YEAR)

      expect(mockDb.builder.andWhere).not.toHaveBeenCalled()
    })

    test('selects the schemeYear alias only for PERIOD_ALL (scheme-based)', async () => {
      await fetchMetricsData(noopWhere, false, null, null, PERIOD_ALL)

      expect(mockDb.knex.raw).toHaveBeenCalledWith('statements."schemeYear" as "statement.schemeYear"')
    })

    test('omits the schemeYear alias for non-PERIOD_ALL periods', async () => {
      await fetchMetricsData(noopWhere, false, null, null, PERIOD_YEAR)

      expect(mockDb.knex.raw).not.toHaveBeenCalledWith('statements."schemeYear" as "statement.schemeYear"')
    })

    test('applies the supplied where-clause modifier', async () => {
      const whereModifier = jest.fn()

      await fetchMetricsData(whereModifier, false, null, null, PERIOD_YEAR)

      expect(whereModifier).toHaveBeenCalledWith(mockDb.builder)
    })

    test('returns the query results', async () => {
      const mockResults = [{ schemeName: 'SFI', totalStatements: 10 }]
      mockDb.builder.resolves(mockResults)

      const result = await fetchMetricsData(noopWhere, false, null, null, PERIOD_YEAR)

      expect(result).toBe(mockResults)
    })

    test('propagates errors from the query', async () => {
      const error = new Error('Database error')
      mockDb.builder.rejects(error)

      await expect(fetchMetricsData(noopWhere, false, null, null, PERIOD_YEAR)).rejects.toEqual(error)
    })

    test('returns an empty array when no results are found', async () => {
      mockDb.builder.resolves([])

      const result = await fetchMetricsData(noopWhere, false, null, null, PERIOD_YEAR)

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
