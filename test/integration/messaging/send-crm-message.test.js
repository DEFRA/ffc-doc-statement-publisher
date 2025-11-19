const { mockMessageSender } = require('../../mocks/modules/ffc-messaging')
const sendCrmMessage = require('../../../app/messaging/send-crm-message')
const { EMPTY, INVALID, REJECTED } = require('../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_MESSAGE, INVALID: INVALID_MESSAGE } = require('../../mocks/messages/crm')

let email
let frn

describe('Send invalid email message to CRM', () => {
  beforeEach(() => {
    email = require('../../mocks/components/email')
    frn = require('../../mocks/components/frn')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // Cases that should send
  const validCases = [
    { reason: EMPTY, message: EMPTY_MESSAGE },
    { reason: INVALID, message: INVALID_MESSAGE },
    { reason: REJECTED, message: INVALID_MESSAGE }
  ]

  validCases.forEach(({ reason, message }) => {
    describe(`When reason is ${reason}`, () => {
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

      test('should send message to CRM with expected payload', async () => {
        await sendCrmMessage(email, frn, reason)
        expect(mockMessageSender().sendMessage).toHaveBeenCalledWith(message)
        expect(mockMessageSender().closeConnection).toHaveBeenCalled()
      })
    })
  })

  // Cases that should not send
  const invalidCases = [
    {
      name: 'invalid reason',
      email: undefined,
      frn: undefined,
      reason: 'Not a valid error message.'
    },
    {
      name: 'invalid FRN (too short)',
      email: undefined,
      frn: 12345,
      reason: EMPTY
    }
  ]

  invalidCases.forEach(({ name, email: badEmail, frn: badFrn, reason }) => {
    describe(`When ${name}`, () => {
      test('should not send message to CRM', async () => {
        const emailArg = badEmail ?? email
        const frnArg = badFrn ?? frn

        try {
          await sendCrmMessage(emailArg, frnArg, reason)
        } catch {
          // ignore expected validation errors
        }

        expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
        expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
      })
    })
  })

  // Special case: invalid email format — message still sent if reason valid
  describe('When email is invalid format', () => {
    test.each(validCases)(
      'should still send CRM message for reason %s',
      async ({ reason, message }) => {
        const badEmail = 'not-valid'
        await sendCrmMessage(badEmail, frn, reason)

        const sentMessage = mockMessageSender().sendMessage.mock.calls[0][0]

        expect(sentMessage.source).toBe(message.source)
        expect(sentMessage.type).toBe(message.type)
        expect(sentMessage.body.errorMessage).toBe(message.body.errorMessage)
        expect(sentMessage.body.frn).toBe(message.body.frn)
        expect(sentMessage.body.email).toBe(badEmail)

        expect(mockMessageSender().closeConnection).toHaveBeenCalled()
      }
    )
  })
})
