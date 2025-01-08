const db = require('../data')

const getTodaysReport = async (schemeName) => {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))

  console.log({
    today,
    startOfDay,
    endOfDay
  })

  return db.report.findAll({
    where: {
      schemeName,
      sent: {
        [db.Op.between]: [startOfDay, endOfDay],
        [db.Op.ne]: null
      }
    }
  })
}

module.exports = getTodaysReport
