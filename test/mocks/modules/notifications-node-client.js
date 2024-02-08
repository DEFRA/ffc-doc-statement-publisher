const { confirmEmailAndRetentionPeriodSet } = require('../objects/notify-link-to-file')
const { NOTIFY_RESPONSE_DELIVERED } = require('../objects/notify-response')

const mockPrepareUpload = jest.fn().mockReturnValue(confirmEmailAndRetentionPeriodSet)
const mockSendEmail = jest.fn().mockResolvedValue(NOTIFY_RESPONSE_DELIVERED)

const mockNotifyClient = jest.fn().mockImplementation(() => {
  return {
    prepareUpload: mockPrepareUpload,
    sendEmail: mockSendEmail
  }
})

jest.mock('notifications-node-client', () => {
  return {
    NotifyClient: mockNotifyClient
  }
})

module.exports = {
  mockNotifyClient
}
