const db = require('../../data')
const { calculateMetricsForPeriod } = require('../../metrics/metrics-calculator')
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR } = require('../../constants/statuses')

const { PERIOD_ALL, PERIOD_YTD, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY } = require('../../constants/periods')
const VALID_PERIODS = [PERIOD_ALL, PERIOD_YTD, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY]
const RELATIVE_PERIODS = new Set([PERIOD_WEEK, PERIOD_DAY, PERIOD_MONTH, PERIOD_YTD])
const MIN_YEAR = 2000
const FUTURE_YEAR_OFFSET = 10
const MIN_MONTH = 1
const MAX_MONTH = 12

const validatePeriod = (period) => {
  if (!VALID_PERIODS.includes(period)) {
    return {
      error: 'Invalid period type',
      message: `Period must be one of: ${VALID_PERIODS.join(', ')}`
    }
  }
  return null
}

const validateMonthInYearParams = (schemeYear, month) => {
  if (schemeYear == null || month == null) {
    return {
      error: 'Missing required parameters',
      message: 'schemeYear and month are required for monthInYear period'
    }
  }

  if (month < MIN_MONTH || month > MAX_MONTH) {
    return {
      error: 'Invalid month',
      message: `Month must be between ${MIN_MONTH} and ${MAX_MONTH}`
    }
  }

  const currentYear = new Date().getFullYear()
  const maxYear = currentYear + FUTURE_YEAR_OFFSET
  if (schemeYear < MIN_YEAR || schemeYear > maxYear) {
    return {
      error: 'Invalid schemeYear',
      message: `schemeYear must be between ${MIN_YEAR} and ${maxYear}`
    }
  }

  return null
}

const validateYearParams = (period, schemeYear) => {
  if (period === PERIOD_YEAR && !schemeYear) {
    return {
      error: 'Missing required parameter',
      message: 'schemeYear is required for year period'
    }
  }
  return null
}

const calculateTotals = (schemeMetrics) => {
  return schemeMetrics.reduce((acc, m) => ({
    totalStatements: acc.totalStatements + m.totalStatements,
    printPostCount: acc.printPostCount + m.printPostCount,
    printPostCost: acc.printPostCost + Number.parseInt(m.printPostCost),
    emailCount: acc.emailCount + m.emailCount,
    failureCount: acc.failureCount + m.failureCount
  }), {
    totalStatements: 0,
    printPostCount: 0,
    printPostCost: 0,
    emailCount: 0,
    failureCount: 0
  })
}

const formatMetricsResponse = (totals, schemeMetrics) => {
  return {
    totalStatements: totals?.totalStatements || 0,
    totalPrintPost: totals?.printPostCount || 0,
    totalPrintPostCost: totals?.printPostCost || 0,
    totalEmail: totals?.emailCount || 0,
    totalFailures: totals?.failureCount || 0,
    statementsByScheme: schemeMetrics.map(m => ({
      schemeName: m.schemeName,
      schemeYear: m.schemeYear,
      totalStatements: m.totalStatements,
      printPostCount: m.printPostCount,
      printPostCost: m.printPostCost,
      printPostUnitCost: m.printPostUnitCost,
      emailCount: m.emailCount,
      failureCount: m.failureCount
    }))
  }
}

const fetchMetrics = async (period, schemeYear, month) => {
  const mostRecentSnapshot = await db.metric.findOne({
    attributes: [[db.sequelize.fn('MAX', db.sequelize.col('snapshot_date')), 'maxDate']],
    where: {
      periodType: period,
      ...(schemeYear && { schemeYear }),
      ...(month && { monthInYear: month })
    },
    raw: true
  })

  if (!mostRecentSnapshot?.maxDate) {
    return []
  }

  return db.metric.findAll({
    where: {
      snapshotDate: mostRecentSnapshot.maxDate,
      periodType: period,
      ...(schemeYear && { schemeYear }),
      ...(month && { monthInYear: month })
    },
    raw: true,
    order: [['schemeName', 'ASC']]
  })
}

const processMetrics = (metrics) => {
  const schemeMetrics = metrics.filter(m => m.schemeName !== null)
  const totals = calculateTotals(schemeMetrics)
  return formatMetricsResponse(totals, schemeMetrics)
}

const isRelativePeriod = (period) => {
  return RELATIVE_PERIODS.has(period)
}

const calculateMetricsIfNeeded = async (period, schemeYear, month) => {
  if (period === PERIOD_MONTH_IN_YEAR) {
    await calculateMetricsForPeriod(PERIOD_MONTH_IN_YEAR, schemeYear, month)
  } else if (isRelativePeriod(period)) {
    await calculateMetricsForPeriod(period)
  }
}

const buildQueryParams = (period, schemeYear, month) => {
  if (isRelativePeriod(period)) {
    return { schemeYear: null, month: null }
  }
  return { schemeYear, month }
}

const validateRequest = (period, schemeYear, month) => {
  const periodError = validatePeriod(period)
  if (periodError) {
    return periodError
  }

  if (period === PERIOD_MONTH_IN_YEAR) {
    const paramsError = validateMonthInYearParams(schemeYear, month)
    if (paramsError) {
      return paramsError
    }
  }

  const yearError = validateYearParams(period, schemeYear)
  if (yearError) {
    return yearError
  }

  return null
}

const handleMetricsRequest = async (request, h) => {
  const period = request.query.period || PERIOD_ALL
  const schemeYear = request.query.schemeYear ? Number.parseInt(request.query.schemeYear) : null
  const month = request.query.month ? Number.parseInt(request.query.month) : null

  const validationError = validateRequest(period, schemeYear, month)
  if (validationError) {
    return h.response(validationError).code(HTTP_BAD_REQUEST)
  }

  try {
    await calculateMetricsIfNeeded(period, schemeYear, month)
  } catch (error) {
    return h.response({
      error: 'Metrics calculation failed',
      message: error.message
    }).code(HTTP_INTERNAL_SERVER_ERROR)
  }

  const { schemeYear: querySchemeYear, month: queryMonth } = buildQueryParams(period, schemeYear, month)
  const metrics = await fetchMetrics(period, querySchemeYear, queryMonth)
  const response = processMetrics(metrics)
  return h.response(response).code(HTTP_OK)
}

module.exports = [{
  method: 'GET',
  path: '/metrics',
  handler: async (request, h) => {
    try {
      return await handleMetricsRequest(request, h)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      return h.response({
        error: 'Internal server error',
        message: 'An error occurred while fetching metrics'
      }).code(HTTP_INTERNAL_SERVER_ERROR)
    }
  }
}]
