const completeDelivery = require('../../../app/monitoring/complete-delivery')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  delivery: {
    update: jest.fn()
  }
}))

describe('processCompleteDelivery', () => {
  const deliveryId = '123'
  const transaction = { /* mock transaction */ }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    { updatedRows: 1, expected: true, description: 'updates delivery successfully' },
    { updatedRows: 0, expected: false, description: 'returns false when no rows updated' }
  ])('should $description', async ({ updatedRows, expected }) => {
    db.delivery.update.mockResolvedValue([updatedRows, {}])

    const result = await completeDelivery(deliveryId, transaction)

    expect(db.delivery.update).toHaveBeenCalledWith(
      { completed: expect.any(Date) },
      {
        where: { deliveryId },
        transaction,
        returning: true
      }
    )
    expect(result).toBe(expected)
  })

  test('should throw error when update fails', async () => {
    const testError = new Error('Test error')
    db.delivery.update.mockRejectedValue(testError)

    jest.spyOn(console, 'error').mockImplementation()

    await expect(completeDelivery(deliveryId, transaction)).rejects.toThrow(testError)
    expect(console.error).toHaveBeenCalledWith(
      `Error completing delivery ${deliveryId}:`,
      testError
    )

    console.error.mockRestore()
  })
})
