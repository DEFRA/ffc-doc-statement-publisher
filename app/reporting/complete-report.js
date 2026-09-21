const { report } = require('../data')

const completeReport = async (reportId, lastDeliveryId, transaction) => {
  await report(transaction ?? undefined)
    .where({ reportId })
    .update({
      sent: new Date(),
      lastDeliveryId
    })
}

module.exports = completeReport
