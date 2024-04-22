const documentTypes = require('../constants/document-types')

const getRequestEmailTemplateByType = (requestType) => {
  const documentType = documentTypes.find(documentType => documentType.type === requestType)
  if (!documentType) {
    throw new Error(`Document type ${requestType} not found`)
  }
  if (!documentType.template) {
    throw new Error(`Document type ${requestType} has no template specified`)
  }
  return documentType.template
}

module.exports = getRequestEmailTemplateByType
