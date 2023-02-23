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
    MessageSender: mockMessageSender
  }
})

module.exports = {
  mockMessageSender
}
