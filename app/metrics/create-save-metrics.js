const db = require('../data')
const { DEFAULT_PRINT_POST_UNIT_COST } = require('../constants/print-post-pricing')
const {
  PERIOD_ALL
} = require('../constants/periods')

const createMetricRecord = (result, period, snapshotDate, startDate, endDate) => {
  let yearToStore = null
  let monthToStore = null

  if (period === PERIOD_ALL) {
    yearToStore = result['statement.schemeYear']
  } else {
    yearToStore = result.receivedYear ? Number.parseInt(result.receivedYear) : null
    monthToStore = result.receivedMonth ? Number.parseInt(result.receivedMonth) : null
  }

  return {
    snapshotDate,
    periodType: period,
    schemeName: result['statement.schemeName'],
    schemeYear: yearToStore,
    monthInYear: monthToStore,
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
  const metricRecords = results.map(result =>
    createMetricRecord(result, period, snapshotDate, startDate, endDate)
  )

  const existingRecords = await db.metric.findAll({
    where: {
      snapshotDate,
      periodType: period
    }
  })

  const existingMap = new Map(
    existingRecords.map(record => [
      `${record.schemeName}-${record.schemeYear}-${record.monthInYear}`,
      record
    ])
  )

  const updates = []
  const inserts = []

  for (const metricRecord of metricRecords) {
    const key = `${metricRecord.schemeName}-${metricRecord.schemeYear}-${metricRecord.monthInYear}`
    const existing = existingMap.get(key)

    if (existing) {
      updates.push({ ...metricRecord, id: existing.id })
    } else {
      inserts.push(metricRecord)
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates.map(record =>
      db.metric.update(record, { where: { id: record.id } })
    ))
  }

  if (inserts.length > 0) {
    await db.metric.bulkCreate(inserts)
  }

  return { inserted: inserts.length, updated: updates.length }
}

module.exports = {
  saveMetrics,
  createMetricRecord
}
