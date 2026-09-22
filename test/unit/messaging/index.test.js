const mockPublishSubscription = { host: 'test-host', address: 'test-publish', topic: 'test-publish-topic', type: 'subscription' }
const mockRetentionSubscription = { host: 'test-host', address: 'test-retention', topic: 'test-retention-topic', type: 'subscription' }

jest.mock('../../../app/config', () => ({
  publishSubscription: mockPublishSubscription,
  retentionSubscription: mockRetentionSubscription
}))

jest.mock('../../../app/messaging/service-bus', () => ({
  createServiceBusClient: jest.fn(),
  createReceiver: jest.fn(),
  subscribeReceiver: jest.fn(),
  closeSenders: jest.fn()
}))

jest.mock('../../../app/data', () => ({}))
jest.mock('../../../app/alert', () => ({
  sendAlert: jest.fn()
}))
jest.mock('../../../app/messaging/process-publish-message', () => jest.fn())
jest.mock('../../../app/messaging/process-retention-message', () => ({
  processRetentionMessage: jest.fn()
}))

const config = require('../../../app/config')
const serviceBus = require('../../../app/messaging/service-bus')
const { sendAlert } = require('../../../app/alert')
const processPublishMessage = require('../../../app/messaging/process-publish-message')

const messageService = require('../../../app/messaging')

describe('messaging', () => {
  let mockReceiver

  beforeEach(() => {
    jest.clearAllMocks()
    mockReceiver = { close: jest.fn().mockResolvedValue() }
    serviceBus.createServiceBusClient.mockReturnValue({ close: jest.fn().mockResolvedValue() })
    serviceBus.createReceiver.mockReturnValue(mockReceiver)
    serviceBus.subscribeReceiver.mockReturnValue()
  })

  afterAll(async () => {
    await messageService.stop()
  })

  test('should start successfully and create all receivers including retention receiver', async () => {
    await messageService.start()

    const publishConfig = {
      ...config.publishSubscription,
      maxConcurrentCalls: 5,
      autoCompleteMessages: false
    }

    expect(serviceBus.createServiceBusClient).toHaveBeenCalledTimes(1)
    expect(serviceBus.createServiceBusClient).toHaveBeenCalledWith(config.publishSubscription)
    expect(serviceBus.createReceiver).toHaveBeenCalledTimes(2)
    expect(serviceBus.createReceiver).toHaveBeenNthCalledWith(1, expect.anything(), publishConfig)
    expect(serviceBus.createReceiver).toHaveBeenNthCalledWith(2, expect.anything(), config.retentionSubscription)
    expect(serviceBus.subscribeReceiver).toHaveBeenCalledTimes(2)
    expect(serviceBus.subscribeReceiver).toHaveBeenNthCalledWith(1, mockReceiver, expect.any(Function), expect.any(Function), publishConfig)
    expect(serviceBus.subscribeReceiver).toHaveBeenNthCalledWith(2, mockReceiver, expect.any(Function), expect.any(Function), config.retentionSubscription)
  })

  test('should throw and send alert when any receiver subscribe fails', async () => {
    serviceBus.subscribeReceiver.mockImplementation(() => {
      throw new Error('Subscribe failed')
    })

    await expect(messageService.start()).rejects.toThrow('Subscribe failed')
    expect(sendAlert).toHaveBeenCalledWith(
      'messaging',
      expect.any(Error),
      expect.stringContaining('Messaging service failed to start')
    )
  })

  test('should send alert when publishAction fails during message processing', async () => {
    const mockMessage = { body: 'test' }
    processPublishMessage.mockRejectedValue(new Error('Processing failed'))

    await messageService.start()

    const publishAction = serviceBus.subscribeReceiver.mock.calls[0][1]
    await publishAction(mockMessage, mockReceiver)

    expect(processPublishMessage).toHaveBeenCalledWith(mockMessage, mockReceiver)
    expect(sendAlert).toHaveBeenCalledWith(
      'messaging',
      mockMessage,
      expect.stringContaining('Error processing message')
    )
  })
})
