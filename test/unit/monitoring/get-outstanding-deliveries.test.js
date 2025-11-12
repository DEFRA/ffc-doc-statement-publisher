const { EMAIL } = require('../../../app/constants/methods')
const db = require('../../../app/data')
const { getOutstandingDeliveries, processAllOutstandingDeliveries } = require('../../../app/monitoring/get-outstanding-deliveries')

jest.mock('../../../app/data', () => ({
  Sequelize: { Op: { not: Symbol('not'), gt: Symbol('gt') } },
  delivery: { findAll: jest.fn() },
  statement: {}
}))

describe('processGetOutstandingDeliveries', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should call findAll with default parameters', async () => {
    await getOutstandingDeliveries()
    expect(db.delivery.findAll).toHaveBeenCalledWith({
      where: {
        deliveryId: { [db.Sequelize.Op.gt]: 0 },
        reference: { [db.Sequelize.Op.not]: null },
        method: EMAIL,
        completed: null
      },
      limit: 100,
      order: [['deliveryId', 'ASC']]
    })
  })

  test.each([
    {
      params: { limit: 50, lastProcessedId: 10 },
      expectedWhere: {
        deliveryId: { [db.Sequelize.Op.gt]: 10 }
      },
      expectedLimit: 50
    },
    {
      params: { includeStatement: true },
      expectedInclude: true
    }
  ])('should call findAll with custom parameters %#', async ({ params, expectedWhere, expectedLimit, expectedInclude }) => {
    await getOutstandingDeliveries(params)
    const call = db.delivery.findAll.mock.calls[0][0]

    if (expectedWhere) {
      expect(call.where).toEqual(expect.objectContaining({
        ...expectedWhere,
        method: EMAIL,
        reference: { [db.Sequelize.Op.not]: null },
        completed: null
      }))
    }

    if (expectedLimit) {
      expect(call.limit).toBe(expectedLimit)
    }

    if (expectedInclude) {
      expect(call.include).toEqual([{
        model: db.statement,
        as: 'statement',
        required: false
      }])
    }
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
