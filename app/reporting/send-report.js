const completeReport = require('./complete-report')
const { saveReportFile } = require('../storage')
const db = require('../data')
const getDeliveriesForReport = require('./get-deliveries-for-report')
const generateReportCsv = require('./generate-report-csv')
const { PassThrough } = require('stream')

const sendReport = async (schemeName, template, email, startDate, endDate) => {
  const transaction = await db.sequelize.transaction()
  console.log('[REPORTING] start send report for scheme: ', schemeName)
  try {
    const deliveriesStream = await getDeliveriesForReport(schemeName, startDate, endDate, transaction)
    let hasData = false

    deliveriesStream.on('data', () => {
      hasData = true
      deliveriesStream.pause() // Pause the stream to prevent further data processing until we are ready
    })

    deliveriesStream.on('end', async () => {
      if (hasData) {
        console.log('[REPORTING] create report as deliveries found for schema: ', schemeName)
        const report = await createReport(schemeName, null, startDate, endDate, new Date())

        const { filename, fileStream } = generateReportCsv(schemeName, new Date())

        const passThroughStream = new PassThrough()
        deliveriesStream.pipe(passThroughStream).pipe(fileStream).on('finish', async () => {
          await saveReportFile(filename, passThroughStream)
          await completeReport(report.reportId, transaction)
        })

        deliveriesStream.resume() // Resume the stream to continue processing data
      } else {
        console.log('[REPORTING] nothing to report for scheme: ', schemeName)
      }
    })

    await transaction.commit()
  } catch (err) {
    console.error('[REPORTING] Error sending report for scheme: ', schemeName, err)
    await transaction.rollback()
    throw err
  }
}

module.exports = sendReport
