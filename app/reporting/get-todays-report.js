const db = require('../data')
const hour = 23
const minute = 59
const second = 59
const millisecond = 999

const getTodaysReport = async (schemeName) => {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(hour, minute, second, millisecond))

  return db.report.findAll({
    where: {
      schemeName,
      [db.Op.or]: [
        {
          sent: {
            [db.Op.between]: [startOfDay, endOfDay]
          }
        },
        {
          sent: {
            [db.Op.eq]: null
          }
        }
      ]
    }
  })
}

module.exports = getTodaysReport
