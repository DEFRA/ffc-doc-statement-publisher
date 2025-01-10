const getDeliveriesForReport = require('./get-deliveries-for-report')
const createReport = require('./create-report')
const completeReport = require('./complete-report')
const publishByEmail = require('../publishing/publish-by-email')
const generateReportCsv = require('./generate-report-csv')
const { saveReportFile } = require('../storage')
const db = require('../data')

const sendReport = async (schemeName, template, email, startDate, endDate) => {
  const transaction = await db.sequelize.transaction()
  console.log('[REPORTING] start send report for scheme: ', schemeName)
  try {
    const deliveries = await getDeliveriesForReport(schemeName, startDate, endDate, transaction)
    if (deliveries.length) {
      console.log('[REPORTING] create report as deliveries found for schema: ', schemeName)
      const report = await createReport(schemeName, deliveries[deliveries.length - 1].deliveryId, startDate, endDate, new Date())
      const { filename, filedata } = generateReportCsv(schemeName, new Date(), deliveries)
      const personlisation = {
        schemeName,
        startDate,
        endDate
      }
      // save file in blob storage
      await saveReportFile(filename, filedata)
      // send CRM message
      await publishByEmail(template, email, filedata, personlisation, filename)
      await completeReport(report.reportId, transaction)
    } else {
      console.log('[REPORTING] nothing to report for scheme: ', schemeName)
    }
    await transaction.commit()
  } catch (err) {
    console.error('[REPORTING] Error sending report for scheme: ', schemeName, err)
    await transaction.rollback()
    throw err
  }
}

module.exports = sendReport
