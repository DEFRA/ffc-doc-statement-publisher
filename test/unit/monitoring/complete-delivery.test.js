const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['delivery'])

jest.mock('../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const completeDelivery = require('../../../app/monitoring/complete-delivery')

describe('processCompleteDelivery', () => {
  const deliveryId = '123'
  const transaction = {}

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test.each([
    { updatedRows: 1, expected: true, description: 'updates delivery successfully' },
    { updatedRows: 0, expected: false, description: 'returns false when no rows updated' }
  ])('should $description', async ({ updatedRows, expected }) => {
    mockDb.builder.resolves(updatedRows)

    const result = await completeDelivery(deliveryId, transaction)

    expect(mockDb.tables.delivery).toHaveBeenCalledWith(transaction)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ deliveryId })
    expect(mockDb.builder.update).toHaveBeenCalledWith({ completed: expect.any(Date) })
    expect(result).toBe(expected)
  })

  test('should throw error when update fails', async () => {
    const testError = new Error('Test error')
    mockDb.builder.rejects(testError)

    jest.spyOn(console, 'error').mockImplementation()

    await expect(completeDelivery(deliveryId, transaction)).rejects.toThrow(testError)
    expect(console.error).toHaveBeenCalledWith(
      `Error completing delivery ${deliveryId}:`,
      testError
    )

    console.error.mockRestore()
  })
})
