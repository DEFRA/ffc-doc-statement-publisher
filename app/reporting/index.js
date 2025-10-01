const config = require('../config')
const getTodaysReport = require('./get-todays-report')
const { sendReport } = require('./send-report')
const { sendAlert } = require('../alert')
const moment = require('moment')

const startSchemeReport = async (schemeName, startDate, endDate) => {
  console.log('[REPORTING] Starting report for scheme: ', schemeName)
  const existingReport = await getTodaysReport(schemeName)
  console.log('existing', existingReport)
  if (!existingReport?.length) {
    await sendReport(schemeName, startDate, endDate)
  } else {
    console.log('[REPORTING] A report is already running or has already run today for scheme: ', schemeName)
  }
}

const isToday = (date) => {
  return moment(date).isSame(moment(), 'day')
}

const getRunDate = (schedule) => {
  const { intervalType, dayOfMonth, dayOfYear, monthOfYear, hour, minute, second } = schedule
  const baseDate = moment().hour(hour || 0).minute(minute || 0).second(second || 0).startOf('day')

  if (intervalType === 'months') {
    return baseDate.date(dayOfMonth || 1)
  } else if (intervalType === 'years') {
    return baseDate.month((monthOfYear || 1) - 1).date(dayOfYear || 1)
  } else {
    return baseDate
  }
}

const processScheme = async (scheme) => {
  const { schemeName, schedule, dateRange } = scheme
  const runDate = getRunDate(schedule)

  if (isToday(runDate)) {
    console.log('[REPORTING] A report is due to run today for scheme: ', schemeName)
    const startDate = moment().subtract(dateRange.durationNumber, dateRange.durationType).startOf('day').toDate()
    const endDate = moment().endOf('day').toDate()
    await startSchemeReport(schemeName, startDate, endDate)
  } else {
    console.log('[REPORTING] No report is due to run today for scheme: ', schemeName)
  }
}

const start = async () => {
  try {
    console.log('[REPORTING] Starting reporting')
    const schemes = config.reportConfig.schemes
    for (const scheme of schemes) {
      try {
        await processScheme(scheme)
      } catch (error) {
        console.error('Error processing scheme:', scheme.schemeName, error)
      }
    }
  } catch (err) {
    console.error(err)
    sendAlert('Reporting', err, `Reporting service error: ${err.message}`)
  } finally {
    setTimeout(start, config.reportingCheckInterval)
  }
}

module.exports = {
  start
}
