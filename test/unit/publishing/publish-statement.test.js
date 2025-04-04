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

jest.mock('../../../app/messaging/get-request-email-template-by-type')
const getRequestEmailTemplateByType = require('../../../app/messaging/get-request-email-template-by-type')

jest.mock('../../../app/publishing/is-dp-scheme')
const isDpScheme = require('../../../app/publishing/is-dp-scheme')

jest.mock('../../../app/publishing/standard-error-object')
const standardErrorObject = require('../../../app/publishing/standard-error-object')

const publishStatement = require('../../../app/publishing/publish-statement')

const { EMPTY, INVALID } = require('../../../app/constants/failure-reasons')
const { EMAIL, LETTER } = require('../../../app/constants/methods')

const NOTIFY_RESPONSE = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_DELIVERED))

const EMAIL_TEMPLATE = require('../../mocks/components/notify-template-id')

const NOTIFY_ID = NOTIFY_RESPONSE.data.id
const MOCK_PERSONALISATION = {
  schemeName: 'Test Scheme',
  schemeShortName: 'TS',
  schemeYear: '2021',
  schemeFrequency: 'Monthly',
  businessName: 'Test Business',
  paymentPeriod: '1 April 2024 to 30 June 2024'
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

  describe.each([
    { name: 'statement', request: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').STATEMENT_MESSAGE)).body },
    { name: 'schedule', request: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').SCHEDULE_MESSAGE)).body }
  ])('When email request is a $name', ({ name, request }) => {
    describe('When it is a duplicate', () => {
      beforeEach(async () => {
        getExistingDocument.mockResolvedValue(true)
      })

      test('should call getExistingDocument', async () => {
        await publishStatement(request)
        expect(getExistingDocument).toHaveBeenCalled()
      })

      test('should call getExistingDocument once', async () => {
        await publishStatement(request)
        expect(getExistingDocument).toHaveBeenCalledTimes(1)
      })

      test('should call getExistingDocument with request.documentReference', async () => {
        await publishStatement(request)
        expect(getExistingDocument).toHaveBeenCalledWith(request.documentReference)
      })

      test('should not call validateEmail', async () => {
        await publishStatement(request)
        expect(validateEmail).not.toHaveBeenCalled()
      })

      test('should not call getPersonalisation', async () => {
        await publishStatement(request)
        expect(getPersonalisation).not.toHaveBeenCalled()
      })

      test('should not call publish', async () => {
        await publishStatement(request)
        expect(publish).not.toHaveBeenCalled()
      })

      test('should not call saveRequest', async () => {
        await publishStatement(request)
        expect(saveRequest).not.toHaveBeenCalled()
      })

      test('should not call handlePublishReasoning', async () => {
        await publishStatement(request)
        expect(handlePublishReasoning).not.toHaveBeenCalled()
      })

      test('should not throw', async () => {
        const wrapper = async () => { await publishStatement(request) }
        expect(wrapper).not.toThrow()
      })

      test('should return undefined', async () => {
        const result = await publishStatement(request)
        expect(result).toBeUndefined()
      })

      describe('When it is not a duplicate', () => {
        beforeEach(() => {
          getExistingDocument.mockResolvedValue(null)
          validateEmail.mockReturnValue({ value: request.email })
          isValidEmail.mockReturnValue(true)
          isDpScheme.mockReturnValue(false)
          getPersonalisation.mockReturnValue(MOCK_PERSONALISATION)
          handlePublishReasoning.mockReturnValue(undefined)
          publish.mockResolvedValue(NOTIFY_RESPONSE)
          saveRequest.mockResolvedValue(undefined)
          getRequestEmailTemplateByType.mockReturnValue(EMAIL_TEMPLATE)
          standardErrorObject.mockImplementation((err, reason) => ({
            error: err?.error,
            message: err?.message,
            reason,
            statusCode: err?.statusCode
          }))
          request.emailTemplate = EMAIL_TEMPLATE
        })

        describe('When it is a DP scheme', () => {
          beforeEach(() => {
            isDpScheme.mockReturnValue(true)
          })

          test('should not call validateEmail', async () => {
            await publishStatement(request)
            expect(validateEmail).not.toHaveBeenCalled()
          })

          test('should still call publish', async () => {
            await publishStatement(request)
            expect(publish).toHaveBeenCalled()
          })
        })

        describe('When email is invalid', () => {
          beforeEach(() => {
            isValidEmail.mockReturnValue(false)
          })

          test('should use LETTER as publishStatementType', async () => {
            await publishStatement(request)
            expect(publish).toHaveBeenCalledWith(
              request.emailTemplate,
              request.email,
              request.filename,
              null,
              LETTER
            )
          })

          test('should save request with LETTER method', async () => {
            await publishStatement(request)
            expect(saveRequest).toHaveBeenCalledWith(
              request,
              NOTIFY_ID,
              LETTER,
              undefined
            )
          })
        })

        describe('When it has a valid email', () => {
          beforeEach(() => {
            error = undefined
          })

          test('should call getExistingDocument', async () => {
            await publishStatement(request)
            expect(getExistingDocument).toHaveBeenCalled()
          })

          test('should call getExistingDocument once', async () => {
            await publishStatement(request)
            expect(getExistingDocument).toHaveBeenCalledTimes(1)
          })

          test('should call getExistingDocument with request.documentReference', async () => {
            await publishStatement(request)
            expect(getExistingDocument).toHaveBeenCalledWith(request.documentReference)
          })

          test('should call validateEmail', async () => {
            await publishStatement(request)
            expect(validateEmail).toHaveBeenCalled()
          })

          test('should call validateEmail once', async () => {
            await publishStatement(request)
            expect(validateEmail).toHaveBeenCalledTimes(1)
          })

          test('should call validateEmail with request.email', async () => {
            await publishStatement(request)
            expect(validateEmail).toHaveBeenCalledWith(request.email)
          })

          test('should call getPersonalisation', async () => {
            await publishStatement(request)
            expect(getPersonalisation).toHaveBeenCalled()
          })

          test('should call getPersonalisation once', async () => {
            await publishStatement(request)
            expect(getPersonalisation).toHaveBeenCalledTimes(1)
          })

          test('should call getPersonalisation with request.scheme.name, request.scheme.shortName, request.scheme.year, request.scheme.frequency and request.businessName', async () => {
            await publishStatement(request)
            expect(getPersonalisation).toHaveBeenCalledWith(
              request.scheme.name,
              request.scheme.shortName,
              request.scheme.year,
              request.scheme.frequency,
              request.businessName,
              request.paymentPeriod
            )
          })

          test('should call publish', async () => {
            await publishStatement(request)
            expect(publish).toHaveBeenCalled()
          })

          test('should call publish once', async () => {
            await publishStatement(request)
            expect(publish).toHaveBeenCalledTimes(1)
          })

          test('should call publish with request.email, request.filename and MOCK_PERSONALISATION', async () => {
            await publishStatement(request)
            expect(publish).toHaveBeenCalledWith(
              EMAIL_TEMPLATE,
              request.email,
              request.filename,
              MOCK_PERSONALISATION,
              EMAIL
            )
          })

          test('should call saveRequest', async () => {
            await publishStatement(request)
            expect(saveRequest).toHaveBeenCalled()
          })

          test('should call saveRequest once', async () => {
            await publishStatement(request)
            expect(saveRequest).toHaveBeenCalledTimes(1)
          })

          test('should call saveRequest with request, NOTIFY_ID, EMAIL and handlePublishReasoning', async () => {
            await publishStatement(request)
            expect(saveRequest).toHaveBeenCalledWith(
              request,
              NOTIFY_ID,
              EMAIL,
              undefined
            )
          })

          test('should not call handlePublishReasoning', async () => {
            await publishStatement(request)
            expect(handlePublishReasoning).not.toHaveBeenCalled()
          })

          test('should not throw', async () => {
            const wrapper = async () => { await publishStatement(request) }
            expect(wrapper).not.toThrow()
          })

          test('should return undefined', async () => {
            const result = await publishStatement(request)
            expect(result).toBeUndefined()
          })
        })

        describe.each([
          { errorMessage: 'Email is invalid: Email cannot be empty.', reason: EMPTY },
          { errorMessage: 'Email is invalid: The email provided is invalid.', reason: INVALID },
          { errorMessage: 'This is not a known validation error message.', reason: undefined }
        ])('When validateEmail throws error with message "$errorMessage"', ({ errorMessage, reason }) => {
          beforeEach(() => {
            error = new Error(errorMessage)
            validateEmail.mockImplementation(() => { throw error })
            handlePublishReasoning.mockReturnValue(reason)
            standardErrorObject.mockReturnValue({
              error: undefined,
              message: errorMessage,
              reason,
              statusCode: undefined
            })
          })

          test('should call getExistingDocument', async () => {
            await publishStatement(request)
            expect(getExistingDocument).toHaveBeenCalled()
          })

          test('should call getExistingDocument once', async () => {
            await publishStatement(request)
            expect(getExistingDocument).toHaveBeenCalledTimes(1)
          })

          test('should call getExistingDocument with request.documentReference', async () => {
            await publishStatement(request)
            expect(getExistingDocument).toHaveBeenCalledWith(request.documentReference)
          })

          test('should call validateEmail', async () => {
            await publishStatement(request)
            expect(validateEmail).toHaveBeenCalled()
          })

          test('should call validateEmail once', async () => {
            await publishStatement(request)
            expect(validateEmail).toHaveBeenCalledTimes(1)
          })

          test('should call validateEmail with request.email', async () => {
            await publishStatement(request)
            expect(validateEmail).toHaveBeenCalledWith(request.email)
          })

          test('should not call getPersonalisation', async () => {
            await publishStatement(request)
            expect(getPersonalisation).not.toHaveBeenCalled()
          })

          test('should not call publish', async () => {
            await publishStatement(request)
            expect(publish).not.toHaveBeenCalled()
          })

          test('should call handlePublishReasoning', async () => {
            await publishStatement(request)
            expect(handlePublishReasoning).toHaveBeenCalled()
          })

          test('should call handlePublishReasoning once', async () => {
            await publishStatement(request)
            expect(handlePublishReasoning).toHaveBeenCalledTimes(1)
          })

          test('should call handlePublishReasoning with error', async () => {
            await publishStatement(request)
            expect(handlePublishReasoning).toHaveBeenCalledWith(error)
          })

          test('should call standardErrorObject with error and reason', async () => {
            await publishStatement(request)
            expect(standardErrorObject).toHaveBeenCalledWith(error, reason)
          })

          test('should call saveRequest', async () => {
            await publishStatement(request)
            expect(saveRequest).toHaveBeenCalled()
          })

          test('should call saveRequest once', async () => {
            await publishStatement(request)
            expect(saveRequest).toHaveBeenCalledTimes(1)
          })

          test('should call saveRequest with request, undefined, EMAIL and errorObject', async () => {
            await publishStatement(request)
            expect(saveRequest).toHaveBeenCalledWith(
              request,
              undefined,
              EMAIL,
              { error: undefined, message: errorMessage, reason, statusCode: undefined }
            )
          })

          test('should not throw', async () => {
            const wrapper = async () => { await publishStatement(request) }
            expect(wrapper).not.toThrow()
          })

          test('should return undefined', async () => {
            const result = await publishStatement(request)
            expect(result).toBeUndefined()
          })
        })

        describe('When publish throws an error', () => {
          beforeEach(() => {
            error = new Error('Failed to publish')
            publish.mockRejectedValue(error)
            handlePublishReasoning.mockReturnValue('PUBLISH_ERROR')
            standardErrorObject.mockReturnValue({
              error: undefined,
              message: 'Failed to publish',
              reason: 'PUBLISH_ERROR',
              statusCode: undefined
            })
          })

          test('should call handlePublishReasoning with error', async () => {
            await publishStatement(request)
            expect(handlePublishReasoning).toHaveBeenCalledWith(error)
          })

          test('should call standardErrorObject', async () => {
            await publishStatement(request)
            expect(standardErrorObject).toHaveBeenCalled()
          })

          test('should call saveRequest with errorObject', async () => {
            await publishStatement(request)
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

          test('should not throw', async () => {
            const wrapper = async () => { await publishStatement(request) }
            expect(wrapper).not.toThrow()
          })
        })

        describe('When getExistingDocument throws', () => {
          beforeEach(() => {
            error = new Error('Issue retrieving document.')
            getExistingDocument.mockRejectedValue(error)
            jest.spyOn(console, 'error').mockImplementation(() => { })
          })

          test('should call getExistingDocument', async () => {
            try { await publishStatement(request) } catch { }
            expect(getExistingDocument).toHaveBeenCalled()
          })

          test('should throw error', async () => {
            const wrapper = async () => { await publishStatement(request) }
            expect(wrapper).rejects.toThrow()
          })

          test('should throw correct error message', async () => {
            const wrapper = async () => { await publishStatement(request) }
            expect(wrapper).rejects.toThrow('Issue retrieving document.')
          })

          afterEach(() => {
            console.error.mockRestore()
          })
        })
      })
    })
  })
})
