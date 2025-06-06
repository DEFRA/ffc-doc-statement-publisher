const getPersonalisation = (schemeName, schemeShortName, schemeYear, schemeFrequency, businessName, transactionDate, paymentPeriod) => {
  const formatTransactionDate = (dateString) => {
    if (!dateString) return dateString
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
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
      transactionDate: formatTransactionDate(transactionDate)
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
