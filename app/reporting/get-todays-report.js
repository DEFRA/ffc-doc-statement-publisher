const db = require('../data')

const getTodaysReport = async (schemeName) => {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))

  return db.reports.findAll({
    where: {
      schemeName,
      sentDate: {
        [db.Op.gte]: startOfDay,
        [db.Op.lt]: endOfDay
      }
    }
  })
}

module.exports = getTodaysReport
