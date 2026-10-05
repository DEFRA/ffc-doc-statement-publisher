jest.mock('../../../app/messaging/service-bus/sender-cache', () => ({
  getSender: jest.fn(),
  closeSenders: jest.fn(),
  clearCache: jest.fn()
}))

const senderCache = require('../../../app/messaging/service-bus/sender-cache')
const mockSendMessages = jest.fn()
const mockSender = { sendMessages: mockSendMessages }

senderCache.getSender.mockReturnValue(mockSender)

module.exports = {
  mockGetSender: senderCache.getSender,
  mockSender,
  mockSendMessages
}
