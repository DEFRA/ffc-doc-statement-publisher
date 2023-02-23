const config = { crmTopic: 'mockCRMTopic' }
jest.mock('../../../app/config', () => {
  return config
})

jest.mock('../../../app/processing/crm/get-message')
const getMessage = require('../../../app/processing/crm/get-message')

jest.mock('../../../app/messaging/send-message')
const sendMessage = require('../../../app/messaging/send-message')

const sendCrmMessage = require('../../../app/messaging/send-crm-message')

const { CRM: CRM_MESSAGE_TYPE } = require('../../../app/constants/message-types')

const { EMPTY, INVALID, REJECTED } = require('../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_MESSAGE, INVALID: INVALID_MESSAGE } = require('../../mocks/messages/crm')

let email
let frn
let reason
let message

describe('Send invalid email message to CRM', () => {
  beforeEach(() => {
    email = require('../../mocks/components/email')
    frn = require('../../mocks/components/frn')

    getMessage.mockReturnValue(message)
    sendMessage.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When reason is EMPTY', () => {
    beforeEach(() => {
      reason = EMPTY
      message = EMPTY_MESSAGE

      getMessage.mockReturnValue(message)
    })

    test('should call getMessage', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalled()
    })

    test('should call getMessage once', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalledTimes(1)
    })

    test('should call getMessage with email, frn and reason', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('should call sendMessage', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalled()
    })

    test('should call sendMessage once', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalledTimes(1)
    })

    test('should call sendMessage with getMessage return value, CRM_MESSAGE_TYPE and object with config.crmTopic', async () => {
      const message = getMessage()
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalledWith(message, CRM_MESSAGE_TYPE, config.crmTopic)
    })

    test('should not throw', async () => {
      const wrapper = async () => { try { await sendCrmMessage(email, frn, reason) } catch {} }
      wrapper()
      expect(wrapper).not.toThrow()
    })

    test('should return undefined', async () => {
      const result = await sendCrmMessage(email, frn, reason)
      expect(result).toBeUndefined()
    })
  })

  describe('When reason is INVALID', () => {
    beforeEach(() => {
      reason = INVALID
      message = INVALID_MESSAGE

      getMessage.mockReturnValue(message)
    })

    test('should call getMessage', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalled()
    })

    test('should call getMessage once', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalledTimes(1)
    })

    test('should call getMessage with email, frn and reason', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('should call sendMessage', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalled()
    })

    test('should call sendMessage once', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalledTimes(1)
    })

    test('should call sendMessage with getMessage return value, CRM_MESSAGE_TYPE and object with config.crmTopic', async () => {
      const message = getMessage()
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalledWith(message, CRM_MESSAGE_TYPE, config.crmTopic)
    })

    test('should not throw', async () => {
      const wrapper = async () => { try { await sendCrmMessage(email, frn, reason) } catch {} }
      wrapper()
      expect(wrapper).not.toThrow()
    })

    test('should return undefined', async () => {
      const result = await sendCrmMessage(email, frn, reason)
      expect(result).toBeUndefined()
    })
  })

  describe('When reason is REJECTED', () => {
    beforeEach(() => {
      reason = REJECTED
      message = INVALID_MESSAGE

      getMessage.mockReturnValue(message)
    })

    test('should call getMessage', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalled()
    })

    test('should call getMessage once', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalledTimes(1)
    })

    test('should call getMessage with email, frn and reason', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(getMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('should call sendMessage', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalled()
    })

    test('should call sendMessage once', async () => {
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalledTimes(1)
    })

    test('should call sendMessage with getMessage return value, CRM_MESSAGE_TYPE and object with config.crmTopic', async () => {
      const message = getMessage()
      await sendCrmMessage(email, frn, reason)
      expect(sendMessage).toHaveBeenCalledWith(message, CRM_MESSAGE_TYPE, config.crmTopic)
    })

    test('should not throw', async () => {
      const wrapper = async () => { try { await sendCrmMessage(email, frn, reason) } catch {} }
      wrapper()
      expect(wrapper).not.toThrow()
    })

    test('should return undefined', async () => {
      const result = await sendCrmMessage(email, frn, reason)
      expect(result).toBeUndefined()
    })
  })

  describe('When incoming message is invalid', () => {
    beforeEach(() => {
      getMessage.mockImplementation(() => { throw new Error('Invalid message') })
    })

    test('should call getMessage', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(getMessage).toHaveBeenCalled()
    })

    test('should call getMessage once', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(getMessage).toHaveBeenCalledTimes(1)
    })

    test('should call getMessage with email, frn and reason', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(getMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('should not call sendMessage', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(sendMessage).not.toHaveBeenCalled()
    })

    test('should throw', async () => {
      const wrapper = async () => { await sendCrmMessage(email, frn, reason) }
      expect(wrapper).rejects.toThrow()
    })

    test('should throw Error', async () => {
      const wrapper = async () => { await sendCrmMessage(email, frn, reason) }
      expect(wrapper).rejects.toThrow(Error)
    })

    test('should throw error "Invalid message"', async () => {
      const wrapper = async () => { await sendCrmMessage(email, frn, reason) }
      expect(wrapper).rejects.toThrow(/^Invalid message$/)
    })
  })

  describe('When Service Bus fails to send', () => {
    beforeEach(() => {
      sendMessage.mockRejectedValue(new Error('Issue sending the message via Service Bus'))
    })

    test('should call getMessage', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(getMessage).toHaveBeenCalled()
    })

    test('should call getMessage once', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(getMessage).toHaveBeenCalledTimes(1)
    })

    test('should call getMessage with email, frn, reason', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(getMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('should call sendMessage', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(sendMessage).toHaveBeenCalled()
    })

    test('should call sendMessage once', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(sendMessage).toHaveBeenCalledTimes(1)
    })

    test('should call sendMessage with getMessage return value, CRM_MESSAGE_TYPE and object with config.crmTopic', async () => {
      const message = getMessage()
      try { await sendCrmMessage(email, frn, reason) } catch {}
      expect(sendMessage).toHaveBeenCalledWith(message, CRM_MESSAGE_TYPE, config.crmTopic)
    })

    test('should throw', async () => {
      const wrapper = async () => { await sendCrmMessage(email, frn, reason) }
      expect(wrapper).rejects.toThrow()
    })

    test('should throw Error', async () => {
      const wrapper = async () => { await sendCrmMessage(email, frn, reason) }
      expect(wrapper).rejects.toThrow(Error)
    })

    test('should throw error "Issue sending the message via Service Bus"', async () => {
      const wrapper = async () => { await sendCrmMessage(email, frn, reason) }
      expect(wrapper).rejects.toThrow(/^Issue sending the message via Service Bus$/)
    })
  })
})
