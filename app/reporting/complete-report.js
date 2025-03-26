const db = require('../data')

const completeReport = async (reportId, lastDeliveryId, transaction) => {
  await db.report.update(
    {
      sent: new Date(),
      lastDeliveryId
    },
    { where: { reportId } },
    { transaction })
}

module.exports = completeReport
