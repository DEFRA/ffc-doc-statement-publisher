jest.mock('../../../app/publishing/get-personalisation')
const getPersonalisation = require('../../../app/publishing/get-personalisation')

jest.mock('../../../app/publishing/handle-publish-reasoning')
const handlePublishReasoning = require('../../../app/publishing/handle-publish-reasoning')

jest.mock('../../../app/publishing/publish')
const publish = require('../../../app/publishing/publish')

jest.mock('../../../app/publishing/save-request')
const saveRequest = require('../../../app/publishing/save-request')

jest.mock('../../../app/publishing/validate-email')
const validateEmail = require('../../../app/publishing/validate-email')

const publishStatement = require('../../../app/publishing/publish-statement')

const { EMPTY, INVALID } = require('../../../app/constants/failure-reasons')
const { EMAIL } = require('../../../app/constants/methods')

const NOTIFY_RESPONSE = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_DELIVERED))
const NOTIFY_ID = NOTIFY_RESPONSE.data.id
const MOCK_PERSONALISATION = {
  schemeName: 'Test Scheme',
  schemeShortName: 'TS',
  schemeYear: '2021',
  schemeFrequency: 'Monthly',
  businessName: 'Test Business'
}

let request
let error

describe('Publish incoming statement', () => {
  beforeEach(() => {
    request = JSON.parse(JSON.stringify(require('../../mocks/request')))
    error = undefined

    publish.mockResolvedValue(NOTIFY_RESPONSE)
    handlePublishReasoning.mockReturnValue(undefined)
    getPersonalisation.mockReturnValue(MOCK_PERSONALISATION)
    validateEmail.mockReturnValue({ value: request.email })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When statement has valid email', () => {
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
      expect(getPersonalisation).toHaveBeenCalledWith(request.scheme.name, request.scheme.shortName, request.scheme.year, request.scheme.frequency, request.businessName)
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
      expect(publish).toHaveBeenCalledWith(request.email, request.filename, MOCK_PERSONALISATION)
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
      expect(saveRequest).toHaveBeenCalledWith(request, NOTIFY_ID, EMAIL, handlePublishReasoning())
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

  describe('When validateEmail throws error with message "Email is invalid: Email cannot be empty."', () => {
    beforeEach(() => {
      error = new Error('Email is invalid: Email cannot be empty.')

      validateEmail.mockImplementation(() => { throw error })
      handlePublishReasoning.mockReturnValue(EMPTY)
    })

    test('should call validateEmail', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalled()
    })

    test('should call validateEmail once', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalledTimes(1)
    })

    test('should call validateEmail with request.email', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalledWith(request.email)
    })

    test('should not call getPersonalisation', async () => {
      try { await publishStatement(request) } catch {}
      expect(getPersonalisation).not.toHaveBeenCalled()
    })

    test('should not call publish', async () => {
      try { await publishStatement(request) } catch {}
      expect(publish).not.toHaveBeenCalled()
    })

    test('should call handlePublishReasoning', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalled()
    })

    test('should call handlePublishReasoning once', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalledTimes(1)
    })

    test('should call handlePublishReasoning with error', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalledWith(error)
    })

    test('should call saveRequest', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalled()
    })

    test('should call saveRequest once', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledTimes(1)
    })

    test('should call saveRequest with request, undefined, EMAIL and handlePublishReasoning', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledWith(request, undefined, EMAIL, handlePublishReasoning())
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

  describe('When validateEmail throws error with message "Email is invalid: The email provided is invalid."', () => {
    beforeEach(() => {
      error = new Error('Email is invalid: The email provided is invalid.')

      validateEmail.mockImplementation(() => { throw error })
      handlePublishReasoning.mockReturnValue(INVALID)
    })

    test('should call validateEmail', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalled()
    })

    test('should call validateEmail once', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalledTimes(1)
    })

    test('should call validateEmail with request.email', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalledWith(request.email)
    })

    test('should not call getPersonalisation', async () => {
      try { await publishStatement(request) } catch {}
      expect(getPersonalisation).not.toHaveBeenCalled()
    })

    test('should not call publish', async () => {
      try { await publishStatement(request) } catch {}
      expect(publish).not.toHaveBeenCalled()
    })

    test('should call handlePublishReasoning', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalled()
    })

    test('should call handlePublishReasoning once', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalledTimes(1)
    })

    test('should call handlePublishReasoning with error', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalledWith(error)
    })

    test('should call saveRequest', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalled()
    })

    test('should call saveRequest once', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledTimes(1)
    })

    test('should call saveRequest with request, undefined, EMAIL and handlePublishReasoning', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledWith(request, undefined, EMAIL, handlePublishReasoning())
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

  describe('When validateEmail throws error with message "This is not a known validation error message."', () => {
    beforeEach(() => {
      error = new Error('This is not a known validation error message.')

      validateEmail.mockImplementation(() => { throw error })
      handlePublishReasoning.mockReturnValue(undefined)
    })

    test('should call validateEmail', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalled()
    })

    test('should call validateEmail once', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalledTimes(1)
    })

    test('should call validateEmail with request.email', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalledWith(request.email)
    })

    test('should not call getPersonalisation', async () => {
      try { await publishStatement(request) } catch {}
      expect(getPersonalisation).not.toHaveBeenCalled()
    })

    test('should not call publish', async () => {
      try { await publishStatement(request) } catch {}
      expect(publish).not.toHaveBeenCalled()
    })

    test('should call handlePublishReasoning', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalled()
    })

    test('should call handlePublishReasoning once', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalledTimes(1)
    })

    test('should call handlePublishReasoning with error', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalledWith(error)
    })

    test('should call saveRequest', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalled()
    })

    test('should call saveRequest once', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledTimes(1)
    })

    test('should call saveRequest with request, undefined, EMAIL and handlePublishReasoning', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledWith(request, undefined, EMAIL, handlePublishReasoning())
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

  describe('When publish throws', () => {
    beforeEach(() => {
      error = new Error('Issue publishing statement.')

      publish.mockImplementation(() => { throw error })
    })

    test('should call validateEmail', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalled()
    })

    test('should call validateEmail once', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalledTimes(1)
    })

    test('should call validateEmail with request.email', async () => {
      try { await publishStatement(request) } catch {}
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
      expect(getPersonalisation).toHaveBeenCalledWith(request.scheme.name, request.scheme.shortName, request.scheme.year, request.scheme.frequency, request.businessName)
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
      expect(publish).toHaveBeenCalledWith(request.email, request.filename, MOCK_PERSONALISATION)
    })

    test('should call saveRequest', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalled()
    })

    test('should call saveRequest once', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledTimes(1)
    })

    test('should call saveRequest with request, undefined, EMAIL and handlePublishReasoning', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledWith(request, undefined, EMAIL, handlePublishReasoning())
    })

    test('should call handlePublishReasoning', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalled()
    })

    test('should call handlePublishReasoning once', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalledTimes(1)
    })

    test('should call handlePublishReasoning with error', async () => {
      try { await publishStatement(request) } catch {}
      expect(handlePublishReasoning).toHaveBeenCalledWith(error)
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

  describe('When saveRequest throws', () => {
    beforeEach(() => {
      saveRequest.mockRejectedValue(new Error('Issue saving down request.'))
    })

    test('should call validateEmail', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalled()
    })

    test('should call validateEmail once', async () => {
      try { await publishStatement(request) } catch {}
      expect(validateEmail).toHaveBeenCalledTimes(1)
    })

    test('should call validateEmail with request.email', async () => {
      try { await publishStatement(request) } catch {}
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
      expect(getPersonalisation).toHaveBeenCalledWith(request.scheme.name, request.scheme.shortName, request.scheme.year, request.scheme.frequency, request.businessName)
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
      expect(publish).toHaveBeenCalledWith(request.email, request.filename, MOCK_PERSONALISATION)
    })

    test('should call saveRequest', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalled()
    })

    test('should call saveRequest once', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledTimes(1)
    })

    test('should call saveRequest with request, NOTIFY_ID, EMAIL and handlePublishReasoning', async () => {
      try { await publishStatement(request) } catch {}
      expect(saveRequest).toHaveBeenCalledWith(request, NOTIFY_ID, EMAIL, handlePublishReasoning())
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
})
