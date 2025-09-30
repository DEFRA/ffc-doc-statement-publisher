const delinkedRetentionMonths = 18

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
    latestDownloadDate.setMonth(latestDownloadDate.getMonth() + delinkedRetentionMonths)

    // If the day of the month is less than the original day, adjust it to the last day of the month
    if (latestDownloadDate.getDate() < new Date(currentTimestamp).getDate()) {
      latestDownloadDate.setDate(0)
    }

    return formatTransactionDate(latestDownloadDate)
  }

  if (schemeShortName === 'SFIA') {
    return {
      schemeName,
      schemeShortName: 'advanced',
      schemeYear,
      schemeFrequency: 'one-off',
      businessName
    }
  }
  if (schemeShortName === 'DP') {
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
    paymentPeriod
  }
}

module.exports = getPersonalisation
