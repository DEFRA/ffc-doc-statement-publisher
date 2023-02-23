const getPersonalisation = (schemeName, schemeShortName, schemeYear, schemeFrequency, businessName) => {
  return {
    schemeName,
    schemeShortName,
    schemeYear,
    schemeFrequency: schemeFrequency.toLowerCase(),
    businessName
  }
}

module.exports = getPersonalisation
