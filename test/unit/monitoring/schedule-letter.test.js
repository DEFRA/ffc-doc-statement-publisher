const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['statement', 'delivery'])

jest.mock('../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))
jest.mock('../../../app/publishing/publish')
jest.mock('../../../app/publishing/is-dp-scheme')

const { LETTER } = require('../../../app/constants/methods')
const publish = require('../../../app/publishing/publish')
const isDpScheme = require('../../../app/publishing/is-dp-scheme')
const scheduleLetter = require('../../../app/monitoring/schedule-letter')

describe('processScheduleLetter', () => {
  let mockTransaction
  let delivery
  let statement
  let publishResponse

  beforeEach(() => {
    jest.clearAllMocks()

    mockTransaction = mockDb.trx

    delivery = {
      deliveryId: '456',
      statementId: '123',
      method: 'email'
    }

    statement = {
      statementId: '123',
      schemeShortName: 'DP',
      filename: 'test.pdf',
      emailTemplate: 'template',
      email: 'test@example.com'
    }

    publishResponse = { data: { id: 'notify-ref-789' } }

    mockDb.builder.resolves(statement)
    isDpScheme.mockReturnValue(true)
    publish.mockResolvedValue(publishResponse)
  })

  test('throws error if transaction not provided', async () => {
    await expect(scheduleLetter(delivery))
      .rejects
      .toThrow('Transaction is required to schedule letter')
  })

  test('gets statement using transaction', async () => {
    await scheduleLetter(delivery, mockTransaction)
    expect(mockDb.tables.statement).toHaveBeenCalledWith(mockTransaction)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ statementId: delivery.statementId })
  })

  test('throws error if statement not found', async () => {
    mockDb.builder.resolves(undefined)
    await expect(scheduleLetter(delivery, mockTransaction))
      .rejects
      .toThrow(`Statement not found for statementId: ${delivery.statementId}`)
  })

  describe('when statement is not DP scheme', () => {
    beforeEach(() => {
      isDpScheme.mockReturnValue(false)
    })

    test('returns false without scheduling letter', async () => {
      const result = await scheduleLetter(delivery, mockTransaction)
      expect(result).toBe(false)
      expect(publish).not.toHaveBeenCalled()
      expect(mockDb.builder.insert).not.toHaveBeenCalled()
    })

    test('logs non-DP scheme message', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      await scheduleLetter(delivery, mockTransaction)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Letter not scheduled - not DP scheme: ${statement.schemeShortName}`)
      )
    })
  })

  describe('when statement is DP scheme', () => {
    beforeEach(() => {
      isDpScheme.mockReturnValue(true)
    })

    test('publishes letter with correct parameters', async () => {
      await scheduleLetter(delivery, mockTransaction)
      expect(publish).toHaveBeenCalledWith(
        statement.emailTemplate,
        statement.email,
        statement.filename,
        null,
        LETTER
      )
    })

    test('creates new delivery record with correct data', async () => {
      const timestamp = new Date()
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => timestamp)
      await scheduleLetter(delivery, mockTransaction)
      dateSpy.mockRestore()
      expect(mockDb.tables.delivery).toHaveBeenCalledWith(mockTransaction)
      expect(mockDb.builder.insert).toHaveBeenCalledWith({
        statementId: delivery.statementId,
        method: LETTER,
        reference: publishResponse.data.id,
        requested: timestamp
      })
    })

    test('returns true on successful scheduling', async () => {
      const result = await scheduleLetter(delivery, mockTransaction)
      expect(result).toBe(true)
    })

    test('logs success message', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      await scheduleLetter(delivery, mockTransaction)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Letter scheduled successfully for statement ${statement.filename}`)
      )
    })
  })

  describe('error handling', () => {
    test('throws publish error', async () => {
      publish.mockRejectedValue(new Error('Publish failed'))
      await expect(scheduleLetter(delivery, mockTransaction)).rejects.toThrow('Publish failed')
    })

    test('throws delivery creation error', async () => {
      publish.mockResolvedValue(publishResponse)
      mockDb.builder.insert.mockImplementationOnce(() => { throw new Error('DB error') })
      await expect(scheduleLetter(delivery, mockTransaction)).rejects.toThrow('DB error')
    })

    test('logs publish errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error')
      const error = new Error('Test error')
      publish.mockRejectedValue(error)
      try { await scheduleLetter(delivery, mockTransaction) } catch { }
      expect(consoleSpy).toHaveBeenCalledWith('Failed to schedule letter:', error)
    })
  })
})
