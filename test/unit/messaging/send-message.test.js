let mockSendMessage = jest.fn()
let mockCloseConnection = jest.fn()

jest.mock('ffc-messaging', () => ({
  MessageSender: jest.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
    closeConnection: mockCloseConnection
  }))
}))

jest.mock('../../../app/messaging/create-message')
const createMessage = require('../../../app/messaging/create-message')

const { CRM: CRM_MESSAGE_TYPE } = require('../../../app/constants/message-types')
const SOURCE = require('../../../app/constants/message-source')

const sendMessage = require('../../../app/messaging/send-message')

const body = 'Hello World!'
const config = {}

describe('sendMessage', () => {
  beforeEach(() => {
    mockSendMessage = jest.fn()
    mockCloseConnection = jest.fn()
    createMessage.mockReturnValue({ body, type: CRM_MESSAGE_TYPE, source: SOURCE })
  })

  afterEach(() => jest.clearAllMocks())

  describe('successful send', () => {
    test.each([
      ['createMessage', () => expect(createMessage).toHaveBeenCalled(), () => expect(createMessage).toHaveBeenCalledTimes(1)],
      ['mockSendMessage', () => expect(mockSendMessage).toHaveBeenCalled(), () => expect(mockSendMessage).toHaveBeenCalledTimes(1)],
      ['mockCloseConnection', () => expect(mockCloseConnection).toHaveBeenCalled(), () => expect(mockCloseConnection).toHaveBeenCalledTimes(1)]
    ])('%s called', async (_, callCheck, callTimes) => {
      await sendMessage(body, CRM_MESSAGE_TYPE, config)
      callCheck()
      callTimes()
    })

    test('createMessage called with body and CRM_MESSAGE_TYPE', async () => {
      await sendMessage(body, CRM_MESSAGE_TYPE, config)
      expect(createMessage).toHaveBeenCalledWith(body, CRM_MESSAGE_TYPE)
    })

    test('mockSendMessage called with createMessage return value', async () => {
      const messageReturn = createMessage()
      await sendMessage(body, CRM_MESSAGE_TYPE, config)
      expect(mockSendMessage).toHaveBeenCalledWith(messageReturn)
    })

    test('returns undefined', async () => {
      const result = await sendMessage(body, CRM_MESSAGE_TYPE, config)
      expect(result).toBeUndefined()
    })
  })

  describe('error handling', () => {
    test.each([
      ['mockSendMessage', () => { mockSendMessage.mockRejectedValue(new Error('FFC Messaging issue sending message')) }, /^FFC Messaging issue sending message$/],
      ['mockCloseConnection', () => { mockCloseConnection.mockRejectedValue(new Error('FFC Messaging issue closing connection')) }, /^FFC Messaging issue closing connection$/]
    ])('%s throws correct error', async (_, setupMock, expectedError) => {
      setupMock()
      await expect(sendMessage(body, CRM_MESSAGE_TYPE, config)).rejects.toThrow(expectedError)
    })
  })
})
