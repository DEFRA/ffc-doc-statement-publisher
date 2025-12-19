const { Op } = require('sequelize')
const db = require('./data')
const { PRINT_POST_UNIT_COST_2024, PRINT_POST_UNIT_COST_2026, DEFAULT_PRINT_POST_UNIT_COST } = require('./constants/print-post-pricing')

const calculateDateRange = (period, schemeYear = null, month = null) => {
  const now = new Date()

  switch (period) {
    case 'all':
      return {
        startDate: null,
        endDate: null,
        useSchemeYear: false
      }
    case 'ytd':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now,
        useSchemeYear: false
      }
    case 'year':
      return {
        startDate: null,
        endDate: null,
        useSchemeYear: true
      }
    case 'monthInYear':
      if (!schemeYear || !month) {
        throw new Error('schemeYear and month are required for monthInYear period')
      }
      return {
        startDate: new Date(schemeYear, month - 1, 1),
        endDate: new Date(schemeYear, month, 0, 23, 59, 59, 999),
        useSchemeYear: true
      }
    case 'month':
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now,
        useSchemeYear: false
      }
    case 'week':
      return {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now,
        useSchemeYear: false
      }
    case 'day':
      return {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endDate: now,
        useSchemeYear: false
      }
    default:
      throw new Error(`Unknown period type: ${period}`)
  }
}

const calculateMetricsForPeriod = async (period, schemeYear = null, month = null) => {
  const { startDate, endDate, useSchemeYear } = calculateDateRange(period, schemeYear, month)
  const snapshotDate = new Date().toISOString().split('T')[0]

  const whereClause = {}

  if (!useSchemeYear && startDate && endDate) {
    whereClause.completed = {
      [Op.gte]: startDate,
      [Op.lt]: endDate
    }
  }

  if (period === 'monthInYear' && startDate && endDate) {
    whereClause.completed = {
      [Op.gte]: startDate,
      [Op.lte]: endDate
    }
  }

  const results = await db.delivery.findAll({
    attributes: [
      [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('delivery.deliveryId'))), 'totalStatements'],
      [db.sequelize.literal('COUNT(CASE WHEN "delivery"."method" = \'letter\' THEN 1 END)'), 'printPostCount'],
      [db.sequelize.literal(`SUM(
        CASE 
          WHEN "delivery"."method" = 'letter' AND "delivery"."completed" >= '2026-01-05' THEN ${PRINT_POST_UNIT_COST_2026}
          WHEN "delivery"."method" = 'letter' AND "delivery"."completed" >= '2024-04-01' THEN ${PRINT_POST_UNIT_COST_2024}
          WHEN "delivery"."method" = 'letter' THEN ${DEFAULT_PRINT_POST_UNIT_COST}
          ELSE 0 
        END
      )`), 'printPostCost'],
      [db.sequelize.literal('COUNT(CASE WHEN "delivery"."method" = \'email\' THEN 1 END)'), 'emailCount'],
      [db.sequelize.fn('COUNT', db.sequelize.col('failure.failureId')), 'failureCount']
    ],
    include: [
      {
        model: db.statement,
        as: 'statement',
        attributes: ['schemeName', 'schemeYear'],
        required: true,
        where: useSchemeYear && schemeYear ? { schemeYear: String(schemeYear) } : {}
      },
      {
        model: db.failure,
        as: 'failure',
        attributes: [],
        required: false
      }
    ],
    where: whereClause,
    group: ['statement.schemeName', 'statement.schemeYear'],
    raw: true
  })

  for (const result of results) {
    const resultSchemeYear = result['statement.schemeYear'] ? Number.parseInt(result['statement.schemeYear']) : null

    await db.metric.upsert({
      snapshotDate,
      periodType: period,
      schemeName: result['statement.schemeName'],
      schemeYear: resultSchemeYear,
      totalStatements: Number.parseInt(result.totalStatements),
      printPostCount: Number.parseInt(result.printPostCount),
      printPostCost: Number.parseInt(result.printPostCost),
      printPostUnitCost: DEFAULT_PRINT_POST_UNIT_COST,
      emailCount: Number.parseInt(result.emailCount),
      failureCount: Number.parseInt(result.failureCount),
      dataStartDate: startDate,
      dataEndDate: endDate
    })
  }
}

const calculateAllMetrics = async () => {
  console.log('Starting metrics calculation...')

  const currentYear = new Date().getFullYear()
  const yearsToCalculate = Number.parseInt(process.env.METRICS_CALCULATION_YEARS || '3')
  const periods = ['all', 'ytd', 'month', 'week', 'day']

  try {
    for (const period of periods) {
      await calculateMetricsForPeriod(period)
    }

    for (let i = 0; i <= yearsToCalculate; i++) {
      const year = currentYear - i
      await calculateMetricsForPeriod('year', year)

      for (let month = 1; month <= 12; month++) {
        await calculateMetricsForPeriod('monthInYear', year, month)
      }
    }

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
