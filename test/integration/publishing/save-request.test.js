const db = require('../../../app/data')
const { mockMessageSender } = require('../../mocks/modules/ffc-messaging')
const saveRequest = require('../../../app/publishing/save-request')

const { EMAIL } = require('../../../app/constants/methods')
const { EMPTY, INVALID, REJECTED } = require('../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_ERROR, INVALID: INVALID_ERROR } = require('../../../app/constants/crm-error-messages')

const SYSTEM_TIME = require('../../mocks/components/system-time')
const MESSAGE = require('../../mocks/objects/message')

const REFERENCE = structuredClone(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_DELIVERED).data.id

let reference, reason

const statementKeys = [
  { key: 'businessName', column: 'businessName' },
  { key: 'sbi', column: 'sbi' },
  { key: 'filename', column: 'filename' },
  { key: 'email', column: 'email' },
  { key: 'documentReference', column: 'documentReference' }
]

const addressKeys = [
  { key: 'line1', column: 'addressLine1' },
  { key: 'line2', column: 'addressLine2' },
  { key: 'line3', column: 'addressLine3' },
  { key: 'line4', column: 'addressLine4' },
  { key: 'line5', column: 'addressLine5' },
  { key: 'postcode', column: 'postcode' }
]

const failureReasons = [
  { name: 'undefined', value: undefined, errorMessage: null, sendCRM: false },
  { name: 'EMPTY', value: EMPTY, errorMessage: EMPTY_ERROR, sendCRM: true },
  { name: 'INVALID', value: INVALID, errorMessage: INVALID_ERROR, sendCRM: true },
  { name: 'REJECTED', value: REJECTED, errorMessage: INVALID_ERROR, sendCRM: true },
  { name: 'Unknown', value: 'Not known failure reason', errorMessage: null, sendCRM: false }
]

describe('saveRequest', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(SYSTEM_TIME)
    reference = REFERENCE
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await db.sequelize.truncate({ cascade: true })
  })

  afterAll(async () => {
    await db.sequelize.close()
  })

  const request = structuredClone(require('../../mocks/messages/publish').STATEMENT_MESSAGE).body

  describe.each(failureReasons)('When failure reason is $name', ({ value, errorMessage, sendCRM }) => {
    beforeEach(() => {
      reason = value
    })

    test('saves 1 statement', async () => {
      await saveRequest(request, reference, EMAIL, { reason })
      const statements = await db.statement.findAll()
      expect(statements.length).toBe(1)
    })

    test.each(statementKeys)('saves statement $key to column $column', async ({ key, column }) => {
      await saveRequest(request, reference, EMAIL, { reason })
      const statement = await db.statement.findOne()
      expect(statement[column]).toBe(request[key])
    })

    test('saves statement FRN as string', async () => {
      await saveRequest(request, reference, EMAIL, { reason })
      const statement = await db.statement.findOne()
      expect(statement.frn).toBe(String(request.frn))
    })

    test.each(addressKeys)('saves address $key to statement $column', async ({ key, column }) => {
      await saveRequest(request, reference, EMAIL, { reason })
      const statement = await db.statement.findOne()
      expect(statement[column]).toBe(request.address[key])
    })

    test('saves 1 delivery with correct fields', async () => {
      await saveRequest(request, reference, EMAIL, { reason })
      const delivery = await db.delivery.findOne()
      const statement = await db.statement.findOne()
      expect(delivery.statementId).toBe(statement.statementId)
      expect(delivery.method).toBe(EMAIL)
      expect(delivery.requested).toStrictEqual(SYSTEM_TIME)
      expect(delivery.completed).toBeNull()
      expect(delivery.reference).toBe(reference ?? null)
    })

    test('saves 1 failure if reason provided', async () => {
      await saveRequest(request, reference, EMAIL, { reason })
      const failures = await db.failure.findAll()
      if (value) {
        expect(failures.length).toBe(1)
        const failure = await db.failure.findOne()
        const delivery = await db.delivery.findOne()
        expect(failure.deliveryId).toBe(delivery.deliveryId)
        expect(failure.reason).toBe(value)
        expect(failure.failed).toStrictEqual(SYSTEM_TIME)
      } else {
        expect(failures.length).toBe(0)
      }
    })

    test(`CRM message ${sendCRM ? 'is sent' : 'is not sent'}`, async () => {
      await saveRequest(request, reference, EMAIL, { reason })
      if (sendCRM) {
        expect(mockMessageSender().sendMessage).toHaveBeenCalled()
        expect(mockMessageSender().closeConnection).toHaveBeenCalled()
      } else {
        expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
        expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
      }
    })

    if (sendCRM) {
      test('CRM message content is correct', async () => {
        await saveRequest(request, reference, EMAIL, { reason })
        expect(mockMessageSender().sendMessage).toHaveBeenCalledWith({
          ...MESSAGE,
          body: {
            email: request.email,
            errorMessage,
            frn: request.frn
          }
        })
      })
    }
  })
})
