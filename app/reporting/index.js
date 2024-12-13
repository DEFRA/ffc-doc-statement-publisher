const config = require('../config')
const getTodaysReport = require('./get-todays-report')
const sendReport = require('./send-report')
const moment = require('moment')

const startSchemeReport = async (schemeName, template, email, startDate, endDate) => {
  console.log('[REPORTING] Starting report for scheme: ', schemeName)
  const existingReport = await getTodaysReport(schemeName)
  if (!existingReport?.length) {
    await sendReport(schemeName, template, email, startDate, endDate)
  } else {
    console.log('[REPORTING] A report has already run today for scheme: ', schemeName)
  }
}

const isToday = (date) => {
  return moment(date).isSame(moment(), 'day')
}

const start = async () => {
  try {
    console.log('[REPORTING] Starting reporting')
    const schemes = config.reportConfig.schemes
    for (const scheme of schemes) {
      try {
        const { schemeName, template, email, schedule, dateRange } = scheme
        const { intervalNumber, intervalType } = schedule
        const { durationNumber, durationType } = dateRange
        const runDate = moment().add(intervalNumber, intervalType).startOf('day')
        const endDate = moment().endOf('day').toDate()
        const startDate = moment().startOf('day').subtract(durationNumber, durationType).toDate()
        if (isToday(runDate)) {
          console.log('[REPORTING] A report is due to run today for scheme: ', schemeName)
          await startSchemeReport(schemeName, template, email, startDate, endDate)
        } else {
          console.log('[REPORTING] No report is due to run today for scheme: ', schemeName)
        }
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
