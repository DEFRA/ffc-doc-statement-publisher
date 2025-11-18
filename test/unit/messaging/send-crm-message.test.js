const config = { crmTopic: 'mockCRMTopic' }
jest.mock('../../../app/config', () => config)

jest.mock('../../../app/processing/crm/get-message')
const getMessage = require('../../../app/processing/crm/get-message')

jest.mock('../../../app/messaging/send-message')
const sendMessage = require('../../../app/messaging/send-message')

const sendCrmMessage = require('../../../app/messaging/send-crm-message')
const { CRM: CRM_MESSAGE_TYPE } = require('../../../app/constants/message-types')
const { EMPTY, INVALID, REJECTED } = require('../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_MESSAGE, INVALID: INVALID_MESSAGE } = require('../../mocks/messages/crm')

let email, frn, reason, message

describe('sendCrmMessage', () => {
  beforeEach(() => {
    email = require('../../mocks/components/email')
    frn = require('../../mocks/components/frn')
    getMessage.mockReturnValue(message)
    sendMessage.mockResolvedValue(undefined)
  })

  afterEach(() => jest.clearAllMocks())

  describe.each([
    ['EMPTY', EMPTY, EMPTY_MESSAGE],
    ['INVALID', INVALID, INVALID_MESSAGE],
    ['REJECTED', REJECTED, INVALID_MESSAGE]
  ])('when reason is %s', (_, reasonValue, messageMock) => {
    beforeEach(() => {
      reason = reasonValue
      message = messageMock
      getMessage.mockReturnValue(message)
    })

    test('calls getMessage once with email, frn, reason', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalledTimes(1)
      expect(getMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('calls sendMessage once with correct args', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(message, CRM_MESSAGE_TYPE, config.crmTopic)
    })

    test('does not throw', async () => {
      await expect(sendCrmMessage(email, frn, reason)).resolves.not.toThrow()
    })

    test('returns undefined', async () => {
      const result = await sendCrmMessage(email, frn, reason)
      expect(result).toBeUndefined()
    })
  })

  describe('when getMessage throws', () => {
    beforeEach(() => {
      getMessage.mockImplementation(() => { throw new Error('Invalid message') })
    })

    test('calls getMessage once with correct args', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(getMessage).toHaveBeenCalledTimes(1)
      expect(getMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('does not call sendMessage', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(sendMessage).not.toHaveBeenCalled()
    })

    test('throws correct error', async () => {
      await expect(sendCrmMessage(email, frn, reason))
        .rejects.toThrow(/^Invalid message$/)
    })
  })

  describe('when Service Bus send fails', () => {
    beforeEach(() => {
      sendMessage.mockRejectedValue(new Error('Issue sending the message via Service Bus'))
      getMessage.mockReturnValue(INVALID_MESSAGE)
    })

    test('calls getMessage and sendMessage once with correct args', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(getMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(INVALID_MESSAGE, CRM_MESSAGE_TYPE, config.crmTopic)
    })

    test('throws correct error', async () => {
      await expect(sendCrmMessage(email, frn, reason))
        .rejects.toThrow(/^Issue sending the message via Service Bus$/)
    })
  })
})
