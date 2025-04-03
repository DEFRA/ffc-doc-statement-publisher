const documentTypes = require('../constants/document-types')
const templateMap = new Map()

documentTypes.forEach(docType => {
  if (docType.type && docType.template) {
    templateMap.set(docType.type, docType.template)
  }
})

const getRequestEmailTemplateByType = (requestType) => {
  if (!templateMap.has(requestType)) {
    throw new Error(`Document type ${requestType} not found or has no template`)
  }
  return templateMap.get(requestType)
}

module.exports = getRequestEmailTemplateByType
