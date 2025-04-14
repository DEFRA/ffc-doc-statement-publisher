const defaultDocumentTypes = require('../constants/document-types')

const getRequestEmailTemplateByType = (requestType, documentTypes = defaultDocumentTypes) => {
  const docType = documentTypes.find(d => d.type === requestType)

  if (!docType) {
    throw new Error(`Document type ${requestType} not found`)
  }

  if (!docType.template) {
    throw new Error(`Document type ${requestType} has no template specified`)
  }

  return docType.template
}

module.exports = getRequestEmailTemplateByType
