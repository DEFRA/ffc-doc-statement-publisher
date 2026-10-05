const { getSender } = require('../../../app/messaging/service-bus/sender-cache')
const { sendMessage: sbSendMessage } = require('../../../app/messaging/service-bus/send-message')

jest.mock('../../../app/messaging/service-bus/sender-cache')
jest.mock('../../../app/messaging/service-bus/send-message')

jest.mock('../../../app/messaging/create-message')
const createMessage = require('../../../app/messaging/create-message')

const { CRM: CRM_MESSAGE_TYPE } = require('../../../app/constants/message-types')
const SOURCE = require('../../../app/constants/message-source')

const sendMessage = require('../../../app/messaging/send-message')

const body = 'Hello World!'
const config = { address: 'crm-topic' }
const mockSender = { sendMessages: jest.fn() }

describe('sendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getSender.mockReturnValue(mockSender)
    createMessage.mockReturnValue({ body, type: CRM_MESSAGE_TYPE, source: SOURCE })
  })

  test('createMessage called with body and type', async () => {
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(createMessage).toHaveBeenCalledWith(body, CRM_MESSAGE_TYPE)
  })

  test('gets sender from cache with config', async () => {
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(getSender).toHaveBeenCalledTimes(1)
    expect(getSender).toHaveBeenCalledWith(config)
  })

  test('sends message using service-bus sendMessage', async () => {
    const message = createMessage()
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(sbSendMessage).toHaveBeenCalledTimes(1)
    expect(sbSendMessage).toHaveBeenCalledWith(mockSender, message)
  })

  test('returns undefined', async () => {
    const result = await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(result).toBeUndefined()
  })

  describe('error handling', () => {
    test('throws when service-bus sendMessage fails', async () => {
      sbSendMessage.mockRejectedValue(new Error('Service Bus issue sending message'))
      await expect(sendMessage(body, CRM_MESSAGE_TYPE, config)).rejects.toThrow(/^Service Bus issue sending message$/)
    })
  })
})
