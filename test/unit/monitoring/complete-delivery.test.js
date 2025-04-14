const completeDelivery = require('../../../app/monitoring/complete-delivery')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  delivery: {
    update: jest.fn()
  }
}))

describe('completeDelivery', () => {
  const deliveryId = '123'
  const transaction = { /* mock transaction */ }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should update delivery and return true when successful', async () => {
    db.delivery.update.mockResolvedValue([1, {}])

    const result = await completeDelivery(deliveryId, transaction)

    expect(db.delivery.update).toHaveBeenCalledWith(
      { completed: expect.any(Date) },
      {
        where: { deliveryId },
        transaction,
        returning: true
      }
    )
    expect(result).toBe(true)
  })

  test('should return false when no rows are updated', async () => {
    db.delivery.update.mockResolvedValue([0, {}])

    const result = await completeDelivery(deliveryId, transaction)

    expect(db.delivery.update).toHaveBeenCalled()
    expect(result).toBe(false)
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
