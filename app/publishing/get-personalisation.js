const config = require('../config')
const { SHORT_NAMES } = require('../constants/scheme-names')

const daysInWeek = 7

const getPersonalisation = (schemeName, schemeShortName, schemeYear, schemeFrequency, businessName, transactionDate, paymentPeriod) => {
  const formatTransactionDate = (dateString) => {
    if (!dateString) {
      return dateString
    }
    const date = new Date(dateString)
    const day = date.getDate()
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const calculateLatestDownloadDate = () => {
    const currentTimestamp = Date.now()
    const latestDownloadDate = new Date(currentTimestamp)
    const daysToAdd = config.retentionPeriodInWeeks * daysInWeek
    latestDownloadDate.setDate(latestDownloadDate.getDate() + daysToAdd)
    return formatTransactionDate(latestDownloadDate)
  }

  if (schemeShortName === SHORT_NAMES.DP) {
    return {
      schemeName,
      schemeShortName,
      schemeYear,
      schemeFrequency: 'Annual',
      businessName,
      transactionDate: formatTransactionDate(transactionDate),
      latestDownloadDate: calculateLatestDownloadDate()
    }
  }
  return {
    schemeName,
    schemeShortName,
    schemeYear,
    schemeFrequency: schemeFrequency.toLowerCase(),
    businessName,
    paymentPeriod,
    latestDownloadDate: calculateLatestDownloadDate()
  }
}

module.exports = getPersonalisation
