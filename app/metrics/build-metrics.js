const db = require('../data')
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
const extractMonthFromCompletedDelivery = db.sequelize.literal('EXTRACT(MONTH FROM "delivery"."completed")')
const extractYearFromCompletedDelivery = db.sequelize.literal('EXTRACT(YEAR FROM "delivery"."completed")')

const buildWhereClauseForDateRange = (period, startDate, endDate, useSchemeYear) => {
  const whereClause = {}

  if (!useSchemeYear && startDate && endDate) {
    const op = (period === PERIOD_YEAR || period === PERIOD_MONTH_IN_YEAR) ? db.Sequelize.Op.lte : db.Sequelize.Op.lt
    whereClause.completed = {
      [db.Sequelize.Op.gte]: startDate,
      [op]: endDate
    }
  }

  if (period === PERIOD_MONTH_IN_YEAR && startDate && endDate) {
    whereClause.completed = {
      [db.Sequelize.Op.gte]: startDate,
      [db.Sequelize.Op.lte]: endDate
    }
  }

  return whereClause
}

const buildStatementInclude = (useSchemeYear, schemeYear, includeSchemeYearInSelect = true) => ({
  model: db.statement,
  as: 'statement',
  attributes: includeSchemeYearInSelect
    ? ['schemeName', 'schemeYear']
    : ['schemeName'],
  required: true,
  where: useSchemeYear && schemeYear ? { schemeYear: String(schemeYear) } : {}
})

const buildFailureInclude = () => ({
  model: db.failure,
  as: 'failure',
  attributes: [],
  required: false
})

const buildQueryAttributes = (includeMonth = false, includeYear = true) => {
  const attributes = []

  if (includeYear) {
    attributes.push([extractYearFromCompletedDelivery, 'receivedYear'])
  }

  if (includeMonth) {
    attributes.push([extractMonthFromCompletedDelivery, 'receivedMonth'])
  }

  attributes.push(
    [db.sequelize.literal('COUNT(DISTINCT CASE WHEN "delivery"."completed" IS NOT NULL AND "failure"."failureId" IS NULL THEN "delivery"."deliveryId" END)'), 'totalStatements'],
    [db.sequelize.literal(`COUNT(CASE WHEN "delivery"."method" = '${METHOD_LETTER}' AND "delivery"."completed" IS NOT NULL AND "failure"."failureId" IS NULL THEN 1 END)`), 'printPostCount'],
    [db.sequelize.literal(`SUM(
      CASE 
        WHEN "delivery"."method" = '${METHOD_LETTER}' AND "delivery"."completed" IS NOT NULL AND "failure"."failureId" IS NULL AND "delivery"."completed" >= '${PRINT_POST_PRICING_START_2026}' THEN ${PRINT_POST_UNIT_COST_2026}
        WHEN "delivery"."method" = '${METHOD_LETTER}' AND "delivery"."completed" IS NOT NULL AND "failure"."failureId" IS NULL AND "delivery"."completed" >= '${PRINT_POST_PRICING_START_2024}' THEN ${PRINT_POST_UNIT_COST_2024}
        WHEN "delivery"."method" = '${METHOD_LETTER}' AND "delivery"."completed" IS NOT NULL AND "failure"."failureId" IS NULL THEN ${DEFAULT_PRINT_POST_UNIT_COST}
        ELSE 0 
      END
    )`), 'printPostCost'],
    [db.sequelize.literal(`COUNT(CASE WHEN "delivery"."method" = '${METHOD_EMAIL}' AND "delivery"."completed" IS NOT NULL AND "failure"."failureId" IS NULL THEN 1 END)`), 'emailCount']
  )

  return attributes
}

const fetchMetricsData = async (whereClause, useSchemeYear, schemeYear, _month, period) => {
  const isSchemeBased = period === PERIOD_ALL
  const shouldGroupByMonth = period === PERIOD_MONTH_IN_YEAR
  const shouldIncludeYear = !isSchemeBased

  const groupFields = [
    db.sequelize.literal('statement."schemeName"')
  ]

  if (!isSchemeBased) {
    groupFields.unshift(extractYearFromCompletedDelivery)
    if (shouldGroupByMonth) {
      groupFields.unshift(extractMonthFromCompletedDelivery)
    }
  }

  if (isSchemeBased) {
    groupFields.push(db.sequelize.literal('statement."schemeYear"'))
  }

  return db.delivery.findAll({
    attributes: buildQueryAttributes(shouldGroupByMonth, shouldIncludeYear),
    include: [
      buildStatementInclude(useSchemeYear, schemeYear, isSchemeBased),
      buildFailureInclude()
    ],
    where: whereClause,
    group: groupFields,
    raw: true
  })
}

module.exports = {
  buildWhereClauseForDateRange,
  buildStatementInclude,
  buildFailureInclude,
  buildQueryAttributes,
  fetchMetricsData
}
