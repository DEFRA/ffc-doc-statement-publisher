let mockSendMessage = jest.fn()
let mockCloseConnection = jest.fn()
jest.mock('ffc-messaging', () => {
  return {
    MessageSender: jest.fn().mockImplementation(() => {
      return {
        sendMessage: mockSendMessage,
        closeConnection: mockCloseConnection
      }
    })
  }
})

jest.mock('../../../app/messaging/create-message')
const createMessage = require('../../../app/messaging/create-message')

const { CRM: CRM_MESSAGE_TYPE } = require('../../../app/constants/message-types')
const SOURCE = require('../../../app/constants/message-source')

const sendMessage = require('../../../app/messaging/send-message')

const body = 'Hello World!'
const config = {}

describe('Send message', () => {
  beforeEach(() => {
    mockSendMessage = jest.fn()
    mockCloseConnection = jest.fn()

    createMessage.mockReturnValue({
      body,
      CRM_MESSAGE_TYPE,
      source: SOURCE
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should call createMessage', async () => {
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(createMessage).toHaveBeenCalled()
  })

  test('should call createMessage once', async () => {
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(createMessage).toHaveBeenCalledTimes(1)
  })

  test('should call createMessage with body and CRM_MESSAGE_TYPE', async () => {
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(createMessage).toHaveBeenCalledWith(body, CRM_MESSAGE_TYPE)
  })

  test('should call mockSendMessage', async () => {
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(mockSendMessage).toHaveBeenCalled()
  })

  test('should call mockSendMessage once', async () => {
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })

  test('should call mockSendMessage with createMessage return value', async () => {
    const message = createMessage()
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(mockSendMessage).toHaveBeenCalledWith(message)
  })

  test('should call mockCloseConnection', async () => {
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(mockCloseConnection).toHaveBeenCalled()
  })

  test('should call mockCloseConnection once', async () => {
    await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(mockCloseConnection).toHaveBeenCalledTimes(1)
  })

  test('should return undefined', async () => {
    const result = await sendMessage(body, CRM_MESSAGE_TYPE, config)
    expect(result).toBeUndefined()
  })

  test('should throw error when mockSendMessage throws error ', async () => {
    mockSendMessage.mockRejectedValue(new Error('FFC Messaging issue sending message'))

    const wrapper = async () => {
      await sendMessage(body, CRM_MESSAGE_TYPE, config)
    }

    expect(wrapper).rejects.toThrow()
  })

  test('should throw Error when mockSendMessage throws Error', async () => {
    mockSendMessage.mockRejectedValue(new Error('FFC Messaging issue sending message'))

    const wrapper = async () => {
      await sendMessage(body, CRM_MESSAGE_TYPE, config)
    }

    expect(wrapper).rejects.toThrow(Error)
  })

  test('should throw error with "FFC Messaging issue sending message" when mockSendMessage throws error with "FFC Messaging issue sending message"', async () => {
    mockSendMessage.mockRejectedValue(new Error('FFC Messaging issue sending message'))

    const wrapper = async () => {
      await sendMessage(body, CRM_MESSAGE_TYPE, config)
    }

    expect(wrapper).rejects.toThrow(/^FFC Messaging issue sending message$/)
  })

  test('should throw error when mockCloseConnection throws error ', async () => {
    mockCloseConnection.mockRejectedValue(new Error('FFC Messaging issue closing connection'))

    const wrapper = async () => {
      await sendMessage(body, CRM_MESSAGE_TYPE, config)
    }

    expect(wrapper).rejects.toThrow()
  })

  test('should throw error with "FFC Messaging issue closing connection" when mockCloseConnection throws error with "FFC Messaging issue closing connection"', async () => {
    mockCloseConnection.mockRejectedValue(new Error('FFC Messaging issue closing connection'))

    const wrapper = async () => {
      await sendMessage(body, CRM_MESSAGE_TYPE, config)
    }

    expect(wrapper).rejects.toThrow(/^FFC Messaging issue closing connection$/)
  })
})
