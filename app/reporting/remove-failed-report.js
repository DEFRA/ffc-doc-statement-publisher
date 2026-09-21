const { report } = require('../data')

const removeFailedReport = async (reportId) => {
  if (reportId) {
    await report().where({ reportId }).del()
  }
}

module.exports = removeFailedReport
