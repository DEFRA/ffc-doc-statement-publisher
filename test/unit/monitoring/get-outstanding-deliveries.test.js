const db = require('../../../app/data')
const { getOutstandingDeliveries, processAllOutstandingDeliveries } = require('../../../app/monitoring/get-outstanding-deliveries')

jest.mock('../../../app/data', () => {
  return {
    Sequelize: {
      Op: {
        not: Symbol('not')
      }
    },
    delivery: {
      findAll: jest.fn()
    },
    statement: {}
  }
})

describe('getOutstandingDeliveries', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should call findAll with default parameters', async () => {
    await getOutstandingDeliveries()
    expect(db.delivery.findAll).toHaveBeenCalledWith({
      where: {
        reference: { [db.Sequelize.Op.not]: null },
        completed: null
      },
      limit: 100,
      offset: 0,
      order: [['requested', 'ASC']]
    })
  })

  test('should call findAll with custom limit and offset', async () => {
    await getOutstandingDeliveries({ limit: 50, offset: 10 })
    expect(db.delivery.findAll).toHaveBeenCalledWith(expect.objectContaining({
      limit: 50,
      offset: 10
    }))
  })

  test('should include statement when includeStatement is true', async () => {
    await getOutstandingDeliveries({ includeStatement: true })
    expect(db.delivery.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: [{
        model: db.statement,
        as: 'statement',
        required: false
      }]
    }))
  })
})

describe('processAllOutstandingDeliveries', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should process one batch when fewer deliveries than batchSize', async () => {
    const mockGetDeliveries = jest.fn()
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([])

    const processFn = jest.fn().mockResolvedValue([{ success: true }, { success: true }])
    const result = await processAllOutstandingDeliveries(processFn, mockGetDeliveries, 10)

    expect(mockGetDeliveries).toHaveBeenCalledTimes(2)
    expect(mockGetDeliveries).toHaveBeenNthCalledWith(1, { limit: 10, offset: 0 })
    expect(mockGetDeliveries).toHaveBeenNthCalledWith(2, { limit: 10, offset: 10 })
    expect(processFn).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ totalProcessed: 2, batchCount: 1 })
  })

  test('should process multiple batches when deliveries exceed batchSize', async () => {
    const mockGetDeliveries = jest.fn()
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([{ id: 3 }, { id: 4 }])
      .mockResolvedValueOnce([])

    const processFn = jest.fn().mockResolvedValue([{ success: true }, { success: true }])
    const result = await processAllOutstandingDeliveries(processFn, mockGetDeliveries, 2)

    expect(mockGetDeliveries).toHaveBeenCalledTimes(3)
    expect(mockGetDeliveries).toHaveBeenNthCalledWith(1, { limit: 2, offset: 0 })
    expect(mockGetDeliveries).toHaveBeenNthCalledWith(2, { limit: 2, offset: 2 })
    expect(mockGetDeliveries).toHaveBeenNthCalledWith(3, { limit: 2, offset: 4 })
    expect(processFn).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ totalProcessed: 4, batchCount: 2 })
  })

  test('should count successful operations when array results returned', async () => {
    const mockGetDeliveries = jest.fn()
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([])

    const processFn = jest.fn().mockResolvedValue([
      { success: true },
      { success: false }
    ])

    const result = await processAllOutstandingDeliveries(processFn, mockGetDeliveries, 2)
    expect(processFn).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ totalProcessed: 1, batchCount: 1 })
  })

  test('should count all items when non-array results returned', async () => {
    const mockGetDeliveries = jest.fn()
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([])

    const processFn = jest.fn().mockResolvedValue('success')
    const result = await processAllOutstandingDeliveries(processFn, mockGetDeliveries, 2)
    expect(result).toEqual({ totalProcessed: 2, batchCount: 1 })
  })

  test('should return zero totals when no deliveries found', async () => {
    const mockGetDeliveries = jest.fn().mockResolvedValueOnce([])
    const processFn = jest.fn()
    const result = await processAllOutstandingDeliveries(processFn, mockGetDeliveries, 2)
    expect(mockGetDeliveries).toHaveBeenCalledTimes(1)
    expect(processFn).not.toHaveBeenCalled()
    expect(result).toEqual({ totalProcessed: 0, batchCount: 0 })
  })
})
