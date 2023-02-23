const { mockMessageSender } = require('../../mocks/objects/ffc-messaging')

const sendCrmMessage = require('../../../app/messaging/send-crm-message')

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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When reason is EMPTY', () => {
    beforeEach(() => {
      reason = EMPTY
      message = EMPTY_MESSAGE
    })

    test('should send message to CRM', async () => {
      await sendCrmMessage(email, frn, reason)

      expect(mockMessageSender().sendMessage).toHaveBeenCalled()
      expect(mockMessageSender().closeConnection).toHaveBeenCalled()
    })

    test('should send 1 message to CRM', async () => {
      await sendCrmMessage(email, frn, reason)

      expect(mockMessageSender().sendMessage).toHaveBeenCalledTimes(1)
      expect(mockMessageSender().closeConnection).toHaveBeenCalled()
    })

    test('should send message to CRM with message', async () => {
      await sendCrmMessage(email, frn, reason)

      expect(mockMessageSender().sendMessage).toHaveBeenCalledWith(message)
      expect(mockMessageSender().closeConnection).toHaveBeenCalled()
    })
  })

  describe('When reason is INVALID', () => {
    beforeEach(() => {
      reason = INVALID
      message = INVALID_MESSAGE
    })

    test('should send message to CRM', async () => {
      await sendCrmMessage(email, frn, reason)

      expect(mockMessageSender().sendMessage).toHaveBeenCalled()
      expect(mockMessageSender().closeConnection).toHaveBeenCalled()
    })

    test('should send 1 message to CRM', async () => {
      await sendCrmMessage(email, frn, reason)

      expect(mockMessageSender().sendMessage).toHaveBeenCalledTimes(1)
      expect(mockMessageSender().closeConnection).toHaveBeenCalled()
    })

    test('should send message to CRM with message', async () => {
      await sendCrmMessage(email, frn, reason)

      expect(mockMessageSender().sendMessage).toHaveBeenCalledWith(message)
      expect(mockMessageSender().closeConnection).toHaveBeenCalled()
    })
  })

  describe('When reason is REJECTED', () => {
    beforeEach(() => {
      reason = REJECTED
      message = INVALID_MESSAGE
    })

    test('should send message to CRM', async () => {
      await sendCrmMessage(email, frn, reason)

      expect(mockMessageSender().sendMessage).toHaveBeenCalled()
      expect(mockMessageSender().closeConnection).toHaveBeenCalled()
    })

    test('should send 1 message to CRM', async () => {
      await sendCrmMessage(email, frn, reason)

      expect(mockMessageSender().sendMessage).toHaveBeenCalledTimes(1)
      expect(mockMessageSender().closeConnection).toHaveBeenCalled()
    })

    test('should send message to CRM with message', async () => {
      await sendCrmMessage(email, frn, reason)

      expect(mockMessageSender().sendMessage).toHaveBeenCalledWith(message)
      expect(mockMessageSender().closeConnection).toHaveBeenCalled()
    })
  })

  describe('When reason is not valid', () => {
    beforeEach(() => {
      reason = 'Not a valid error message.'
    })

    test('should not send message to CRM', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}

      expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
      expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
    })
  })

  describe('When email is not valid', () => {
    beforeEach(() => {
      email = 'not-valid'
    })

    test('should not send message to CRM', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}

      expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
      expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
    })
  })

  describe('When frn is not valid', () => {
    beforeEach(() => {
      frn = 12345
    })

    test('should not send message to CRM', async () => {
      try { await sendCrmMessage(email, frn, reason) } catch {}

      expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
      expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
    })
  })
})
