jest.mock('ffc-messaging', () => ({
  MessageReceiver: jest.fn().mockImplementation(() => ({
    subscribe: jest.fn(),
    closeConnection: jest.fn()
  }))
}))

jest.mock('../../../app/data')
jest.mock('../../../app/alert', () => ({
  sendAlert: jest.fn()
}))
jest.mock('../../../app/messaging/process-publish-message')

const messageService = require('../../../app/messaging')
const { MessageReceiver } = require('ffc-messaging')
const { sendAlert } = require('../../../app/alert')
const processPublishMessage = require('../../../app/messaging/process-publish-message')

describe('messaging', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await messageService.stop()
  })

  test('should start successfully', async () => {
    await messageService.start()
    expect(MessageReceiver).toHaveBeenCalledTimes(3)
  })

  test('should throw and send alert when receiver subscribe fails', async () => {
    MessageReceiver.mockImplementation(() => ({
      subscribe: jest.fn().mockRejectedValue(new Error('Subscribe failed')),
      closeConnection: jest.fn()
    }))

    await expect(messageService.start()).rejects.toThrow('Subscribe failed')
    expect(sendAlert).toHaveBeenCalledWith(
      'messaging',
      expect.any(Error),
      expect.stringContaining('Messaging service failed to start')
    )
  })

  test('should send alert when publishAction fails during message processing', async () => {
    const mockMessage = { body: 'test' }
    const mockReceiver = { subscribe: jest.fn(), closeConnection: jest.fn() }
    MessageReceiver.mockImplementation(() => mockReceiver)
    processPublishMessage.mockRejectedValue(new Error('Processing failed'))

    await messageService.start()

    const publishAction = MessageReceiver.mock.calls[0][1]
    await publishAction(mockMessage)

    expect(sendAlert).toHaveBeenCalledWith(
      'messaging',
      mockMessage,
      expect.stringContaining('Error processing message')
    )
  })
})
