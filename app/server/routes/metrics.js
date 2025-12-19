const db = require('../../data')
const { calculateMetricsForPeriod } = require('../../metrics-calculator')

const validatePeriod = (period) => {
  const validPeriods = ['all', 'ytd', 'year', 'monthInYear', 'month', 'week', 'day']
  if (!validPeriods.includes(period)) {
    return {
      error: 'Invalid period type',
      message: `Period must be one of: ${validPeriods.join(', ')}`
    }
  }
  return null
}

const validateMonthInYearParams = (schemeYear, month) => {
  if (!schemeYear || !month) {
    return {
      error: 'Missing required parameters',
      message: 'schemeYear and month are required for monthInYear period'
    }
  }

  if (month < 1 || month > 12) {
    return {
      error: 'Invalid month',
      message: 'Month must be between 1 and 12'
    }
  }

  const currentYear = new Date().getFullYear()
  if (schemeYear < 2000 || schemeYear > currentYear + 10) {
    return {
      error: 'Invalid schemeYear',
      message: `schemeYear must be between 2000 and ${currentYear + 10}`
    }
  }

  return null
}

const validateYearParams = (period, schemeYear) => {
  if (period === 'year' && !schemeYear) {
    return {
      error: 'Missing required parameter',
      message: 'schemeYear is required for year period'
    }
  }
  return null
}

module.exports = [{
  method: 'GET',
  path: '/metrics',
  handler: async (request, h) => {
    try {
      const period = request.query.period || 'all'
      const schemeYear = request.query.schemeYear ? Number.parseInt(request.query.schemeYear) : null
      const month = request.query.month ? Number.parseInt(request.query.month) : null

      let validationError = validatePeriod(period)
      if (validationError) {
        return h.response(validationError).code(400)
      }

      if (period === 'monthInYear') {
        validationError = validateMonthInYearParams(schemeYear, month)
        if (validationError) {
          return h.response(validationError).code(400)
        }

        try {
          await calculateMetricsForPeriod('monthInYear', schemeYear, month)
        } catch (calcError) {
          console.error('Error calculating monthInYear metrics:', calcError)
          return h.response({
            error: 'Metrics calculation failed',
            message: calcError.message
          }).code(500)
        }
      }

      validationError = validateYearParams(period, schemeYear)
      if (validationError) {
        return h.response(validationError).code(400)
      }

      const snapshotDate = new Date().toISOString().split('T')[0]

      const whereClause = {
        snapshotDate,
        periodType: period
      }

      if (schemeYear) {
        whereClause.schemeYear = schemeYear
      }

      const metrics = await db.metric.findAll({
        where: whereClause,
        order: [['schemeName', 'ASC']]
      })

      const schemeMetrics = metrics.filter(m => m.schemeName !== null)
      const totals = schemeMetrics.reduce((acc, m) => ({
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

      return h.response({
        payload: {
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
      }).code(200)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      return h.response({
        error: 'Internal server error',
        message: 'An error occurred while fetching metrics'
      }).code(500)
    }
  }
}]
