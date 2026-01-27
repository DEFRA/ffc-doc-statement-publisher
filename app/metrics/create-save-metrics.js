const db = require('../data')
const { DEFAULT_PRINT_POST_UNIT_COST } = require('../constants/print-post-pricing')

const {
  PERIOD_YEAR,
  PERIOD_MONTH_IN_YEAR
} = require('../constants/periods')

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

module.exports = {
  saveMetrics,
  createMetricRecord
}
