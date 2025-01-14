const db = require('../data')
const getDeliveriesForReport = require('./get-deliveries-for-report')
const createReport = require('./create-report')
const { saveReportFile } = require('../storage')
const completeReport = require('./complete-report')
const { format } = require('@fast-csv/format')

const getReportFilename = (schemeName, date) => {
  const formattedDateTime = date.toISOString()
  const formattedName = schemeName.toLowerCase().replace(/ /g, '-')
  return `${formattedName}-${formattedDateTime}.csv`
}

const sendReport = async (schemeName, template, email, startDate, endDate) => {
  const transaction = await db.sequelize.transaction()
  console.log('[REPORTING] start send report for scheme: ', schemeName)

  try {
    const deliveriesStream = await getDeliveriesForReport(schemeName, startDate, endDate, transaction)
    let hasData = false
    let lastDeliveryId = null
    const reportDate = new Date()

    const filename = getReportFilename(schemeName, reportDate)
    const csvStream = format({ headers: true })

    await new Promise((resolve, reject) => {
      deliveriesStream.on('error', (error) => {
        csvStream.end()
        reject(error)
      })

      deliveriesStream.on('data', (data) => {
        hasData = true
        lastDeliveryId = data.deliveryId
        csvStream.write(data)
      })

      deliveriesStream.on('end', async () => {
        try {
          csvStream.end()
          if (hasData) {
            console.log('[REPORTING] create report as deliveries found for schema: ', schemeName)
            const report = await createReport(schemeName, lastDeliveryId, startDate, endDate, reportDate)
            console.log('[REPORTING] report created: ', report.reportId)
            await saveReportFile(filename, csvStream)
            await completeReport(report.reportId, transaction)
            await transaction.commit()
            resolve()
          } else {
            console.log('[REPORTING] no deliveries found for schema: ', schemeName)
            await transaction.rollback()
            resolve()
          }
        } catch (error) {
          await transaction.rollback()
          reject(error)
        }
      })
    })
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

module.exports = sendReport
