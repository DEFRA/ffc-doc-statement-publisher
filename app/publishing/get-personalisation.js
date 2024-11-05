const getPersonalisation = (schemeName, schemeShortName, schemeYear, schemeFrequency, businessName, paymentPeriod) => {
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
      schemeFrequency: 'Bi-Annual',
      businessName
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
