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
    const csvStream = format({
      headers: [
        'Status',
        'Error(s)',
        'FRN',
        'SBI',
        'Payment Reference',
        'Scheme Name',
        'Scheme Short Name',
        'Scheme Year',
        'Delivery Method',
        'Business Name',
        'Address',
        'Email',
        'Filename',
        'Document DB ID',
        'Statement Data Received',
        'Notify Email Requested',
        'Statement Failure Notification',
        'Statement Delivery Notification'
      ]
    })

    await new Promise((resolve, reject) => {
      deliveriesStream.on('error', (error) => {
        csvStream.end()
        reject(error)
      })

      deliveriesStream.on('data', (data) => {
        hasData = true
        lastDeliveryId = data.deliveryId

        const status = data.failureId ? 'Failed' : (data.completed ? 'Success' : 'Pending')
        const errors = [
          data.statusCode ? `Status Code: ${data.statusCode}` : '',
          data.reason ? `Reason: ${data.reason}` : '',
          data.error ? `Error: ${data.error}` : '',
          data.message ? `Message: ${data.message}` : ''
        ].filter(Boolean).join(', ')

        const address = [
          data.addressLine1,
          data.addressLine2,
          data.addressLine3,
          data.addressLine4,
          data.addressLine5,
          data.postcode
        ].filter(Boolean).join(', ')

        const formatDate = (date) => date ? new Date(date).toISOString().replace('T', ' ').split('.')[0] : ''

        csvStream.write({
          Status: status,
          'Error(s)': errors,
          FRN: data.frn ? data.frn.toString() : '',
          SBI: data.sbi ? data.sbi.toString() : '',
          'Payment Reference': data.PaymentReference ? data.PaymentReference.toString() : '',
          'Scheme Name': data.schemeName ? data.schemeName.toString() : '',
          'Scheme Short Name': data.schemeShortName ? data.schemeShortName.toString() : '',
          'Scheme Year': data.schemeYear ? data.schemeYear.toString() : '',
          'Delivery Method': data.method ? data.method.toString() : '',
          'Business Name': data.businessName ? data.businessName.toString() : '',
          Address: address,
          Email: data.email ? data.email.toString() : '',
          Filename: data.filename ? data.filename.toString() : '',
          'Document DB ID': data.deliveryId ? data.deliveryId.toString() : '',
          'Statement Data Received': formatDate(data.received),
          'Notify Email Requested': formatDate(data.requested),
          'Statement Delivery Notification': formatDate(data.completed)
        })
      })

      deliveriesStream.on('end', async () => {
        try {
          csvStream.end()
          if (hasData) {
            const report = await createReport(schemeName, lastDeliveryId, startDate, endDate, reportDate, transaction)
            await saveReportFile(filename, csvStream)
            await completeReport(report.reportId, transaction)
            await transaction.commit()
            resolve()
          } else {
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
