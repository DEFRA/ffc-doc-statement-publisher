const getDeliveriesForReport = require('./get-deliveries-for-report')
const createReport = require('./create-report')
const completeReport = require('./complete-report')
const publishByEmail = require('../publishing/publish-by-email')
const generateReportCsv = require('./generate-report-csv')
const db = require('../data')

const sendReport = async (schemeName, template, email, startDate, endDate) => {
  const transaction = await db.sequelize.transaction()
  try {
    const deliveries = await getDeliveriesForReport(schemeName, startDate, endDate, transaction)
    if (deliveries.length) {
      const report = await createReport(schemeName, deliveries[deliveries.length - 1].deliveryId, startDate, endDate, new Date())
      const { filename, filedata } = generateReportCsv(deliveries)
      const personlisation = {
        schemeName,
        startDate,
        endDate
      }
      await publishByEmail(template, email, filedata, personlisation, filename)
      await completeReport(report.id, transaction)
    } else {
      console.log('[REPORTING] nothing to report for scheme: ', schemeName)
    }
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = sendReport
