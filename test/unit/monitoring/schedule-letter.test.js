const { LETTER } = require('../../../app/constants/methods')
const db = require('../../../app/data')
const publish = require('../../../app/publishing/publish')
const isDpScheme = require('../../../app/publishing/is-dp-scheme')
const scheduleLetter = require('../../../app/monitoring/schedule-letter')

jest.mock('../../../app/data')
jest.mock('../../../app/publishing/publish')
jest.mock('../../../app/publishing/is-dp-scheme')

describe('scheduleLetter', () => {
  let mockTransaction
  let delivery
  let statement
  let publishResponse

  beforeEach(() => {
    jest.clearAllMocks()

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    }

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

    publishResponse = {
      data: {
        id: 'notify-ref-789'
      }
    }

    db.statement.findOne.mockResolvedValue(statement)
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

    expect(db.statement.findOne).toHaveBeenCalledWith({
      where: { statementId: delivery.statementId },
      transaction: mockTransaction
    })
  })

  test('throws error if statement not found', async () => {
    db.statement.findOne.mockResolvedValue(null)

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
      expect(db.delivery.create).not.toHaveBeenCalled()
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
      jest.spyOn(global, 'Date').mockImplementation(() => timestamp)

      await scheduleLetter(delivery, mockTransaction)

      expect(db.delivery.create).toHaveBeenCalledWith({
        statementId: delivery.statementId,
        method: LETTER,
        reference: publishResponse.data.id,
        requested: timestamp
      }, {
        transaction: mockTransaction
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
      const error = new Error('Publish failed')
      publish.mockRejectedValue(error)

      await expect(scheduleLetter(delivery, mockTransaction))
        .rejects
        .toThrow(error)
    })

    test('throws delivery creation error', async () => {
      const error = new Error('DB error')
      db.delivery.create.mockRejectedValue(error)

      await expect(scheduleLetter(delivery, mockTransaction))
        .rejects
        .toThrow(error)
    })

    test('logs error message', async () => {
      const consoleSpy = jest.spyOn(console, 'error')
      const error = new Error('Test error')
      publish.mockRejectedValue(error)

      try {
        await scheduleLetter(delivery, mockTransaction)
      } catch { }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to schedule letter:',
        error
      )
    })
  })
})
