const db = require('../data')

const createReport = async (schemeName, lastDeliveryId, reportStartDate, reportEndDate, requested) => {
  return db.report.create({
    lastDeliveryId,
    schemeName,
    reportStartDate,
    reportEndDate,
    requested
  })
}

module.exports = createReport
