const db = require('../../../app/data')
const saveDelivery = require('../../../app/publishing/save-delivery')

jest.mock('../../../app/data', () => ({
  delivery: {
    create: jest.fn()
  }
}))

describe('saveDelivery', () => {
  const transaction = {}

  test('should call db.delivery.create with correct parameters', async () => {
    const statementId = '123'
    const method = 'email'
    const reference = 'ref-456'
    const timestamp = new Date()

    await saveDelivery(statementId, method, reference, timestamp, transaction)

    expect(db.delivery.create).toHaveBeenCalledWith({
      statementId,
      method,
      reference,
      requested: timestamp
    }, { transaction })
  })

  test('should return the result of db.delivery.create', async () => {
    const statementId = '123'
    const method = 'email'
    const reference = 'ref-456'
    const timestamp = new Date()
    const mockResult = { id: '789' }

    db.delivery.create.mockResolvedValue(mockResult)

    const result = await saveDelivery(statementId, method, reference, timestamp, transaction)

    expect(result).toBe(mockResult)
  })

  test('should handle errors thrown by db.delivery.create', async () => {
    const statementId = '123'
    const method = 'email'
    const reference = 'ref-456'
    const timestamp = new Date()
    const error = new Error('Test error')

    db.delivery.create.mockRejectedValue(error)

    await expect(saveDelivery(statementId, method, reference, timestamp, transaction)).rejects.toThrow('Test error')
  })
})
