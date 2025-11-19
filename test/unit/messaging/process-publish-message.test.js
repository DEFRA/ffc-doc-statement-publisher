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

describe('processPublishMessage', () => {
  beforeEach(() => {
    receiver = mockMessageReceiver()
    receiver.abandonMessage = jest.fn()

    publishStatement.mockResolvedValue(undefined)
    getRequestEmailTemplateByType.mockReturnValue(EMAIL_TEMPLATE)

    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
    console.log.mockRestore()
    console.error.mockRestore()
  })

  describe.each([
    { name: 'statement', message: structuredClone(require('../../mocks/messages/publish').STATEMENT_MESSAGE) }
  ])('when message is a $name', ({ message }) => {
    describe('when successful', () => {
      beforeEach(async () => {
        validateRequest.mockReturnValue({ value: message })
      })

      test.each([
        ['validateRequest', () => expect(validateRequest).toHaveBeenCalled()],
        ['validateRequest once', () => expect(validateRequest).toHaveBeenCalledTimes(1)],
        ['validateRequest with message.body', () => expect(validateRequest).toHaveBeenCalledWith(message.body)],
        ['getRequestEmailTemplateByType', () => expect(getRequestEmailTemplateByType).toHaveBeenCalled()],
        ['getRequestEmailTemplateByType with correct parameters', () => expect(getRequestEmailTemplateByType).toHaveBeenCalledWith(message.applicationProperties.type, documentTypes)],
        ['publishStatement', () => expect(publishStatement).toHaveBeenCalled()],
        ['publishStatement once', () => expect(publishStatement).toHaveBeenCalledTimes(1)],
        ['completeMessage', () => expect(receiver.completeMessage).toHaveBeenCalled()],
        ['completeMessage once', () => expect(receiver.completeMessage).toHaveBeenCalledTimes(1)],
        ['completeMessage with message', () => expect(receiver.completeMessage).toHaveBeenCalledWith(message)]
      ])('should call %s', async (_, assertion) => {
        await processPublishMessage(message, receiver)
        assertion()
      })

      test('should call publishStatement with modified message.body', async () => {
        await processPublishMessage(message, receiver)
        const expectedBody = { ...message.body, emailTemplate: EMAIL_TEMPLATE }
        expect(publishStatement).toHaveBeenCalledWith(expectedBody)
      })

      test.each([
        ['deadLetterMessage', () => expect(receiver.deadLetterMessage).not.toHaveBeenCalled()],
        ['abandonMessage', () => expect(receiver.abandonMessage).not.toHaveBeenCalled()]
      ])('should not call %s', async (_, assertion) => {
        await processPublishMessage(message, receiver)
        assertion()
      })
    })

    describe('when unsuccessful and a non-validation issue', () => {
      beforeEach(() => {
        publishStatement.mockRejectedValue(new Error('Issue publishing statement'))
      })

      test.each([
        ['validateRequest', () => expect(validateRequest).toHaveBeenCalled()],
        ['validateRequest once', () => expect(validateRequest).toHaveBeenCalledTimes(1)],
        ['validateRequest with message.body', () => expect(validateRequest).toHaveBeenCalledWith(message.body)],
        ['getRequestEmailTemplateByType', () => expect(getRequestEmailTemplateByType).toHaveBeenCalled()],
        ['publishStatement', () => expect(publishStatement).toHaveBeenCalled()],
        ['publishStatement once', () => expect(publishStatement).toHaveBeenCalledTimes(1)]
      ])('should call %s', async (_, assertion) => {
        await processPublishMessage(message, receiver)
        assertion()
      })

      test('should call publishStatement with modified message.body', async () => {
        await processPublishMessage(message, receiver)
        const expectedBody = { ...message.body, emailTemplate: EMAIL_TEMPLATE }
        expect(publishStatement).toHaveBeenCalledWith(expectedBody)
      })

      test.each([
        ['completeMessage', () => expect(receiver.completeMessage).not.toHaveBeenCalled()],
        ['deadLetterMessage', () => expect(receiver.deadLetterMessage).not.toHaveBeenCalled()],
        ['abandonMessage', () => expect(receiver.abandonMessage).toHaveBeenCalled()],
        ['abandonMessage once', () => expect(receiver.abandonMessage).toHaveBeenCalledTimes(1)],
        ['abandonMessage with message', () => expect(receiver.abandonMessage).toHaveBeenCalledWith(message)]
      ])('should handle %s correctly', async (_, assertion) => {
        await processPublishMessage(message, receiver)
        assertion()
      })
    })

    describe('when unsuccessful and a validation issue', () => {
      beforeEach(() => {
        const error = new Error('Invalid request')
        error.category = VALIDATION
        validateRequest.mockImplementation(() => {
          throw error
        })
      })

      test.each([
        ['validateRequest', () => expect(validateRequest).toHaveBeenCalled()],
        ['validateRequest once', () => expect(validateRequest).toHaveBeenCalledTimes(1)],
        ['validateRequest with message.body', () => expect(validateRequest).toHaveBeenCalledWith(message.body)]
      ])('should call %s', async (_, assertion) => {
        await processPublishMessage(message, receiver)
        assertion()
      })

      test.each([
        ['getRequestEmailTemplateByType', () => expect(getRequestEmailTemplateByType).not.toHaveBeenCalled()],
        ['publishStatement', () => expect(publishStatement).not.toHaveBeenCalled()],
        ['completeMessage', () => expect(receiver.completeMessage).not.toHaveBeenCalled()],
        ['abandonMessage', () => expect(receiver.abandonMessage).not.toHaveBeenCalled()]
      ])('should not call %s', async (_, assertion) => {
        await processPublishMessage(message, receiver)
        assertion()
      })

      test.each([
        ['deadLetterMessage', () => expect(receiver.deadLetterMessage).toHaveBeenCalled()],
        ['deadLetterMessage once', () => expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)],
        ['deadLetterMessage with message', () => expect(receiver.deadLetterMessage).toHaveBeenCalledWith(message)]
      ])('should call %s', async (_, assertion) => {
        await processPublishMessage(message, receiver)
        assertion()
      })
    })
  })
})
