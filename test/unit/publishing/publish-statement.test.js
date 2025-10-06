const errorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => { })
const logSpy = jest.spyOn(global.console, 'log').mockImplementation(() => { })
const infoSpy = jest.spyOn(global.console, 'info').mockImplementation(() => { })
const warnSpy = jest.spyOn(global.console, 'warn').mockImplementation(() => { })

jest.mock('../../../app/processing/publish/get-existing-document')
const getExistingDocument = require('../../../app/processing/publish/get-existing-document')

jest.mock('../../../app/publishing/validate-email')
const { validateEmail, isValidEmail } = require('../../../app/publishing/validate-email')

jest.mock('../../../app/publishing/get-personalisation')
const getPersonalisation = require('../../../app/publishing/get-personalisation')

jest.mock('../../../app/publishing/publish')
const publish = require('../../../app/publishing/publish')

jest.mock('../../../app/publishing/handle-publish-reasoning')
const handlePublishReasoning = require('../../../app/publishing/handle-publish-reasoning')

jest.mock('../../../app/publishing/save-request')
const saveRequest = require('../../../app/publishing/save-request')

jest.mock('../../../app/publishing/is-dp-scheme')
const isDpScheme = require('../../../app/publishing/is-dp-scheme')

jest.mock('../../../app/publishing/standard-error-object')
const standardErrorObject = require('../../../app/publishing/standard-error-object')

jest.mock('../../../app/publishing/get-scheme-template-id')
const getSchemeTemplateId = require('../../../app/publishing/get-scheme-template-id')

const publishStatement = require('../../../app/publishing/publish-statement')

const { EMAIL } = require('../../../app/constants/methods')
const mapSchemeTemplateId = require('../../../app/constants/map-scheme-template-id')

const NOTIFY_RESPONSE = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_DELIVERED))

const EMAIL_TEMPLATE = require('../../mocks/components/notify-template-id')

const MOCK_PERSONALISATION = {
  schemeName: 'Test Scheme',
  schemeShortName: 'TS',
  schemeYear: '2023',
  schemeFrequency: 'Monthly',
  businessName: 'Test Business',
  paymentPeriod: '1 April 2024 to 30 June 2024'
}

// Updated mock requests with current scheme data
const DP_2024_MESSAGE = {
  documentReference: 'TEST-DOC-REF-2',
  email: 'test@example.com',
  filename: 'dp-2024-statement.pdf',
  scheme: {
    name: 'Delinked Payments',
    shortName: 'DP',
    year: '2024'
  },
  businessName: 'Test Business',
  paymentPeriod: '1 January 2024 to 31 December 2024',
  emailTemplate: EMAIL_TEMPLATE
}

const DP_2025_MESSAGE = {
  documentReference: 'TEST-DOC-REF-3',
  email: 'test@example.com',
  filename: 'dp-2025-statement.pdf',
  scheme: {
    name: 'Delinked Payments',
    shortName: 'DP',
    year: '2025'
  },
  businessName: 'Test Business',
  paymentPeriod: '1 January 2025 to 31 December 2025',
  emailTemplate: EMAIL_TEMPLATE
}

let error

afterAll(() => {
  errorSpy.mockRestore()
  logSpy.mockRestore()
  infoSpy.mockRestore()
  warnSpy.mockRestore()
})

