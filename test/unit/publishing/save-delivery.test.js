const db = require('../../../app/data')
const saveDelivery = require('../../../app/publishing/save-delivery')

jest.mock('../../../app/data', () => ({
  delivery: {
    create: jest.fn()
  }
}))

describe('saveDelivery', () => {
  const transaction = {}
  const timestamp = new Date()

  afterEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    ['email', '123', 'ref-456'],
    ['letter', '124', 'ref-789']
  ])(
    'should call db.delivery.create with correct parameters for method %s',
    async (method, statementId, reference) => {
      await saveDelivery(statementId, method, reference, timestamp, transaction)
      expect(db.delivery.create).toHaveBeenCalledWith({
        statementId,
        method,
        reference,
        requested: timestamp
      }, { transaction })
    }
  )

  test('should return the result of db.delivery.create', async () => {
    const mockResult = { id: '789' }
    db.delivery.create.mockResolvedValue(mockResult)

    const result = await saveDelivery('123', 'email', 'ref-456', timestamp, transaction)
    expect(result).toBe(mockResult)
  })

  test('should handle errors thrown by db.delivery.create', async () => {
    const error = new Error('Test error')
    db.delivery.create.mockRejectedValue(error)

    await expect(saveDelivery('123', 'email', 'ref-456', timestamp, transaction))
      .rejects.toThrow('Test error')
  })
})
