const db = require('../data')

const createReport = async (schemeName, lastDeliveryId, reportStartDate, reportEndDate, requested, transaction) => {
  return await db.report.create({
    lastDeliveryId,
    schemeName,
    reportStartDate,
    reportEndDate,
    requested
  }, { transaction })
}

module.exports = createReport
