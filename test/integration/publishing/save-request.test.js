const db = require('../../../app/data')

const { mockMessageSender } = require('../../mocks/modules/ffc-messaging')

const saveRequest = require('../../../app/publishing/save-request')

const REFERENCE = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_DELIVERED)).data.id
const { EMAIL } = require('../../../app/constants/methods')
const { EMPTY, INVALID, REJECTED } = require('../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_ERROR, INVALID: INVALID_ERROR } = require('../../../app/constants/crm-error-messages')

const SYSTEM_TIME = require('../../mocks/components/system-time')

const MESSAGE = require('../../mocks/objects/message')

let reference
let method
let reason

describe('When database operation fails', () => {
  beforeEach(async () => {
    jest.spyOn(db.statement, 'create').mockRejectedValueOnce(new Error('Database error'))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should rollback transaction and throw error', async () => {
    await expect(saveRequest(reference, EMAIL)).rejects.toThrow('Database error')

    const statement = await db.statement.findAll()
    expect(statement.length).toBe(0)

    const delivery = await db.delivery.findAll()
    expect(delivery.length).toBe(0)

    const failure = await db.failure.findAll()
    expect(failure.length).toBe(0)

    expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
    expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
  })
})

describe('When CRM message sending fails', () => {
  beforeEach(async () => {
    reason = EMPTY
    mockMessageSender().sendMessage.mockRejectedValueOnce(new Error('CRM error'))
  })

  test('should save data but handle CRM error gracefully', async () => {
    await expect(saveRequest(reference, EMAIL, { reason })).resolves.not.toThrow()

    const statement = await db.statement.findAll()
    expect(statement.length).toBe(1)

    const delivery = await db.delivery.findAll()
    expect(delivery.length).toBe(1)

    const failure = await db.failure.findAll()
    expect(failure.length).toBe(1)

    expect(mockMessageSender().sendMessage).toHaveBeenCalledTimes(1)
    expect(mockMessageSender().closeConnection).toHaveBeenCalledTimes(1)
  })
})

describe('When email or FRN is missing', () => {
  beforeEach(async () => {
    reason = EMPTY
  })

  test('should not send CRM message if email is missing', async () => {
    const requestWithoutEmail = { email: undefined }

    await saveRequest(requestWithoutEmail, reference, EMAIL, { reason })

    const statement = await db.statement.findAll()
    expect(statement.length).toBe(1)

    const delivery = await db.delivery.findAll()
    expect(delivery.length).toBe(1)

    const failure = await db.failure.findAll()
    expect(failure.length).toBe(1)

    expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
    expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
  })

  test('should not send CRM message if FRN is missing', async () => {
    const requestWithoutFrn = { frn: undefined }

    await saveRequest(requestWithoutFrn, reference, EMAIL, { reason })

    const statement = await db.statement.findAll()
    expect(statement.length).toBe(1)

    const delivery = await db.delivery.findAll()
    expect(delivery.length).toBe(1)

    const failure = await db.failure.findAll()
    expect(failure.length).toBe(1)

    expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
    expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
  })
})

describe('Performance logging', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log')
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  test('should log performance metrics', async () => {
    await saveRequest(reference, EMAIL)

    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/Request saved successfully in \d+ms. StatementId: \d+/)
    )
  })
})

