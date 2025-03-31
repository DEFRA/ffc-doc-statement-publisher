const db = require('../data')
const getDeliveriesForReport = require('./get-deliveries-for-report')
const createReport = require('./create-report')
const { saveReportFile } = require('../storage')
const completeReport = require('./complete-report')
const { format } = require('@fast-csv/format')
const { FAILED, PENDING, SUCCESS } = require('../constants/report')
const headers = require('../constants/report-headers')

const getReportFilename = (schemeName, date) => {
  const formattedDateTime = date.toISOString()
  const formattedName = schemeName.toLowerCase().replace(/ /g, '-')
  return `${formattedName}-${formattedDateTime}.csv`
}

const getErrors = (data) => {
  return [
    data.statusCode ? `Status Code: ${data.statusCode}` : '',
    data.reason ? `Reason: ${data.reason}` : '',
    data.error ? `Error: ${data.error}` : '',
    data.message ? `Message: ${data.message}` : ''
  ].filter(Boolean).join(', ')
}

const getAddress = (data) => {
  return [
    data.addressLine1,
    data.addressLine2,
    data.addressLine3,
    data.addressLine4,
    data.addressLine5,
    data.postcode
  ].filter(Boolean).join(', ')
}

const formatDate = (date) => date ? new Date(date).toISOString().replace('T', ' ').split('.')[0] : ''

const getFieldValue = (field) => field ? field.toString() : ''

const getFormattedData = (data) => ({
  FRN: getFieldValue(data.frn),
  SBI: getFieldValue(data.sbi),
  'Payment Reference': getFieldValue(data.PaymentReference),
  'Scheme Name': getFieldValue(data.schemeName),
  'Scheme Short Name': getFieldValue(data.schemeShortName),
  'Scheme Year': getFieldValue(data.schemeYear),
  'Delivery Method': getFieldValue(data.method),
  'Business Name': getFieldValue(data.businessName),
  Email: getFieldValue(data.email),
  Filename: getFieldValue(data.filename),
  'Document DB ID': getFieldValue(data.deliveryId),
  'Statement Data Received': formatDate(data.received),
  'Notify Email Requested': formatDate(data.requested),
  'Statement Failure Notification': formatDate(data.failed),
  'Statement Delivery Notification': formatDate(data.completed)
})

const getDataRow = (data, status, address, errors) => {
  const formattedData = getFormattedData(data)
  return {
    Status: status,
    'Error(s)': errors,
    'Business Address': address,
    ...formattedData
  }
}

const determineStatus = (data) => {
  if (data.failureId) {
    return FAILED
  } else if (data.completed) {
    return SUCCESS
  } else {
    return PENDING
  }
}

const sendReport = async (schemeName, startDate, endDate) => {
  let lastDeliveryId = null
  const reportDate = new Date()
  const report = await createReport(schemeName, lastDeliveryId, startDate, endDate, reportDate)

  const transaction = await db.sequelize.transaction()
  console.log('[REPORTING] start building report for scheme: ', schemeName)

  try {
    const deliveriesStream = await getDeliveriesForReport(schemeName, startDate, endDate, transaction)

    let hasData = false

    const filename = getReportFilename(schemeName, reportDate)

    const csvStream = format({
      headers
    })

    await new Promise((resolve, reject) => {
      deliveriesStream.on('error', (error) => {
        csvStream.end()
        reject(error)
      })

      deliveriesStream.on('data', (data) => {
        hasData = true
        lastDeliveryId = data.deliveryId

        const status = determineStatus(data)
        const errors = getErrors(data)
        const address = getAddress(data)
        csvStream.write(getDataRow(data, status, address, errors))
      })

      deliveriesStream.on('end', async () => {
        try {
          csvStream.end()
          if (hasData) {
            await saveReportFile(filename, csvStream)
            await completeReport(report.reportId, lastDeliveryId, transaction)
            await transaction.commit()
            resolve()
          } else {
            console.log('There was no data for this report')
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

module.exports = {
  getDataRow,
  sendReport
}
