const { getDateRangeForAll, getDateRangeForYTD, getDateRangeForYear, getDateRangeForMonthInYear, getDateRangeForRelativePeriod } = require('./get-metrics-data')
const { buildWhereClauseForDateRange, fetchMetricsData } = require('./build-metrics')
const { saveMetrics } = require('./create-save-metrics')
const { DAYS_PER_WEEK, DAYS_PER_MONTH } = require('../constants/time')

const {
  PERIOD_ALL,
  PERIOD_YTD,
  PERIOD_YEAR,
  PERIOD_MONTH_IN_YEAR,
  PERIOD_MONTH,
  PERIOD_WEEK,
  PERIOD_DAY
} = require('../constants/periods')

const { MONTHS_PER_YEAR } = require('../constants/date')

const DEFAULT_YEARS_TO_CALCULATE = 3

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

const calculateMetricsForPeriod = async (period, schemeYear = null, month = null) => {
  const { startDate, endDate, useSchemeYear } = calculateDateRange(period, schemeYear, month)
  const snapshotDate = new Date().toISOString().split('T')[0]

  const whereClause = buildWhereClauseForDateRange(period, startDate, endDate, useSchemeYear)
  const results = await fetchMetricsData(whereClause, useSchemeYear, schemeYear, month, period)

  const counts = await saveMetrics(results, period, snapshotDate, startDate, endDate)
  return counts
}

const calculateYearlyMetrics = async (year) => {
  let totalInserted = 0
  let totalUpdated = 0

  const yearCounts = await calculateMetricsForPeriod(PERIOD_YEAR, year)
  totalInserted += yearCounts.inserted
  totalUpdated += yearCounts.updated

  for (let month = 1; month <= MONTHS_PER_YEAR; month++) {
    const monthCounts = await calculateMetricsForPeriod(PERIOD_MONTH_IN_YEAR, year, month)
    totalInserted += monthCounts.inserted
    totalUpdated += monthCounts.updated
  }

  return { inserted: totalInserted, updated: totalUpdated }
}

const calculateHistoricalMetrics = async (currentYear, yearsToCalculate) => {
  let totalInserted = 0
  let totalUpdated = 0

  for (let i = 0; i <= yearsToCalculate; i++) {
    const year = currentYear - i
    const counts = await calculateYearlyMetrics(year)
    totalInserted += counts.inserted
    totalUpdated += counts.updated
  }

  return { inserted: totalInserted, updated: totalUpdated }
}

const calculateAllMetrics = async () => {
  console.log('Starting metrics calculation...')

  const currentYear = new Date().getFullYear()
  const yearsToCalculate = Number.parseInt(process.env.METRICS_CALCULATION_YEARS || String(DEFAULT_YEARS_TO_CALCULATE))

  try {
    let totalInserted = 0
    let totalUpdated = 0

    const allCounts = await calculateMetricsForPeriod(PERIOD_ALL)
    totalInserted += allCounts.inserted
    totalUpdated += allCounts.updated

    const historicalCounts = await calculateHistoricalMetrics(currentYear, yearsToCalculate)
    totalInserted += historicalCounts.inserted
    totalUpdated += historicalCounts.updated

    console.log(`✓ Metrics calculated: ${totalInserted} created, ${totalUpdated} updated`)
  } catch (error) {
    console.error('✗ Error calculating metrics:', error)
    throw error
  }
}

module.exports = {
  calculateDateRange,
  calculateAllMetrics,
  calculateMetricsForPeriod,
  calculateYearlyMetrics,
  calculateHistoricalMetrics
}
