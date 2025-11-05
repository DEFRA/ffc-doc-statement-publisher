jest.mock('../../../app/messaging/validate-request')
const validateRequest = require('../../../app/messaging/validate-request')

jest.mock('../../../app/publishing/publish-statement')
const publishStatement = require('../../../app/publishing/publish-statement')

jest.mock('../../../app/messaging/get-request-email-template-by-type')
const getRequestEmailTemplateByType = require('../../../app/messaging/get-request-email-template-by-type')

const { mockMessageReceiver } = require('../../mocks/modules/ffc-messaging')

const { VALIDATION } = require('../../../app/constants/errors')
const documentTypes = require('../../../app/constants/document-types')

const processPublishMessage = require('../../../app/messaging/process-publish-message')

const EMAIL_TEMPLATE = require('../../mocks/components/notify-template-id')

let receiver

describe('Process publish message', () => {
  beforeEach(() => {
    receiver = mockMessageReceiver()
    receiver.abandonMessage = jest.fn()

    publishStatement.mockResolvedValue(undefined)
    getRequestEmailTemplateByType.mockReturnValue(EMAIL_TEMPLATE)

    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.clearAllMocks()
    console.log.mockRestore()
    console.error.mockRestore()
  })

  describe.each([
    { name: 'statement', message: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').STATEMENT_MESSAGE)) }
  ])('When message is a $name', ({ name, message }) => {
    describe('When successful', () => {
      beforeEach(async () => {
        validateRequest.mockReturnValue({ value: message })
      })

      test('should call validateRequest', async () => {
        await processPublishMessage(message, receiver)
        expect(validateRequest).toHaveBeenCalled()
      })

      test('should call validateRequest once', async () => {
        await processPublishMessage(message, receiver)
        expect(validateRequest).toHaveBeenCalledTimes(1)
      })

      test('should call validateRequest with message.body', async () => {
        await processPublishMessage(message, receiver)
        expect(validateRequest).toHaveBeenCalledWith(message.body)
      })

      test('should call getRequestEmailTemplateByType', async () => {
        await processPublishMessage(message, receiver)
        expect(getRequestEmailTemplateByType).toHaveBeenCalled()
      })

      test('should call getRequestEmailTemplateByType with correct parameters', async () => {
        await processPublishMessage(message, receiver)
        expect(getRequestEmailTemplateByType).toHaveBeenCalledWith(message.applicationProperties.type, documentTypes)
      })

      test('should add emailTemplate to request', async () => {
        await processPublishMessage(message, receiver)
        expect(publishStatement).toHaveBeenCalledWith({
          ...message.body,
          emailTemplate: EMAIL_TEMPLATE
        })
      })

      test('should call publishStatement', async () => {
        await processPublishMessage(message, receiver)
        expect(publishStatement).toHaveBeenCalled()
      })

      test('should call publishStatement once', async () => {
        await processPublishMessage(message, receiver)
        expect(publishStatement).toHaveBeenCalledTimes(1)
      })

      test('should call publishStatement with modified message.body', async () => {
        await processPublishMessage(message, receiver)
        const expectedBody = {
          ...message.body,
          emailTemplate: EMAIL_TEMPLATE
        }
        expect(publishStatement).toHaveBeenCalledWith(expectedBody)
      })

      test('should call completeMessage', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.completeMessage).toHaveBeenCalled()
      })

      test('should call completeMessage once', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
      })

      test('should call completeMessage with message', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.completeMessage).toHaveBeenCalledWith(message)
      })

      test('should not call deadLetterMessage', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
      })

      test('should not call abandonMessage', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.abandonMessage).not.toHaveBeenCalled()
      })
    })

    describe('When unsuccessful and a non-validation issue', () => {
      beforeEach(() => {
        publishStatement.mockRejectedValue(new Error('Issue publishing statement'))
      })

      test('should call validateRequest', async () => {
        await processPublishMessage(message, receiver)
        expect(validateRequest).toHaveBeenCalled()
      })

      test('should call validateRequest once', async () => {
        await processPublishMessage(message, receiver)
        expect(validateRequest).toHaveBeenCalledTimes(1)
      })

      test('should call validateRequest with message.body', async () => {
        await processPublishMessage(message, receiver)
        expect(validateRequest).toHaveBeenCalledWith(message.body)
      })

      test('should call getRequestEmailTemplateByType', async () => {
        await processPublishMessage(message, receiver)
        expect(getRequestEmailTemplateByType).toHaveBeenCalled()
      })

      test('should call publishStatement', async () => {
        await processPublishMessage(message, receiver)
        expect(publishStatement).toHaveBeenCalled()
      })

      test('should call publishStatement once', async () => {
        await processPublishMessage(message, receiver)
        expect(publishStatement).toHaveBeenCalledTimes(1)
      })

      test('should call publishStatement with modified message.body', async () => {
        await processPublishMessage(message, receiver)
        const expectedBody = {
          ...message.body,
          emailTemplate: EMAIL_TEMPLATE
        }
        expect(publishStatement).toHaveBeenCalledWith(expectedBody)
      })

      test('should not call completeMessage', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.completeMessage).not.toHaveBeenCalled()
      })

      test('should not call deadLetterMessage', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
      })

      test('should call abandonMessage', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.abandonMessage).toHaveBeenCalled()
      })

      test('should call abandonMessage once', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.abandonMessage).toHaveBeenCalledTimes(1)
      })

      test('should call abandonMessage with message', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.abandonMessage).toHaveBeenCalledWith(message)
      })
    })

    describe('When unsuccessful and a validation issue', () => {
      beforeEach(() => {
        const error = new Error('Invalid request')
        error.category = VALIDATION
        validateRequest.mockImplementation(() => { throw error })
      })

      test('should call validateRequest', async () => {
        await processPublishMessage(message, receiver)
        expect(validateRequest).toHaveBeenCalled()
      })

      test('should call validateRequest once', async () => {
        await processPublishMessage(message, receiver)
        expect(validateRequest).toHaveBeenCalledTimes(1)
      })

      test('should call validateRequest with message.body', async () => {
        await processPublishMessage(message, receiver)
        expect(validateRequest).toHaveBeenCalledWith(message.body)
      })

      test('should not call getRequestEmailTemplateByType', async () => {
        await processPublishMessage(message, receiver)
        expect(getRequestEmailTemplateByType).not.toHaveBeenCalled()
      })

      test('should not call publishStatement', async () => {
        await processPublishMessage(message, receiver)
        expect(publishStatement).not.toHaveBeenCalled()
      })

      test('should call deadLetterMessage', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.deadLetterMessage).toHaveBeenCalled()
      })

      test('should call deadLetterMessage once', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
      })

      test('should call deadLetterMessage with message', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.deadLetterMessage).toHaveBeenCalledWith(message)
      })

      test('should not call completeMessage', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.completeMessage).not.toHaveBeenCalled()
      })

      test('should not call abandonMessage', async () => {
        await processPublishMessage(message, receiver)
        expect(receiver.abandonMessage).not.toHaveBeenCalled()
      })
    })
  })
})
