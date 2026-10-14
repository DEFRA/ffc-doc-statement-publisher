const { EMAIL } = require('../../../app/constants/methods')
const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['delivery'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getOutstandingDeliveries, processAllOutstandingDeliveries } = require('../../../app/monitoring/get-outstanding-deliveries')

describe('processGetOutstandingDeliveries', () => {
  beforeEach(() => {
    mockDb.builder.resolves([])
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('queries with default parameters', async () => {
    await getOutstandingDeliveries()

    expect(mockDb.builder.where).toHaveBeenCalledWith('deliveryId', '>', 0)
    expect(mockDb.builder.whereNotNull).toHaveBeenCalledWith('reference')
    expect(mockDb.builder.where).toHaveBeenCalledWith({ method: EMAIL, completed: null })
    expect(mockDb.builder.limit).toHaveBeenCalledWith(100)
    expect(mockDb.builder.orderBy).toHaveBeenCalledWith('deliveryId', 'asc')
  })

  test('applies a custom limit and lastProcessedId', async () => {
    await getOutstandingDeliveries({ limit: 50, lastProcessedId: 10 })

    expect(mockDb.builder.where).toHaveBeenCalledWith('deliveryId', '>', 10)
    expect(mockDb.builder.limit).toHaveBeenCalledWith(50)
  })

  test('joins the statement row when includeStatement is set', async () => {
    await getOutstandingDeliveries({ includeStatement: true })

    expect(mockDb.builder.leftJoin).toHaveBeenCalledWith('statements', 'statements.statementId', 'deliveries.statementId')
    expect(mockDb.builder.select).toHaveBeenCalledWith('deliveries.*', expect.anything())
  })

  test('does not join when includeStatement is not set', async () => {
    await getOutstandingDeliveries()

    expect(mockDb.builder.leftJoin).not.toHaveBeenCalled()
  })

  describe('processAllOutstandingDeliveries', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    test('processes deliveries in batches correctly', async () => {
      const batches = [
        [{ deliveryId: 1 }, { deliveryId: 2 }],
        [{ deliveryId: 3 }, { deliveryId: 4 }],
        []
      ]
      const mockGetDeliveries = jest.fn()
        .mockResolvedValueOnce(batches[0])
        .mockResolvedValueOnce(batches[1])
        .mockResolvedValueOnce(batches[2])
      const processFn = jest.fn().mockResolvedValue([{ success: true }, { success: true }])

      const result = await processAllOutstandingDeliveries(processFn, mockGetDeliveries, 2)

      expect(mockGetDeliveries).toHaveBeenCalledTimes(3)
      expect(mockGetDeliveries).toHaveBeenNthCalledWith(1, { limit: 2, lastProcessedId: 0 })
      expect(mockGetDeliveries).toHaveBeenNthCalledWith(2, { limit: 2, lastProcessedId: 2 })
      expect(mockGetDeliveries).toHaveBeenNthCalledWith(3, { limit: 2, lastProcessedId: 4 })
      expect(processFn).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ totalProcessed: 4, batchCount: 2 })
    })

    test.each([
      {
        name: 'counts only successful array results',
        processResult: [{ success: true }, { success: false }],
        expectedTotal: 1
      },
      {
        name: 'counts all when non-array results returned',
        processResult: 'success',
        expectedTotal: 2
      }
    ])('should $name', async ({ processResult, expectedTotal }) => {
      const mockDeliveries = [{ deliveryId: 1 }, { deliveryId: 2 }]
      const mockGetDeliveries = jest.fn()
        .mockResolvedValueOnce(mockDeliveries)
        .mockResolvedValueOnce([])

      const processFn = jest.fn().mockResolvedValue(processResult)
      const result = await processAllOutstandingDeliveries(processFn, mockGetDeliveries, 2)

      expect(processFn).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ totalProcessed: expectedTotal, batchCount: 1 })
    })

    test('returns zero totals when no deliveries found', async () => {
      const mockGetDeliveries = jest.fn().mockResolvedValueOnce([])
      const processFn = jest.fn()
      const result = await processAllOutstandingDeliveries(processFn, mockGetDeliveries, 2)
      expect(mockGetDeliveries).toHaveBeenCalledTimes(1)
      expect(processFn).not.toHaveBeenCalled()
      expect(result).toEqual({ totalProcessed: 0, batchCount: 0 })
    })

    test('throws error when processFn fails', async () => {
      const mockDeliveries = [{ deliveryId: 1 }]
      const mockGetDeliveries = jest.fn().mockResolvedValueOnce(mockDeliveries)
      const processFn = jest.fn().mockRejectedValue(new Error('Process failed'))

      await expect(processAllOutstandingDeliveries(processFn, mockGetDeliveries, 2))
        .rejects.toThrow('Process failed')
    })
  })
})
