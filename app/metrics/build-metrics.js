const db = require('../database')
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
const { delivery: DELIVERIES, statement: STATEMENTS, failure: FAILURES } = require('../constants/tables')

const MONTH_GROUP_EXPRESSION = `COALESCE(EXTRACT(MONTH FROM "${DELIVERIES}"."completed"), EXTRACT(MONTH FROM "${DELIVERIES}"."requested"))`
const YEAR_GROUP_EXPRESSION = `COALESCE(EXTRACT(YEAR FROM "${DELIVERIES}"."completed"), EXTRACT(YEAR FROM "${DELIVERIES}"."requested"))`

// Joined tables are referenced by their real table names (via constants/tables.js)
// rather than the former ORM model-name aliases ("delivery"/"statement"/"failure");
// the "statement." prefixed output keys below are kept so create-save-metrics.js's
// result readers (`result['statement.schemeName']` etc) do not need to change.
const buildWhereClauseForDateRange = (period, startDate, endDate, useSchemeYear) => {
  if (useSchemeYear || !startDate || !endDate) {
    return () => {}
  }

  const upperBoundOperator = (period === PERIOD_YEAR || period === PERIOD_MONTH_IN_YEAR) ? '<=' : '<'

  return (query) => {
    query.where(function () {
      this.where(`${DELIVERIES}.completed`, '>=', startDate)
        .andWhere(`${DELIVERIES}.completed`, upperBoundOperator, endDate)
        .orWhere(function () {
          this.where(`${DELIVERIES}.method`, METHOD_LETTER)
            .andWhere(`${DELIVERIES}.requested`, '>=', startDate)
            .andWhere(`${DELIVERIES}.requested`, upperBoundOperator, endDate)
        })
    })
  }
}

const buildStatementInclude = (useSchemeYear, schemeYear, includeSchemeYearInSelect = true) => (query) => {
  query
    .innerJoin(STATEMENTS, `${STATEMENTS}.statementId`, `${DELIVERIES}.statementId`)
    .select(db.client.raw(`${STATEMENTS}."schemeName" as "statement.schemeName"`))

  if (includeSchemeYearInSelect) {
    query.select(db.client.raw(`${STATEMENTS}."schemeYear" as "statement.schemeYear"`))
  }

  if (useSchemeYear && schemeYear) {
    query.andWhere(`${STATEMENTS}.schemeYear`, String(schemeYear))
  }
}

const buildFailureInclude = () => (query) => {
  query.leftJoin(FAILURES, `${FAILURES}.deliveryId`, `${DELIVERIES}.deliveryId`)
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
    db.client.raw(`COUNT(DISTINCT CASE WHEN ("${DELIVERIES}"."completed" IS NOT NULL OR "${DELIVERIES}"."method" = '${METHOD_LETTER}') AND "${FAILURES}"."failureId" IS NULL THEN "${DELIVERIES}"."deliveryId" END) as "totalStatements"`),
    db.client.raw(`COUNT(CASE WHEN "${DELIVERIES}"."method" = '${METHOD_LETTER}' AND "${FAILURES}"."failureId" IS NULL THEN 1 END) as "printPostCount"`),
    db.client.raw(`SUM(
      CASE
        WHEN "${DELIVERIES}"."method" = '${METHOD_LETTER}' AND "${FAILURES}"."failureId" IS NULL AND COALESCE("${DELIVERIES}"."completed", "${DELIVERIES}"."requested") >= '${PRINT_POST_PRICING_START_2026}' THEN ${PRINT_POST_UNIT_COST_2026}
        WHEN "${DELIVERIES}"."method" = '${METHOD_LETTER}' AND "${FAILURES}"."failureId" IS NULL AND COALESCE("${DELIVERIES}"."completed", "${DELIVERIES}"."requested") >= '${PRINT_POST_PRICING_START_2024}' THEN ${PRINT_POST_UNIT_COST_2024}
        WHEN "${DELIVERIES}"."method" = '${METHOD_LETTER}' AND "${FAILURES}"."failureId" IS NULL THEN ${DEFAULT_PRINT_POST_UNIT_COST}
        ELSE 0
      END
    ) as "printPostCost"`),
    db.client.raw(`COUNT(CASE WHEN "${DELIVERIES}"."method" = '${METHOD_EMAIL}' AND "${DELIVERIES}"."completed" IS NOT NULL AND "${FAILURES}"."failureId" IS NULL THEN 1 END) as "emailCount"`)
  )

  return attributes
}

const fetchMetricsData = async (whereClause, useSchemeYear, schemeYear, _month, period) => {
  const isSchemeBased = period === PERIOD_ALL
  const shouldGroupByMonth = period === PERIOD_MONTH_IN_YEAR
  const shouldIncludeYear = !isSchemeBased

  const groupFields = [`${STATEMENTS}."schemeName"`]

  if (!isSchemeBased) {
    groupFields.unshift(YEAR_GROUP_EXPRESSION)
    if (shouldGroupByMonth) {
      groupFields.unshift(MONTH_GROUP_EXPRESSION)
    }
  }

  if (isSchemeBased) {
    groupFields.push(`${STATEMENTS}."schemeYear"`)
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
