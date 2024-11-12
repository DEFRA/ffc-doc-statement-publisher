const publishStatement = require('../../../app/publishing/publish-statement')
const { EMAIL, LETTER } = require('../../../app/constants/methods')
const { getExistingDocument } = require('../../../app/processing/publish')
const validateEmail = require('../../../app/publishing/validate-email')
const getPersonalisation = require('../../../app/publishing/get-personalisation')
const publishByEmail = require('../../../app/publishing/publish-by-email')
const publishByLetter = require('../../../app/publishing/publish-by-letter')
const handlePublishReasoning = require('../../../app/publishing/handle-publish-reasoning')
const saveRequest = require('../../../app/publishing/save-request')
const { retry } = require('../../../app/retry')
const { getFile } = require('../../../app/storage')

jest.mock('../../../app/processing/publish', () => ({
  getExistingDocument: jest.fn()
}))
jest.mock('../../../app/publishing/validate-email')
jest.mock('../../../app/publishing/get-personalisation')
jest.mock('../../../app/publishing/publish-by-email')
jest.mock('../../../app/publishing/publish-by-letter')
jest.mock('../../../app/publishing/handle-publish-reasoning')
jest.mock('../../../app/publishing/save-request')
jest.mock('../../../app/retry', () => ({
  retry: jest.fn()
}))
jest.mock('../../../app/storage', () => ({
  getFile: jest.fn()
}))

describe('publishStatement', () => {
  let request
  let response
  // let errorObject

  beforeEach(() => {
    request = {
      documentReference: 'doc-ref',
      email: 'test@example.com',
      emailTemplate: 'email-template',
      filename: 'filename.pdf',
      scheme: {
        name: 'Scheme Name',
        shortName: 'Short Name',
        year: 2021,
        frequency: 'Annual'
      },
      businessName: 'Business Name',
      paymentPeriod: 'Payment Period'
    }

    response = { data: { id: 'response-id' } }
    // errorObject = {
    //   reason: 'Error reason',
    //   statusCode: 500,
    //   error: 'Error',
    //   message: 'Error message'
    // }

    jest.clearAllMocks()
    console.info = jest.fn()
    console.log = jest.fn()
  })

  test('should skip processing if existing document is found', async () => {
    getExistingDocument.mockResolvedValue({ documentReference: 'doc-ref' })

    await publishStatement(request)

    expect(getExistingDocument).toHaveBeenCalledWith('doc-ref')
    expect(console.info).toHaveBeenCalledWith('Duplicate document received, skipping doc-ref')
  })

  test('should handle publish errors and save error details', async () => {
    getExistingDocument.mockResolvedValue(null)
    validateEmail.mockImplementation(() => {})
    getPersonalisation.mockReturnValue({})
    retry.mockImplementation(fn => fn())
    getFile.mockResolvedValue('file-content')
    const publishError = new Error('Publish error')
    publishError.statusCode = 500
    publishError.error = 'Internal Server Error'
    publishByEmail.mockRejectedValue(publishError)
    handlePublishReasoning.mockReturnValue('Handled reason')
    saveRequest.mockResolvedValue()
    await publishStatement(request)
    expect(handlePublishReasoning).toHaveBeenCalledWith(publishError)
    expect(saveRequest).toHaveBeenCalledWith(request, undefined, EMAIL, {
      reason: 'Handled reason',
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Publish error'
    })
  })

  test('should throw error if getExistingDocument fails', async () => {
    getExistingDocument.mockRejectedValue(new Error('Database error'))

    await expect(publishStatement(request)).rejects.toThrow('Could not check for duplicates')
  })

  test('should validate email when email is provided', async () => {
    getExistingDocument.mockResolvedValue(null)
    validateEmail.mockImplementation(() => {})
    getPersonalisation.mockReturnValue({})
    retry.mockImplementation(fn => fn())
    getFile.mockResolvedValue('file-content')
    publishByEmail.mockResolvedValue(response)
    saveRequest.mockResolvedValue()

    await publishStatement(request)

    expect(validateEmail).toHaveBeenCalledWith('test@example.com')
    expect(request.method).toBe(EMAIL)
    expect(getPersonalisation).toHaveBeenCalledWith(
      'Scheme Name',
      'Short Name',
      2021,
      'Annual',
      'Business Name',
      'Payment Period'
    )
    expect(getFile).toHaveBeenCalledWith('filename.pdf')
    expect(publishByEmail).toHaveBeenCalledWith(
      'email-template',
      'test@example.com',
      'file-content',
      {}
    )
    expect(console.log).toHaveBeenCalledWith('Statement published via email: filename.pdf')
    expect(saveRequest).toHaveBeenCalledWith(request, 'response-id', EMAIL, undefined)
  })

  test('should publish by letter when email is not provided', async () => {
    request.email = ''
    getExistingDocument.mockResolvedValue(null)
    retry.mockImplementation(fn => fn())
    getFile.mockResolvedValue('file-content')
    publishByLetter.mockResolvedValue(response)
    saveRequest.mockResolvedValue()

    await publishStatement(request)

    expect(request.method).toBe(LETTER)
    expect(getFile).toHaveBeenCalledWith('filename.pdf')
    expect(publishByLetter).toHaveBeenCalledWith('filename.pdf', 'file-content')
    expect(console.log).toHaveBeenCalledWith('Statement published via print: filename.pdf')
    expect(saveRequest).toHaveBeenCalledWith(request, 'response-id', LETTER, undefined)
  })

  test('should handle publish errors and save error details', async () => {
    getExistingDocument.mockResolvedValue(null)
    validateEmail.mockImplementation(() => {})
    getPersonalisation.mockReturnValue({})
    retry.mockImplementation(fn => fn())
    getFile.mockResolvedValue('file-content')
    const publishError = new Error('Publish error')
    publishByEmail.mockRejectedValue(publishError)
    handlePublishReasoning.mockReturnValue('Handled reason')
    saveRequest.mockResolvedValue()

    await publishStatement(request)

    expect(handlePublishReasoning).toHaveBeenCalledWith(publishError)
    expect(saveRequest).toHaveBeenCalledWith(request, undefined, EMAIL, {
      reason: 'Handled reason',
      statusCode: undefined,
      error: undefined,
      message: 'Publish error'
    })
  })

  test('should log error if saveRequest fails', async () => {
    getExistingDocument.mockResolvedValue(null)
    validateEmail.mockImplementation(() => {})
    getPersonalisation.mockReturnValue({})
    retry.mockImplementation(fn => fn())
    getFile.mockResolvedValue('file-content')
    publishByEmail.mockResolvedValue(response)
    saveRequest.mockRejectedValue(new Error('Save error'))

    await publishStatement(request)

    expect(console.log).toHaveBeenCalledWith('Could not save the request')
  })
})
