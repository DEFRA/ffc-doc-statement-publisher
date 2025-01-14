const fs = require('fs')
const db = require('../data')
const getDeliveriesForReport = require('./get-deliveries-for-report')
const { generateReportCsv } = require('./generate-report-csv')
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

    // Create CSV stream with consistent filename
    const filename = getReportFilename(schemeName, reportDate)
    // const { stream } = generateReportCsv(schemeName, reportDate)

    const csvStream = format({ headers: true });


    // deliveriesStream.pipe(stream)
    // await saveReportFile(filename, stream)
    // Process delivery stream
    await new Promise((resolve, reject) => {
      deliveriesStream.on('error', (error) => {
        stream.end()
        reject(error)
      })

      deliveriesStream.on('data', (data) => {
        hasData = true
        lastDeliveryId = data.deliveryId
        // stream.write(data)
        csvStream.write(data)
      })

      deliveriesStream.on('end', async () => {
        try {
          csvStream.end() //todo ending too soon?

          console.log('stream ended')
          
          if (hasData) {
            console.log('[REPORTING] create report as deliveries found for schema: ', schemeName)
            // const report = await createReport(schemeName, lastDeliveryId, startDate, endDate, reportDate)
            
      
            await saveReportFile(filename, csvStream)
            // await completeReport(report.reportId, transaction)
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
    console.error('arrr!!!',error)
    await transaction.rollback()
    throw error
  }
}

module.exports = sendReport