
const getRequestEmailTemplateByType = require('../../../app/messaging/get-request-email-template-by-type')

const mockDocumentTypes = require('../../mocks/objects/document-types')

describe('get request email-template by type', () => {
  beforeEach(() => {
  })
  test('should template when document type exists', () => {
    const requestType = mockDocumentTypes[0].type
    const result = getRequestEmailTemplateByType(requestType, mockDocumentTypes)
    expect(result).toBe(mockDocumentTypes[0].template)
  })

  test('should throw error when type does not exist', () => {
    const requestType = 'non-exist-type'
    const wrapper = async () => { getRequestEmailTemplateByType(requestType, mockDocumentTypes) }
    expect(wrapper).rejects.toThrow(`Document type ${requestType} not found`)
  })

  test('should throw error when template is not specified', () => {
    const requestType = mockDocumentTypes[2].type
    const wrapper = async () => { getRequestEmailTemplateByType(requestType, mockDocumentTypes) }
    expect(wrapper).rejects.toThrow(`Document type ${requestType} has no template specified`)
  })
})
