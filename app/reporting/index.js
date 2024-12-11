const config = require('../config')
const sendReport = require('./send-report')
const moment = require('moment')

const startSchemeReport = async (schemeName, template, email, startDate, endDate) => {
  try {
    console.log('[REPORTING] Starting report for scheme: ', schemeName)
    await sendReport(schemeName, template, email, startDate, endDate)
  } catch (err) {
    console.error(err)
  } finally {
    // setTimeout(start, checkInterval)// todo needed?
  }
}

const start = async () => {
  try {
    console.log('[REPORTING] Starting reporting')
    const schemes = config.reportConfig.schemes
    for (const scheme of schemes) {
      try {
        const { schemeName, template, email, schedule } = scheme
        const endDate = moment().endOf('day').toDate()
        const startDate = moment().startOf('day').subtract(schedule.dateRange.durationNumber, schedule.dateRange.durationType).toDate()
        await startSchemeReport(schemeName, template, email, startDate, endDate)
      } catch (error) {
        console.error('Error processing scheme:', scheme.schemeName, error)
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    setTimeout(start, config.reportingCheckInterval)
  }
}

module.exports = {
  start
}
