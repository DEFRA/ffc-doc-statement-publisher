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
        const { intervalNumber, intervalType, dayOfMonth, dayOfYear, monthOfYear } = schedule
        const { durationNumber, durationType } = dateRange

        let runDate
        if (intervalType === 'months' && dayOfMonth) {
          runDate = moment().date(dayOfMonth).endOf('day')
          console.log(runDate)
        } else if (intervalType === 'years' && dayOfYear && monthOfYear) {
          console.log('oh ehllo')
          runDate = moment().month(monthOfYear - 1).date(dayOfYear).endOf('day')
        } else {
          runDate = moment().add(intervalNumber, intervalType).endOf('day')
        }

        const endDate = runDate.clone().toDate()
        const startDate = runDate.clone().startOf('day').subtract(durationNumber, durationType).toDate()

        console.log(`[REPORTING] A report schedule has been calculated for ${schemeName} schema with start date ${startDate} and end date ${endDate}`)

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
