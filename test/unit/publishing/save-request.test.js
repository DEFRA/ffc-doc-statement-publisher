const db = require('../../../app/data')
const { mockMessageSender } = require('../../mocks/modules/ffc-messaging')
const saveRequest = require('../../../app/publishing/save-request')

const REFERENCE = structuredClone(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_DELIVERED).data.id
const { EMAIL } = require('../../../app/constants/methods')
const { EMPTY, INVALID, REJECTED } = require('../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_ERROR, INVALID: INVALID_ERROR } = require('../../../app/constants/crm-error-messages')
const SYSTEM_TIME = require('../../mocks/components/system-time')
const MESSAGE = require('../../mocks/objects/message')

let reference
let method
let reason

describe('Save statement and delivery and send to CRM and save failure if so', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(SYSTEM_TIME)
    reference = REFERENCE
    method = EMAIL
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await db.sequelize.truncate({ cascade: true })
  })

  afterAll(async () => {
    await db.sequelize.close()
  })

  describe.each([
    { name: 'statement', request: structuredClone(require('../../mocks/messages/publish').STATEMENT_MESSAGE).body }
  ])('When request is $name', ({ request }) => {
    const failureReasons = [
      { reason: undefined, sendMessage: false, errorMessage: null },
      { reason: EMPTY, sendMessage: true, errorMessage: EMPTY_ERROR },
      { reason: INVALID, sendMessage: true, errorMessage: INVALID_ERROR },
      { reason: REJECTED, sendMessage: true, errorMessage: INVALID_ERROR }, // adjust if needed
      { reason: 'Not known failure reason', sendMessage: false, errorMessage: null }
    ]

    describe.each(failureReasons)('When failure reason is $reason', ({ reason: currentReason, sendMessage, errorMessage }) => {
      beforeEach(() => {
        reason = currentReason
      })

      test('should save 1 statement', async () => {
        await saveRequest(request, reference, method, { reason })
        const statements = await db.statement.findAll()
        expect(statements.length).toBe(1)
      })

      test.each([
        { key: 'businessName', column: 'businessName' },
        { key: 'sbi', column: 'sbi' },
        { key: 'filename', column: 'filename' },
        { key: 'email', column: 'email' },
        { key: 'documentReference', column: 'documentReference' }
      ])('should save request key $key to statement column $column', async ({ key, column }) => {
        await saveRequest(request, reference, method, { reason })
        const statement = await db.statement.findOne()
        expect(statement[column]).toBe(request[key])
      })

      test('should save statement with frn', async () => {
        await saveRequest(request, reference, method, { reason })
        const statement = await db.statement.findOne()
        expect(statement.frn).toBe(String(request.frn))
      })

      test.each([
        { key: 'line1', column: 'addressLine1' },
        { key: 'line2', column: 'addressLine2' },
        { key: 'line3', column: 'addressLine3' },
        { key: 'line4', column: 'addressLine4' },
        { key: 'line5', column: 'addressLine5' },
        { key: 'postcode', column: 'postcode' }
      ])('should save address $key to $column', async ({ key, column }) => {
        await saveRequest(request, reference, method, { reason })
        const statement = await db.statement.findOne()
        expect(statement[column]).toBe(request.address[key])
      })

      test('should save 1 delivery', async () => {
        await saveRequest(request, reference, method, { reason })
        const delivery = await db.delivery.findAll()
        expect(delivery.length).toBe(1)
      })

      test('should save delivery with correct details', async () => {
        await saveRequest(request, reference, method, { reason })
        const statement = await db.statement.findOne()
        const delivery = await db.delivery.findOne()
        expect(delivery.statementId).toBe(statement.statementId)
        expect(delivery.method).toBe(method)
        expect(delivery.requested).toStrictEqual(SYSTEM_TIME)
        expect(delivery.completed).toBeNull()
        expect(delivery.reference).toBe(reference ?? null)
      })

      test('should save failure if reason exists', async () => {
        await saveRequest(request, reference, method, { reason })
        const failures = await db.failure.findAll()
        if (currentReason) {
          expect(failures.length).toBe(1)
          const delivery = await db.delivery.findOne()
          const failure = await db.failure.findOne()
          expect(failure.deliveryId).toBe(delivery.deliveryId)
          expect(failure.reason).toBe(currentReason)
          expect(failure.failed).toStrictEqual(SYSTEM_TIME)
        } else {
          expect(failures.length).toBe(0)
        }
      })

      test('should handle sending message to CRM', async () => {
        await saveRequest(request, reference, method, { reason })
        if (sendMessage) {
          expect(mockMessageSender().sendMessage).toHaveBeenCalledWith({
            ...MESSAGE,
            body: {
              email: request.email,
              errorMessage,
              frn: request.frn
            }
          })
          expect(mockMessageSender().sendMessage).toHaveBeenCalledTimes(1)
          expect(mockMessageSender().closeConnection).toHaveBeenCalledTimes(1)
        } else {
          expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
          expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
        }
      })
    })
  })
})
