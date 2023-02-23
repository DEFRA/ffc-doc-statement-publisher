jest.mock('../../../app/publishing/publish-statement')
const publishStatement = require('../../../app/publishing/publish-statement')

jest.mock('../../../app/messaging/validate-request')
const validateRequest = require('../../../app/messaging/validate-request')

const processPublishMessage = require('../../../app/messaging/process-publish-message')

const mockRequest = require('../../mocks/request')
const { VALIDATION } = require('../../../app/constants/errors')

let receiver
let message

describe('Process publish message', () => {
  beforeEach(() => {
    receiver = {
      completeMessage: jest.fn(),
      deadLetterMessage: jest.fn()
    }

    publishStatement.mockResolvedValue(undefined)
    validateRequest.mockReturnValue({ value: 'a' })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('When successful message', () => {
    beforeEach(() => {
      message = {
        body: mockRequest
      }
    })

    test('completes message on success', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.completeMessage).toHaveBeenCalledWith(message)
    })

    test('completes message on success only once', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    })

    test('calls validateRequest only once', async () => {
      await processPublishMessage(message, receiver)
      expect(validateRequest).toHaveBeenCalledTimes(1)
    })

    test('calls validateRequest', async () => {
      await processPublishMessage(message, receiver)
      expect(validateRequest).toHaveBeenCalledWith(message.body)
    })

    test('calls publishStatement with request only once', async () => {
      await processPublishMessage(message, receiver)
      expect(publishStatement).toHaveBeenCalledTimes(1)
    })

    test('calls publishStatement with statement', async () => {
      await processPublishMessage(message, receiver)
      expect(publishStatement).toHaveBeenCalledWith(message.body)
    })
  })

  describe('When unsuccessful message is non-validation issue', () => {
    beforeEach(() => {
      publishStatement.mockRejectedValue(new Error('Issue publishing statement'))
    })

    test('does not complete message', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.completeMessage).not.toHaveBeenCalled()
    })

    test('does not dead letter message', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
    })
  })

  describe('When unsuccessful message is validation issue', () => {
    beforeEach(() => {
      const error = new Error('Invalid request')
      error.category = VALIDATION
      validateRequest.mockImplementation(() => { throw error })
    })

    test('dead letters message', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.deadLetterMessage).toHaveBeenCalledWith(message)
    })

    test('dead letters message only once', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
    })

    test('does not complete message', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.completeMessage).not.toHaveBeenCalled()
    })
  })
})
