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
jest.mock('../../../app/messaging/process-retention-message', () => ({
  processRetentionMessage: jest.fn()
}))

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

  test('should start successfully and create all receivers including retention receiver', async () => {
    await messageService.start()
    expect(MessageReceiver).toHaveBeenCalledTimes(4)
    for (let i = 0; i < 3; i++) {
      expect(MessageReceiver.mock.calls[i][0]).toBe(require('../../../app/config').publishSubscription)
      expect(typeof MessageReceiver.mock.calls[i][1]).toBe('function')
      expect(MessageReceiver.mock.calls[i][2]).toEqual({
        maxConcurrentCalls: 10,
        receiveMode: 'peekLock'
      })
    }
    expect(MessageReceiver.mock.calls[3][0]).toBe(require('../../../app/config').retentionSubscription)
    expect(typeof MessageReceiver.mock.calls[3][1]).toBe('function')
  })

  test('should throw and send alert when any receiver subscribe fails', async () => {
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
