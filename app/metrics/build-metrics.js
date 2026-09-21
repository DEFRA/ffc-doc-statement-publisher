const db = require('../data')
const { delivery } = db
const {
  PRINT_POST_UNIT_COST_2024,
  PRINT_POST_UNIT_COST_2026,
  DEFAULT_PRINT_POST_UNIT_COST,
  PRINT_POST_PRICING_START_2024,
  PRINT_POST_PRICING_START_2026
} = require('../constants/print-post-pricing')

const {
  PERIOD_ALL,
  PERIOD_YEAR,
  PERIOD_MONTH_IN_YEAR
} = require('../constants/periods')

const { METHOD_LETTER, METHOD_EMAIL } = require('../constants/delivery-methods')

const MONTH_GROUP_EXPRESSION = 'COALESCE(EXTRACT(MONTH FROM "deliveries"."completed"), EXTRACT(MONTH FROM "deliveries"."requested"))'
const YEAR_GROUP_EXPRESSION = 'COALESCE(EXTRACT(YEAR FROM "deliveries"."completed"), EXTRACT(YEAR FROM "deliveries"."requested"))'

// Joined tables are referenced by their real table names rather than the former
// ORM model-name aliases ("delivery"/"statement"/"failure"); the "statement."
// prefixed output keys below are kept so create-save-metrics.js's result readers
// (`result['statement.schemeName']` etc) do not need to change.
const buildWhereClauseForDateRange = (period, startDate, endDate, useSchemeYear) => {
  if (useSchemeYear || !startDate || !endDate) {
    return () => {}
  }

  const upperBoundOperator = (period === PERIOD_YEAR || period === PERIOD_MONTH_IN_YEAR) ? '<=' : '<'

  return (query) => {
    query.where(function () {
      this.where('deliveries.completed', '>=', startDate)
        .andWhere('deliveries.completed', upperBoundOperator, endDate)
        .orWhere(function () {
          this.where('deliveries.method', METHOD_LETTER)
            .andWhere('deliveries.requested', '>=', startDate)
            .andWhere('deliveries.requested', upperBoundOperator, endDate)
        })
    })
  }
}

const buildStatementInclude = (useSchemeYear, schemeYear, includeSchemeYearInSelect = true) => (query) => {
  query
    .innerJoin('statements', 'statements.statementId', 'deliveries.statementId')
    .select(db.client.raw('statements."schemeName" as "statement.schemeName"'))

  if (includeSchemeYearInSelect) {
    query.select(db.client.raw('statements."schemeYear" as "statement.schemeYear"'))
  }

  if (useSchemeYear && schemeYear) {
    query.andWhere('statements.schemeYear', String(schemeYear))
  }
}

const buildFailureInclude = () => (query) => {
  query.leftJoin('failures', 'failures.deliveryId', 'deliveries.deliveryId')
}

const buildQueryAttributes = (includeMonth = false, includeYear = true) => {
  const attributes = []

  if (includeYear) {
    attributes.push(db.client.raw(`${YEAR_GROUP_EXPRESSION} as "receivedYear"`))
  }

  if (includeMonth) {
    attributes.push(db.client.raw(`${MONTH_GROUP_EXPRESSION} as "receivedMonth"`))
  }

  attributes.push(
    db.client.raw(`COUNT(DISTINCT CASE WHEN ("deliveries"."completed" IS NOT NULL OR "deliveries"."method" = '${METHOD_LETTER}') AND "failures"."failureId" IS NULL THEN "deliveries"."deliveryId" END) as "totalStatements"`),
    db.client.raw(`COUNT(CASE WHEN "deliveries"."method" = '${METHOD_LETTER}' AND "failures"."failureId" IS NULL THEN 1 END) as "printPostCount"`),
    db.client.raw(`SUM(
      CASE
        WHEN "deliveries"."method" = '${METHOD_LETTER}' AND "failures"."failureId" IS NULL AND COALESCE("deliveries"."completed", "deliveries"."requested") >= '${PRINT_POST_PRICING_START_2026}' THEN ${PRINT_POST_UNIT_COST_2026}
        WHEN "deliveries"."method" = '${METHOD_LETTER}' AND "failures"."failureId" IS NULL AND COALESCE("deliveries"."completed", "deliveries"."requested") >= '${PRINT_POST_PRICING_START_2024}' THEN ${PRINT_POST_UNIT_COST_2024}
        WHEN "deliveries"."method" = '${METHOD_LETTER}' AND "failures"."failureId" IS NULL THEN ${DEFAULT_PRINT_POST_UNIT_COST}
        ELSE 0
      END
    ) as "printPostCost"`),
    db.client.raw(`COUNT(CASE WHEN "deliveries"."method" = '${METHOD_EMAIL}' AND "deliveries"."completed" IS NOT NULL AND "failures"."failureId" IS NULL THEN 1 END) as "emailCount"`)
  )

  return attributes
}

const fetchMetricsData = async (whereClause, useSchemeYear, schemeYear, _month, period) => {
  const isSchemeBased = period === PERIOD_ALL
  const shouldGroupByMonth = period === PERIOD_MONTH_IN_YEAR
  const shouldIncludeYear = !isSchemeBased

  const groupFields = ['statements."schemeName"']

  if (!isSchemeBased) {
    groupFields.unshift(YEAR_GROUP_EXPRESSION)
    if (shouldGroupByMonth) {
      groupFields.unshift(MONTH_GROUP_EXPRESSION)
    }
  }

  if (isSchemeBased) {
    groupFields.push('statements."schemeYear"')
  }

  return delivery()
    .modify(buildStatementInclude(useSchemeYear, schemeYear, isSchemeBased))
    .modify(buildFailureInclude())
    .select(buildQueryAttributes(shouldGroupByMonth, shouldIncludeYear))
    .modify(whereClause)
    .groupByRaw(groupFields.join(', '))
}

module.exports = {
  buildWhereClauseForDateRange,
  buildStatementInclude,
  buildFailureInclude,
  buildQueryAttributes,
  fetchMetricsData
}
