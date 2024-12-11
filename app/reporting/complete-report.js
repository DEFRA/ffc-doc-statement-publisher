const db = require('../data')

const completeReport = async (reportId, transaction) => {
  await db.report.update(
    { sent: new Date() },
    { where: { reportId } },
    { transaction })
}

module.exports = completeReport
