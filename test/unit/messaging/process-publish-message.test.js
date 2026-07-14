jest.mock('../../../app/messaging/validate-request')
const validateRequest = require('../../../app/messaging/validate-request')

jest.mock('../../../app/publishing', () => ({ publishStatement: jest.fn() }))
const { publishStatement } = require('../../../app/publishing')

jest.mock('../../../app/messaging/get-request-email-template-by-type')
const getRequestEmailTemplateByType = require('../../../app/messaging/get-request-email-template-by-type')

jest.mock('../../../app/messaging/message-claim-helpers')
const { claimMessage, markClaimStatus, getClaimStatus } = require('../../../app/messaging/message-claim-helpers')

jest.mock('../../../app/alert', () => ({
  sendAlert: jest.fn()
}))
const { sendAlert } = require('../../../app/alert')

const { mockMessageReceiver } = require('../../mocks/modules/ffc-messaging')
const { VALIDATION } = require('../../../app/constants/errors')
const processPublishMessage = require('../../../app/messaging/process-publish-message')
const EMAIL_TEMPLATE = require('../../mocks/components/notify-template-id')

let receiver
let message

describe('processPublishMessage', () => {
  beforeEach(() => {
    receiver = mockMessageReceiver()
    receiver.abandonMessage = jest.fn()
    receiver.completeMessage = jest.fn()
    receiver.deadLetterMessage = jest.fn()

    message = structuredClone(require('../../mocks/messages/publish').STATEMENT_MESSAGE)

    publishStatement.mockResolvedValue(undefined)
    getRequestEmailTemplateByType.mockReturnValue(EMAIL_TEMPLATE)
    claimMessage.mockResolvedValue(true)
    markClaimStatus.mockResolvedValue(undefined)
    getClaimStatus.mockResolvedValue(null)
    sendAlert.mockImplementation(() => undefined)

    validateRequest.mockReturnValue({ value: message })

    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.clearAllMocks()
    console.log.mockRestore()
    console.error.mockRestore()
  })

  test('claims the message and completes it when processing succeeds', async () => {
    await processPublishMessage(message, receiver)

    const expectedMessageId = message.messageId || message.body.messageId || message.body.documentReference

    expect(claimMessage).toHaveBeenCalledWith(expectedMessageId, message.body.documentReference)
    expect(publishStatement).toHaveBeenCalledWith(expect.objectContaining({
      ...message.body,
      emailTemplate: EMAIL_TEMPLATE
    }))
    // completeMessage must be called before markClaimStatus to prevent stuck messages on lock expiry
    const completeOrder = receiver.completeMessage.mock.invocationCallOrder[0]
    const markOrder = markClaimStatus.mock.invocationCallOrder[0]
    expect(completeOrder).toBeLessThan(markOrder)
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
    expect(markClaimStatus).toHaveBeenCalledWith(expectedMessageId, 'completed')
    expect(receiver.abandonMessage).not.toHaveBeenCalled()
    expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
  })

  test('completes the Service Bus message when the claim already exists as completed', async () => {
    claimMessage.mockResolvedValue(false)
    getClaimStatus.mockResolvedValue('completed')

    await processPublishMessage(message, receiver)

    expect(publishStatement).not.toHaveBeenCalled()
    expect(markClaimStatus).not.toHaveBeenCalled()
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
    expect(receiver.abandonMessage).not.toHaveBeenCalled()
    expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
  })

  test('abandons the Service Bus message when the claim is held by another instance', async () => {
    claimMessage.mockResolvedValue(false)
    getClaimStatus.mockResolvedValue('processing')

    await processPublishMessage(message, receiver)

    expect(publishStatement).not.toHaveBeenCalled()
    expect(markClaimStatus).not.toHaveBeenCalled()
    expect(receiver.abandonMessage).toHaveBeenCalledWith(message)
    expect(receiver.completeMessage).not.toHaveBeenCalled()
    expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
  })

  test('marks the claim as failed and abandons the message for non-validation errors', async () => {
    publishStatement.mockRejectedValue(new Error('Issue publishing statement'))

    await processPublishMessage(message, receiver)

    const expectedMessageId = message.messageId || message.body.messageId || message.body.documentReference

    expect(markClaimStatus).toHaveBeenCalledWith(expectedMessageId, 'failed')
    expect(receiver.abandonMessage).toHaveBeenCalledWith(message)
    expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
  })

  test('marks the claim as failed and dead letters the message for validation errors', async () => {
    const error = new Error('Invalid request')
    error.category = VALIDATION
    validateRequest.mockImplementation(() => {
      throw error
    })

    await processPublishMessage(message, receiver)

    const expectedMessageId = message.messageId || message.body.messageId || message.body.documentReference

    expect(markClaimStatus).toHaveBeenCalledWith(expectedMessageId, 'failed')
    expect(receiver.deadLetterMessage).toHaveBeenCalledWith(message)
    expect(receiver.abandonMessage).not.toHaveBeenCalled()
  })
})
