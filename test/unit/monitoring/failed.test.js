const db = require('../../../app/data')
const { mockTransaction } = require('../../mocks/objects/data')
const { EMAIL, LETTER } = require('../../../app/constants/methods')

jest.mock('../../../app/data')
jest.mock('../../../app/monitoring/get-statement-by-statement-id')
jest.mock('../../../app/messaging/send-crm-message')
jest.mock('../../../app/monitoring/complete-delivery')
jest.mock('../../../app/monitoring/create-failure')
jest.mock('../../../app/monitoring/schedule-letter')

const getStatementByStatementId = require('../../../app/monitoring/get-statement-by-statement-id')
const sendCrmMessage = require('../../../app/messaging/send-crm-message')
const completeDelivery = require('../../../app/monitoring/complete-delivery')
const createFailure = require('../../../app/monitoring/create-failure')
const scheduleLetter = require('../../../app/monitoring/schedule-letter')
const failed = require('../../../app/monitoring/failed')

describe('failed', () => {
  let delivery
  let failure
  let mockStatement

  beforeEach(() => {
    jest.clearAllMocks()

    mockStatement = {
      filename: 'test.pdf',
      email: 'test@example.com',
      frn: '1234567890'
    }

    delivery = {
      deliveryId: 1,
      statementId: 1,
      method: EMAIL
    }

    failure = {
      reason: 'TEST_FAILURE'
    }

    db.sequelize.transaction.mockResolvedValue(mockTransaction())
    getStatementByStatementId.mockResolvedValue(mockStatement)
    sendCrmMessage.mockResolvedValue(undefined)
    completeDelivery.mockResolvedValue(undefined)
    createFailure.mockResolvedValue(undefined)
    scheduleLetter.mockResolvedValue(undefined)
  })

  test('starts a transaction', async () => {
    await failed(delivery, failure)
    expect(db.sequelize.transaction).toHaveBeenCalled()
  })

  test('gets statement by ID with transaction', async () => {
    await failed(delivery, failure)
    expect(getStatementByStatementId).toHaveBeenCalledWith(delivery.statementId, mockTransaction())
  })

  test('throws if statement not found', async () => {
    getStatementByStatementId.mockResolvedValue(null)
    await expect(failed(delivery, failure)).rejects.toThrow('Statement not found')
  })

  describe('when CRM messaging is disabled', () => {
    beforeEach(() => {
      process.env.SEND_CRM_FAILURE_MESSAGE_ENABLED = 'false'
    })

    test('does not send CRM message', async () => {
      await failed(delivery, failure)
      expect(sendCrmMessage).not.toHaveBeenCalled()
    })
  })

  test('completes delivery with transaction', async () => {
    await failed(delivery, failure)
    expect(completeDelivery).toHaveBeenCalledWith(delivery.deliveryId, mockTransaction())
  })

  test('creates failure record with transaction', async () => {
    const timestamp = Date.now()
    jest.spyOn(Date, 'now').mockReturnValue(timestamp)

    await failed(delivery, failure)
    expect(createFailure).toHaveBeenCalledWith(
      delivery.deliveryId,
      failure,
      timestamp,
      mockTransaction()
    )
  })

  describe('when delivery method is EMAIL', () => {
    beforeEach(() => {
      delivery.method = EMAIL
    })

    test('schedules letter with transaction', async () => {
      await failed(delivery, failure)
      expect(scheduleLetter).toHaveBeenCalledWith(delivery, mockTransaction())
    })
  })

  describe('when delivery method is LETTER', () => {
    beforeEach(() => {
      delivery.method = LETTER
    })

    test('does not schedule letter', async () => {
      await failed(delivery, failure)
      expect(scheduleLetter).not.toHaveBeenCalled()
    })
  })

  test('commits transaction on success', async () => {
    await failed(delivery, failure)
    expect(mockTransaction().commit).toHaveBeenCalled()
  })

  describe('error handling', () => {
    const testCases = [
      {
        name: 'getStatementByStatementId fails',
        mockSetup: () => getStatementByStatementId.mockRejectedValue(new Error('DB Error')),
        expectedError: 'DB Error'
      },
      {
        name: 'completeDelivery fails',
        mockSetup: () => completeDelivery.mockRejectedValue(new Error('Complete Failed')),
        expectedError: 'Complete Failed'
      },
      {
        name: 'createFailure fails',
        mockSetup: () => createFailure.mockRejectedValue(new Error('Create Failed')),
        expectedError: 'Create Failed'
      },
      {
        name: 'scheduleLetter fails',
        mockSetup: () => scheduleLetter.mockRejectedValue(new Error('Schedule Failed')),
        expectedError: 'Schedule Failed'
      }
    ]

    testCases.forEach(({ name, mockSetup, expectedError }) => {
      describe(`when ${name}`, () => {
        beforeEach(() => {
          mockSetup()
        })

        test('rolls back transaction', async () => {
          await expect(failed(delivery, failure)).rejects.toThrow()
          expect(mockTransaction().rollback).toHaveBeenCalled()
        })

        test('throws original error', async () => {
          await expect(failed(delivery, failure)).rejects.toThrow(expectedError)
        })

        test('does not commit transaction', async () => {
          try {
            await failed(delivery, failure)
          } catch { }
          expect(mockTransaction().commit).not.toHaveBeenCalled()
        })
      })
    })

    describe('when transaction commit fails', () => {
      beforeEach(() => {
        mockTransaction().commit.mockRejectedValue(new Error('Commit Failed'))
      })

      test('rolls back transaction', async () => {
        await expect(failed(delivery, failure)).rejects.toThrow()
        expect(mockTransaction().rollback).toHaveBeenCalled()
      })

      test('throws commit error', async () => {
        await expect(failed(delivery, failure)).rejects.toThrow('Commit Failed')
      })
    })
  })
})
