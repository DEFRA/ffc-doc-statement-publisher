const { Op } = require('sequelize')
const db = require('./data')
const {
  PRINT_POST_UNIT_COST_2024,
  PRINT_POST_UNIT_COST_2026,
  DEFAULT_PRINT_POST_UNIT_COST,
  PRINT_POST_PRICING_START_2024,
  PRINT_POST_PRICING_START_2026
} = require('./constants/print-post-pricing')
const { MILLISECONDS_PER_DAY, DAYS_PER_WEEK, DAYS_PER_MONTH } = require('./constants/time')
const {
  FIRST_DAY_OF_MONTH,
  YEAR_START_MONTH,
  END_OF_DAY_HOUR,
  END_OF_DAY_MINUTE,
  END_OF_DAY_SECOND,
  END_OF_DAY_MILLISECOND,
  MONTH_INDEX_OFFSET,
  MONTHS_PER_YEAR
} = require('./constants/date')
const {
  PERIOD_ALL,
  PERIOD_YTD,
  PERIOD_YEAR,
  PERIOD_MONTH_IN_YEAR,
  PERIOD_MONTH,
  PERIOD_WEEK,
  PERIOD_DAY
} = require('./constants/periods')
const { METHOD_LETTER, METHOD_EMAIL } = require('./constants/delivery-methods')

const DEFAULT_YEARS_TO_CALCULATE = 3

const getDateRangeForAll = () => ({
  startDate: null,
  endDate: null,
  useSchemeYear: false
})

const getDateRangeForYTD = (now) => ({
  startDate: new Date(now.getFullYear(), YEAR_START_MONTH, FIRST_DAY_OF_MONTH),
  endDate: now,
  useSchemeYear: false
})

const getDateRangeForYear = (schemeYear) => ({
  startDate: new Date(schemeYear, 0, FIRST_DAY_OF_MONTH),
  endDate: new Date(schemeYear, 11, 31, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MILLISECOND),
  useSchemeYear: false
})

const getDateRangeForMonthInYear = (schemeYear, month) => {
  if (!schemeYear || !month) {
    throw new Error('schemeYear and month are required for monthInYear period')
  }
  return {
    startDate: new Date(schemeYear, month - MONTH_INDEX_OFFSET, FIRST_DAY_OF_MONTH),
    endDate: new Date(schemeYear, month, 0, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MILLISECOND),
    useSchemeYear: true
  }
}

const getDateRangeForRelativePeriod = (now, days) => ({
  startDate: new Date(now.getTime() - days * MILLISECONDS_PER_DAY),
  endDate: now,
  useSchemeYear: false
})

const calculateDateRange = (period, schemeYear = null, month = null) => {
  const now = new Date()

  switch (period) {
    case PERIOD_ALL:
      return getDateRangeForAll()
    case PERIOD_YTD:
      return getDateRangeForYTD(now)
    case PERIOD_YEAR:
      return getDateRangeForYear(schemeYear)
    case PERIOD_MONTH_IN_YEAR:
      return getDateRangeForMonthInYear(schemeYear, month)
    case PERIOD_MONTH:
      return getDateRangeForRelativePeriod(now, DAYS_PER_MONTH)
    case PERIOD_WEEK:
      return getDateRangeForRelativePeriod(now, DAYS_PER_WEEK)
    case PERIOD_DAY:
      return getDateRangeForRelativePeriod(now, 1)
    default:
      throw new Error(`Unknown period type: ${period}`)
  }
}

const buildWhereClauseForDateRange = (period, startDate, endDate, useSchemeYear) => {
  const whereClause = {}

  if (!useSchemeYear && startDate && endDate) {
    const op = (period === PERIOD_YEAR || period === PERIOD_MONTH_IN_YEAR) ? Op.lte : Op.lt
    whereClause.completed = {
      [Op.gte]: startDate,
      [op]: endDate
    }
  }

  if (period === PERIOD_MONTH_IN_YEAR && startDate && endDate) {
    whereClause.completed = {
      [Op.gte]: startDate,
      [Op.lte]: endDate
    }
  }

  return whereClause
}

const buildStatementInclude = (useSchemeYear, schemeYear) => ({
  model: db.statement,
  as: 'statement',
  attributes: ['schemeName', 'schemeYear'],
  required: true,
  where: useSchemeYear && schemeYear ? { schemeYear: String(schemeYear) } : {}
})

const buildFailureInclude = () => ({
  model: db.failure,
  as: 'failure',
  attributes: [],
  required: false
})