describe('Publish document', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When document reference is missing', () => {
    const requestWithoutDocRef = { email: 'test@example.com' }

    test('should return without calling any functions', async () => {
      await publishStatement(requestWithoutDocRef)
      expect(getExistingDocument).not.toHaveBeenCalled()
      expect(validateEmail).not.toHaveBeenCalled()
      expect(publish).not.toHaveBeenCalled()
      expect(saveRequest).not.toHaveBeenCalled()
    })
  })

  describe('When processing DP 2024 statements', () => {
    const request = DP_2024_MESSAGE

    beforeEach(() => {
      getExistingDocument.mockResolvedValue(null)
      validateEmail.mockReturnValue({ value: request.email })
      isValidEmail.mockReturnValue(true)
      isDpScheme.mockReturnValue(true)
      getPersonalisation.mockReturnValue(MOCK_PERSONALISATION)
      publish.mockResolvedValue(NOTIFY_RESPONSE)
      saveRequest.mockResolvedValue(undefined)
      getSchemeTemplateId.mockReturnValue(mapSchemeTemplateId.DP_2024)
    })

    test('should use the DP 2024 template', async () => {
      await publishStatement(request)
      expect(getSchemeTemplateId).toHaveBeenCalledWith(request.scheme)
      expect(publish).toHaveBeenCalledWith(
        mapSchemeTemplateId.DP_2024,
        request.email,
        request.filename,
        MOCK_PERSONALISATION,
        EMAIL
      )
    })

    test('should update request.emailTemplate with DP 2024 template', async () => {
      const requestCopy = { ...request }
      await publishStatement(requestCopy)

      expect(requestCopy.emailTemplate).toBe(mapSchemeTemplateId.DP_2024)
      expect(saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          emailTemplate: mapSchemeTemplateId.DP_2024
        }),
        NOTIFY_RESPONSE.data.id,
        EMAIL,
        undefined
      )
    })

    test('should not call validateEmail for DP scheme', async () => {
      await publishStatement(request)
      expect(validateEmail).not.toHaveBeenCalled()
    })
  })

  describe('When processing DP 2025 statements', () => {
    const request = DP_2025_MESSAGE

    beforeEach(() => {
      getExistingDocument.mockResolvedValue(null)
      validateEmail.mockReturnValue({ value: request.email })
      isValidEmail.mockReturnValue(true)
      isDpScheme.mockReturnValue(true)
      getPersonalisation.mockReturnValue(MOCK_PERSONALISATION)
      publish.mockResolvedValue(NOTIFY_RESPONSE)
      saveRequest.mockResolvedValue(undefined)
      getSchemeTemplateId.mockReturnValue(mapSchemeTemplateId.DP_2025)
    })

    test('should use the DP 2025 template', async () => {
      await publishStatement(request)
      expect(getSchemeTemplateId).toHaveBeenCalledWith(request.scheme)
      expect(publish).toHaveBeenCalledWith(
        mapSchemeTemplateId.DP_2025,
        request.email,
        request.filename,
        MOCK_PERSONALISATION,
        EMAIL
      )
    })

    test('should update request.emailTemplate with DP 2025 template', async () => {
      const requestCopy = { ...request }
      await publishStatement(requestCopy)

      expect(requestCopy.emailTemplate).toBe(mapSchemeTemplateId.DP_2025)
      expect(saveRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          emailTemplate: mapSchemeTemplateId.DP_2025
        }),
        NOTIFY_RESPONSE.data.id,
        EMAIL,
        undefined
      )
    })
  })

  describe('Template fallback scenarios', () => {
    beforeEach(() => {
      getExistingDocument.mockResolvedValue(null)
      validateEmail.mockReturnValue({ value: 'test@example.com' })
      isValidEmail.mockReturnValue(true)
      isDpScheme.mockReturnValue(false)
      getPersonalisation.mockReturnValue(MOCK_PERSONALISATION)
      publish.mockResolvedValue(NOTIFY_RESPONSE)
      saveRequest.mockResolvedValue(undefined)
    })

    test('should preserve request template when scheme template is falsy', async () => {
      const requestTemplate = 'original-request-template-id'

      getSchemeTemplateId.mockReturnValue(null)

      const requestCopy = {
        ...DP_2024_MESSAGE,
        emailTemplate: requestTemplate
      }

      await publishStatement(requestCopy)

      expect(requestCopy.emailTemplate).toBe(requestTemplate)
      expect(publish).toHaveBeenCalledWith(
        requestTemplate,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        EMAIL
      )
    })
  })

  describe('Error handling', () => {
    const request = DP_2024_MESSAGE

    beforeEach(() => {
      getExistingDocument.mockResolvedValue(null)
      validateEmail.mockReturnValue({ value: request.email })
      isValidEmail.mockReturnValue(true)
      getSchemeTemplateId.mockReturnValue(mapSchemeTemplateId.DP_2024)
    })

    test('should handle error when publish throws', async () => {
      error = new Error('Failed to publish')
      publish.mockRejectedValue(error)
      handlePublishReasoning.mockReturnValue('PUBLISH_ERROR')
      standardErrorObject.mockReturnValue({
        error: undefined,
        message: 'Failed to publish',
        reason: 'PUBLISH_ERROR',
        statusCode: undefined
      })

      await publishStatement(request)

      expect(handlePublishReasoning).toHaveBeenCalledWith(error)
      expect(saveRequest).toHaveBeenCalledWith(
        request,
        undefined,
        EMAIL,
        {
          error: undefined,
          message: 'Failed to publish',
          reason: 'PUBLISH_ERROR',
          statusCode: undefined
        }
      )
    })

    test('should handle getExistingDocument throwing error', async () => {
      error = new Error('Issue retrieving document.')
      getExistingDocument.mockRejectedValue(error)
      jest.spyOn(console, 'error').mockImplementation(() => { })

      await expect(publishStatement(request)).rejects.toThrow('Issue retrieving document.')

      expect(getExistingDocument).toHaveBeenCalled()
      console.error.mockRestore()
    })
  })
})
