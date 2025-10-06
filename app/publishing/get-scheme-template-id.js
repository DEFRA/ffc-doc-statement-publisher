const mapSchemeTemplateId = require('../constants/map-scheme-template-id')
const documentTypes = require('../constants/document-types')

const getDocTypeIdForScheme = (scheme) => {
  if (!scheme?.shortName) {
    console.log(`getDocTypeIdForScheme: No shortName provided for scheme: ${JSON.stringify(scheme)}`)
    return null
  }

  const schemeToDocTypeMap = {
    DP: 'delinked-statement'
  }

  return schemeToDocTypeMap[scheme.shortName]
}

const getSchemeTemplateId = (scheme) => {
  if (!scheme?.shortName) {
    return null
  }

  const { shortName, year } = scheme

  // Try map in order of preference
  if (year) {
    const yearKey = `${shortName}_${year}`
    if (mapSchemeTemplateId[yearKey]) {
      return mapSchemeTemplateId[yearKey]
    }
  }

  if (mapSchemeTemplateId[shortName]) {
    return mapSchemeTemplateId[shortName]
  }

  const docTypeId = getDocTypeIdForScheme(scheme)
  if (docTypeId) {
    const docType = documentTypes.find(dt => dt.id === docTypeId)
    if (docType?.template) {
      return docType.template
    }
  }

  console.log(`getSchemeTemplateId: No template found for scheme: ${JSON.stringify(scheme)}`)
  return null
}

module.exports = getSchemeTemplateId
