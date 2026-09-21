const { report } = require('../data')
const hour = 23
const minute = 59
const second = 59
const millisecond = 999

const getTodaysReport = async (schemeName) => {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(hour, minute, second, millisecond))

  return report()
    .where({ schemeName })
    .where(function () {
      this.whereBetween('sent', [startOfDay, endOfDay])
        .orWhere(function () {
          this.whereNull('sent').whereBetween('requested', [startOfDay, endOfDay])
        })
    })
}

module.exports = getTodaysReport
