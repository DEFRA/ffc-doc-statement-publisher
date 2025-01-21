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

const getRunDate = (schedule) => {
  const { intervalType, dayOfMonth, dayOfYear, monthOfYear, hour, minute, second } = schedule
  const baseDate = moment().hour(hour || 0).minute(minute || 0).second(second || 0).startOf('day')

  if (intervalType === 'months') {
    return baseDate.date(dayOfMonth || 1)
  } else if (intervalType === 'years') {
    return baseDate.month((monthOfYear || 1) - 1).date(dayOfYear || 1)
  }
  return baseDate
}

const start = async () => {
  try {
    console.log('[REPORTING] Starting reporting')
    const schemes = config.reportConfig.schemes
    for (const scheme of schemes) {
      try {
        const { schemeName, template, email, schedule, dateRange } = scheme
        const runDate = getRunDate(schedule)

        if (isToday(runDate)) {
          console.log('[REPORTING] A report is due to run today for scheme: ', schemeName)
          const startDate = moment().subtract(dateRange.durationNumber, dateRange.durationType).startOf('day')
          const endDate = moment().endOf('day')
          await startSchemeReport(schemeName, template, email, startDate, endDate)
        }
      } catch (err) {
        console.error(`[REPORTING] Error processing scheme: ${scheme.schemeName}`, err)
      }
    }
  } catch (err) {
    console.error('[REPORTING] Error starting reporting', err)
  }
}

module.exports = { start }