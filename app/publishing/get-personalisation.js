const getPersonalisation = (schemeName, schemeShortName, schemeYear, schemeFrequency, businessName) => {
  if (schemeShortName === 'SFIA') {
    return {
      schemeName,
      schemeShortName: 'advanced',
      schemeYear,
      schemeFrequency: 'one-off',
      businessName
    }
  }
  return {
    schemeName,
    schemeShortName,
    schemeYear,
    schemeFrequency: schemeFrequency.toLowerCase(),
    businessName
  }
}

module.exports = getPersonalisation