describe('Save statement and delivery and send to CRM and save failure if so', () => {
  beforeEach(async () => {
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
    { name: 'statement', request: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').STATEMENT_MESSAGE)).body },
    { name: 'schedule', request: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').SCHEDULE_MESSAGE)).body }
  ])('When request is $name', ({ name, request }) => {
    describe('When successful', () => {
      beforeEach(async () => {
        reason = undefined
      })

      test('should save 1 statement', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findAll()
        expect(statement.length).toBe(1)
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
        expect(request[key]).toBeDefined()
        expect(statement[column]).toBeDefined()
        expect(statement[column]).toBe(request[key])
      })

      test('should save string request key frn to statement column frn', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(request.frn).toBeDefined()
        expect(statement.frn).toBeDefined()
        expect(statement.frn).toBe(String(request.frn))
      })

      test('should save request key address.line1 to statement column addressLine1', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(request.address.line1).toBeDefined()
        expect(statement.addressLine1).toBeDefined()
        expect(statement.addressLine1).toBe(request.address.line1)
      })

      test('should save request key address.line2 to statement column addressLine2', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(request.address.line2).toBeDefined()
        expect(statement.addressLine2).toBeDefined()
        expect(statement.addressLine2).toBe(request.address.line2)
      })

      test('should save request key address.line3 to statement column addressLine3', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(request.address.line3).toBeDefined()
        expect(statement.addressLine3).toBeDefined()
        expect(statement.addressLine3).toBe(request.address.line3)
      })

      test('should save request key address.line4 to statement column addressLine4', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(request.address.line4).toBeDefined()
        expect(statement.addressLine4).toBeDefined()
        expect(statement.addressLine4).toBe(request.address.line4)
      })

      test('should save request key address.line5 to statement column addressLine5', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(request.address.line5).toBeDefined()
        expect(statement.addressLine5).toBeDefined()
        expect(statement.addressLine5).toBe(request.address.line5)
      })

      test('should save request key address.postcode to statement column postcode', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(request.address.postcode).toBeDefined()
        expect(statement.postcode).toBeDefined()
        expect(statement.postcode).toBe(request.address.postcode)
      })

      test('should save 1 delivery', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findAll()
        expect(delivery.length).toBe(1)
      })

      test('should save delivery with statement id', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        const delivery = await db.delivery.findOne()
        expect(delivery.statementId).toBe(statement.statementId)
      })

      test('should save delivery with method method', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.method).toBe(method)
      })

      test('should save delivery with SYSTEM_TIME', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.requested).toStrictEqual(SYSTEM_TIME)
      })

      test('should save delivery with null completed date', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.completed).toBeNull()
      })

      test('should save delivery with reference if reference', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBe(reference)
      })

      test('should save delivery with null reference when reference is null', async () => {
        reference = null

        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBeNull()
      })

      test('should save delivery with null reference when reference is null', async () => {
        reference = undefined

        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBeNull()
      })

      test('should not save failure', async () => {
        await saveRequest(request, reference, method, { reason })

        const failure = await db.failure.findAll()
        expect(failure.length).toBe(0)
      })

      test('should not send message to CRM', async () => {
        await saveRequest(request, reference, method, { reason })

        expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
        expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
      })
    })

    describe('When failure reason is EMPTY', () => {
      beforeEach(async () => {
        reason = EMPTY
      })

      test('should save 1 statement', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findAll()
        expect(statement.length).toBe(1)
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
        expect(request[key]).toBeDefined()
        expect(statement[column]).toBeDefined()
        expect(statement[column]).toBe(request[key])
      })

      test('should save statement with frn', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.frn).toBe(request.frn.toString())
      })

      test('should save statement with address line 1', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine1).toBe(request.address.line1)
      })

      test('should save statement with address line 2', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine2).toBe(request.address.line2)
      })

      test('should save statement with address line 3', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine3).toBe(request.address.line3)
      })

      test('should save statement with address line 4', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine4).toBe(request.address.line4)
      })

      test('should save statement with address line 5', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine5).toBe(request.address.line5)
      })

      test('should save statement with address postcode', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.postcode).toBe(request.address.postcode)
      })

      test('should save 1 delivery', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findAll()
        expect(delivery.length).toBe(1)
      })

      test('should save delivery with statement id', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        const delivery = await db.delivery.findOne()
        expect(delivery.statementId).toBe(statement.statementId)
      })

      test('should save delivery with method method', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.method).toBe(method)
      })

      test('should save delivery with SYSTEM_TIME', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.requested).toStrictEqual(SYSTEM_TIME)
      })

      test('should save delivery with null completed date', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.completed).toBeNull()
      })

      test('should save delivery with reference if reference', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBe(reference)
      })

      test('should save delivery with null reference when reference is null', async () => {
        reference = null

        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBeNull()
      })

      test('should save delivery with null reference when reference is null', async () => {
        reference = undefined

        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBeNull()
      })

      test('should save 1 failure', async () => {
        await saveRequest(request, reference, method, { reason })

        const failure = await db.failure.findAll()
        expect(failure.length).toBe(1)
      })

      test('should save failure with deliveryId', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findOne()
        const failure = await db.failure.findOne()
        expect(failure.deliveryId).toBe(delivery.deliveryId)
      })

      test('should save failure with reason as EMPTY', async () => {
        await saveRequest(request, reference, method, { reason })

        const failure = await db.failure.findOne()
        expect(failure.reason).toBe(EMPTY)
      })

      test('should save failure with failed as SYSTEM_TIME', async () => {
        await saveRequest(request, reference, method, { reason })

        const failure = await db.failure.findOne()
        expect(failure.failed).toStrictEqual(SYSTEM_TIME)
      })

      test('should send message to CRM', async () => {
        await saveRequest(request, reference, method, { reason })

        expect(mockMessageSender().sendMessage).toHaveBeenCalled()
        expect(mockMessageSender().closeConnection).toHaveBeenCalled()
      })

      test('should send 1 message to CRM', async () => {
        await saveRequest(request, reference, method, { reason })

        expect(mockMessageSender().sendMessage).toHaveBeenCalledTimes(1)
        expect(mockMessageSender().closeConnection).toHaveBeenCalledTimes(1)
      })

      test('should send message to CRM with correct content', async () => {
        await saveRequest(request, reference, method, { reason })

        expect(mockMessageSender().sendMessage).toHaveBeenCalledWith({
          ...MESSAGE,
          body: {
            email: request.email,
            errorMessage: EMPTY_ERROR,
            frn: request.frn
          }
        })
      })
    })

    describe('When failure reason is INVALID', () => {
      beforeEach(async () => {
        reason = INVALID
      })

      test('should save 1 statement', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findAll()
        expect(statement.length).toBe(1)
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
        expect(request[key]).toBeDefined()
        expect(statement[column]).toBeDefined()
        expect(statement[column]).toBe(request[key])
      })

      test('should save statement with frn', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.frn).toBe(request.frn.toString())
      })

      test('should save statement with address line 1', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine1).toBe(request.address.line1)
      })

      test('should save statement with address line 2', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine2).toBe(request.address.line2)
      })

      test('should save statement with address line 3', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine3).toBe(request.address.line3)
      })

      test('should save statement with address line 4', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine4).toBe(request.address.line4)
      })

      test('should save statement with address line 5', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine5).toBe(request.address.line5)
      })

      test('should save statement with address postcode', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        expect(statement.postcode).toBe(request.address.postcode)
      })

      test('should save 1 delivery', async () => {
        await saveRequest(request, reference, method, { reason })

        const delivery = await db.delivery.findAll()
        expect(delivery.length).toBe(1)
      })

      test('should save delivery with statement id', async () => {
        await saveRequest(request, reference, method, { reason })

        const statement = await db.statement.findOne()
        const delivery = await db.delivery.findOne()
        expect(delivery.statementId).toBe(statement.statementId)
      })

      test('should save delivery with email method', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.method).toBe(EMAIL)
      })

      test('should save delivery with SYSTEM_TIME', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.requested).toStrictEqual(SYSTEM_TIME)
      })

      test('should save delivery with null completed date', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.completed).toBeNull()
      })

      test('should save delivery with reference if reference', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBe(reference)
      })

      test('should save delivery with null reference when reference is null', async () => {
        reference = null

        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBeNull()
      })

      test('should save delivery with null reference when reference is null', async () => {
        reference = undefined

        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBeNull()
      })

      test('should save 1 failure', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const failure = await db.failure.findAll()
        expect(failure.length).toBe(1)
      })

      test('should save failure with deliveryId', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        const failure = await db.failure.findOne()
        expect(failure.deliveryId).toBe(delivery.deliveryId)
      })

      test('should save failure with reason as INVALID', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const failure = await db.failure.findOne()
        expect(failure.reason).toBe(INVALID)
      })

      test('should save failure with failed as SYSTEM_TIME', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const failure = await db.failure.findOne()
        expect(failure.failed).toStrictEqual(SYSTEM_TIME)
      })

      test('should send message to CRM', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        expect(mockMessageSender().sendMessage).toHaveBeenCalled()
        expect(mockMessageSender().closeConnection).toHaveBeenCalled()
      })

      test('should send 1 message to CRM', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        expect(mockMessageSender().sendMessage).toHaveBeenCalledTimes(1)
        expect(mockMessageSender().closeConnection).toHaveBeenCalledTimes(1)
      })

      test('should send message to CRM with correct content', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        expect(mockMessageSender().sendMessage).toHaveBeenCalledWith({
          ...MESSAGE,
          body: {
            email: request.email,
            errorMessage: INVALID_ERROR,
            frn: request.frn
          }
        })
      })
    })

    describe('When failure reason is REJECTED', () => {
      beforeEach(async () => {
        reason = REJECTED
      })

      test('should save 1 statement', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findAll()
        expect(statement.length).toBe(1)
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
        console.log(statement[column], request[key])
        expect(request[key]).toBeDefined()
        expect(statement[column]).toBeDefined()
        expect(statement[column]).toBe(request[key])
      })

      test('should save statement with frn', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findOne()
        expect(statement.frn).toBe(request.frn.toString())
      })

      test('should save statement with address line 1', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine1).toBe(request.address.line1)
      })

      test('should save statement with address line 2', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine2).toBe(request.address.line2)
      })

      test('should save statement with address line 3', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine3).toBe(request.address.line3)
      })

      test('should save statement with address line 4', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine4).toBe(request.address.line4)
      })

      test('should save statement with address line 5', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findOne()
        expect(statement.addressLine5).toBe(request.address.line5)
      })

      test('should save statement with address postcode', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findOne()
        expect(statement.postcode).toBe(request.address.postcode)
      })

      test('should save 1 delivery', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findAll()
        expect(delivery.length).toBe(1)
      })

      test('should save delivery with statement id', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findOne()
        const delivery = await db.delivery.findOne()
        expect(delivery.statementId).toBe(statement.statementId)
      })

      test('should save delivery with email method', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.method).toBe(EMAIL)
      })

      test('should save delivery with SYSTEM_TIME', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.requested).toStrictEqual(SYSTEM_TIME)
      })

      test('should save delivery with null completed date', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.completed).toBeNull()
      })

      test('should save delivery with reference if reference', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBe(reference)
      })

      test('should save delivery with null reference when reference is null', async () => {
        reference = null

        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBeNull()
      })

      test('should save delivery with null reference when reference is null', async () => {
        reference = undefined

        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        expect(delivery.reference).toBeNull()
      })

      test('should save 1 failure', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const failure = await db.failure.findAll()
        expect(failure.length).toBe(1)
      })

      test('should save failure with deliveryId', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const delivery = await db.delivery.findOne()
        const failure = await db.failure.findOne()
        expect(failure.deliveryId).toBe(delivery.deliveryId)
      })

      test('should save failure with reason as REJECTED', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const failure = await db.failure.findOne()
        expect(failure.reason).toBe(REJECTED)
      })

      test('should save failure with failed as SYSTEM_TIME', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const failure = await db.failure.findOne()
        expect(failure.failed).toStrictEqual(SYSTEM_TIME)
      })

      test('should send message to CRM', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        expect(mockMessageSender().sendMessage).toHaveBeenCalled()
        expect(mockMessageSender().closeConnection).toHaveBeenCalled()
      })

      test('should send 1 message to CRM', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        expect(mockMessageSender().sendMessage).toHaveBeenCalledTimes(1)
        expect(mockMessageSender().closeConnection).toHaveBeenCalledTimes(1)
      })

      test('should send message to CRM with correct content', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        expect(mockMessageSender().sendMessage).toHaveBeenCalledWith({
          ...MESSAGE,
          body: {
            email: request.email,
            errorMessage: INVALID_ERROR,
            frn: request.frn
          }
        })
      })
    })

    describe('When failure reason is "Not known failure reason"', () => {
      beforeEach(async () => {
        reason = 'Not known failure reason'
      })

      test('should save statement and delivery but not send to CRM', async () => {
        await saveRequest(request, reference, EMAIL, { reason })

        const statement = await db.statement.findAll()
        expect(statement.length).toBe(1)

        const delivery = await db.delivery.findAll()
        expect(delivery.length).toBe(1)

        const failure = await db.failure.findAll()
        expect(failure.length).toBe(1)
        expect(failure[0].reason).toBe(reason)

        expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
        expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
      })
    })
  })
})