const buildQueryAttributes = () => [
  [db.sequelize.literal('EXTRACT(YEAR FROM "delivery"."completed")'), 'receivedYear'],
  [db.sequelize.literal('EXTRACT(MONTH FROM "delivery"."completed")'), 'receivedMonth'],
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
  [db.sequelize.literal(`COUNT(CASE WHEN "delivery"."method" = '${METHOD_EMAIL}' AND "delivery"."completed" IS NOT NULL AND "failure"."failureId" IS NULL THEN 1 END)`), 'emailCount'],
  [db.sequelize.fn('COUNT', db.sequelize.col('failure.failureId')), 'failureCount']
]

const fetchMetricsData = async (whereClause, useSchemeYear, schemeYear, month) => {
  const groupFields = [
    db.sequelize.literal('EXTRACT(YEAR FROM "delivery"."completed")'),
    db.sequelize.literal('EXTRACT(MONTH FROM "delivery"."completed")'),
    db.sequelize.literal('statement."schemeName"'),
    db.sequelize.literal('statement."schemeYear"')
  ]
  return db.delivery.findAll({
    attributes: buildQueryAttributes(),
    include: [
      buildStatementInclude(useSchemeYear, schemeYear),
      buildFailureInclude()
    ],
    where: whereClause,
    group: groupFields,
    raw: true
  })
}

const createMetricRecord = (result, period, snapshotDate, startDate, endDate) => {
  const receivedMonth = result.receivedMonth ? Number.parseInt(result.receivedMonth) : null

  let monthValue = null
  if (period === PERIOD_MONTH_IN_YEAR) {
    monthValue = receivedMonth
  }

  let schemeYearValue = result['statement.schemeYear']
  if (period === PERIOD_YEAR) {
    schemeYearValue = result.receivedYear
  }

  return {
    snapshotDate,
    periodType: period,
    schemeName: result['statement.schemeName'],
    schemeYear: schemeYearValue,
    monthInYear: monthValue,
    totalStatements: Number.parseInt(result.totalStatements),
    printPostCount: Number.parseInt(result.printPostCount),
    printPostCost: Number.parseInt(result.printPostCost),
    printPostUnitCost: DEFAULT_PRINT_POST_UNIT_COST,
    emailCount: Number.parseInt(result.emailCount),
    failureCount: Number.parseInt(result.failureCount),
    dataStartDate: startDate,
    dataEndDate: endDate
  }
}

const saveMetrics = async (results, period, snapshotDate, startDate, endDate) => {
  for (const result of results) {
    const metricRecord = createMetricRecord(result, period, snapshotDate, startDate, endDate)

    const existing = await db.metric.findOne({
      where: {
        snapshotDate: metricRecord.snapshotDate,
        periodType: metricRecord.periodType,
        schemeName: metricRecord.schemeName,
        schemeYear: metricRecord.schemeYear,
        monthInYear: metricRecord.monthInYear
      }
    })

    if (existing) {
      await db.metric.update(metricRecord, {
        where: { id: existing.id }
      })
    } else {
      await db.metric.create(metricRecord)
    }
  }
}

const calculateMetricsForPeriod = async (period, schemeYear = null, month = null) => {
  const { startDate, endDate, useSchemeYear } = calculateDateRange(period, schemeYear, month)
  const snapshotDate = new Date().toISOString().split('T')[0]

  const whereClause = buildWhereClauseForDateRange(period, startDate, endDate, useSchemeYear)
  const results = await fetchMetricsData(whereClause, useSchemeYear, schemeYear, month)
  await saveMetrics(results, period, snapshotDate, startDate, endDate)
}

const calculateYearlyMetrics = async (year) => {
  await calculateMetricsForPeriod(PERIOD_YEAR, year)

  for (let month = 1; month <= MONTHS_PER_YEAR; month++) {
    await calculateMetricsForPeriod(PERIOD_MONTH_IN_YEAR, year, month)
  }
}

const calculateHistoricalMetrics = async (currentYear, yearsToCalculate) => {
  for (let i = 0; i <= yearsToCalculate; i++) {
    const year = currentYear - i
    await calculateYearlyMetrics(year)
  }
}

const calculateAllMetrics = async () => {
  console.log('Starting metrics calculation...')

  const currentYear = new Date().getFullYear()
  const yearsToCalculate = Number.parseInt(process.env.METRICS_CALCULATION_YEARS || String(DEFAULT_YEARS_TO_CALCULATE))

  try {
    await calculateHistoricalMetrics(currentYear, yearsToCalculate)
    console.log('✓ All metrics calculated successfully')
  } catch (error) {
    console.error('✗ Error calculating metrics:', error)
    throw error
  }
}

module.exports = {
  calculateAllMetrics,
  calculateMetricsForPeriod
}
