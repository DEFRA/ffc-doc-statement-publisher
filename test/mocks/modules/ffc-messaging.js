const mockCompleteMessage = jest.fn()
const mockDeadLetterConnection = jest.fn()

const mockMessageReceiver = jest.fn().mockImplementation(() => {
  return {
    completeMessage: mockCompleteMessage,
    deadLetterMessage: mockDeadLetterConnection
  }
})

const mockSendMessage = jest.fn()
const mockCloseConnection = jest.fn()

const mockMessageSender = jest.fn().mockImplementation(() => {
  return {
    sendMessage: mockSendMessage,
    closeConnection: mockCloseConnection
  }
})

jest.mock('ffc-messaging', () => {
  return {
    MessageReceiver: mockMessageReceiver,
    MessageSender: mockMessageSender
  }
})

module.exports = {
  mockMessageReceiver,
  mockMessageSender
}
