const { report } = require('../data')

const createReport = async (schemeName, lastDeliveryId, reportStartDate, reportEndDate, requested) => {
  const [saved] = await report()
    .insert({
      lastDeliveryId,
      schemeName,
      reportStartDate,
      reportEndDate,
      requested
    })
    .returning('*')

  return saved
}

module.exports = createReport
