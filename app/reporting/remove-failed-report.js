const db = require('../data')

const removeFailedReport = async (reportId) => {
  if (reportId) {
    await db.report.destroy({
      where: {
        reportId
      }
    })
  }
}

module.exports = removeFailedReport
