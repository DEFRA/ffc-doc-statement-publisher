const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['delivery'])

jest.mock('../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const saveDelivery = require('../../../app/publishing/save-delivery')

describe('saveDelivery', () => {
  const transaction = mockDb.trx
  const timestamp = new Date()

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves([{ deliveryId: '789' }])
  })

  test.each([
    ['email', '123', 'ref-456'],
    ['letter', '124', 'ref-789']
  ])(
    'should insert a delivery row with correct parameters for method %s',
    async (method, statementId, reference) => {
      await saveDelivery(statementId, method, reference, timestamp, transaction)
      expect(mockDb.tables.delivery).toHaveBeenCalledWith(transaction)
      expect(mockDb.builder.insert).toHaveBeenCalledWith({
        statementId,
        method,
        reference,
        requested: timestamp
      })
      expect(mockDb.builder.returning).toHaveBeenCalledWith(['deliveryId'])
    }
  )

  test('should return the saved row', async () => {
    const result = await saveDelivery('123', 'email', 'ref-456', timestamp, transaction)
    expect(result).toEqual({ deliveryId: '789' })
  })

  test('should handle errors thrown while saving', async () => {
    const error = new Error('Test error')
    mockDb.builder.rejects(error)

    await expect(saveDelivery('123', 'email', 'ref-456', timestamp, transaction))
      .rejects.toThrow('Test error')
  })
})
