const mockProcessAllOutstandingDeliveries = jest.fn()
jest.mock('../../../app/monitoring/get-outstanding-deliveries', () => ({
  processAllOutstandingDeliveries: mockProcessAllOutstandingDeliveries
}))

const mockCheckDeliveryStatus = jest.fn()
jest.mock('../../../app/monitoring/check-delivery-status', () => ({
  checkDeliveryStatus: mockCheckDeliveryStatus
}))

const mockUpdateDeliveryFromResponse = jest.fn()
jest.mock('../../../app/monitoring/update-delivery-from-response', () => mockUpdateDeliveryFromResponse)

const { DELIVERED, SENDING, CREATED, TEMPORARY_FAILURE, PERMANENT_FAILURE, TECHNICAL_FAILURE } = require('../../../app/constants/statuses')
const { INVALID, REJECTED } = require('../../../app/constants/failure-reasons')
const updateDeliveries = require('../../../app/monitoring/update-deliveries')

describe('updateDeliveries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })

    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const deliveries = [{ deliveryId: 'test-id', reference: 'test-ref' }]
      await processFn(deliveries)
      return { totalProcessed: deliveries.length, batchCount: 1 }
    })

    mockCheckDeliveryStatus.mockResolvedValue({ data: { status: DELIVERED } })
    mockUpdateDeliveryFromResponse.mockResolvedValue()
  })

  afterEach(() => {
    console.log.mockRestore()
    console.error.mockRestore()
    jest.useRealTimers()
  })

  test('should return object with totalProcessed and duration', async () => {
    jest.useFakeTimers()
    const now = Date.now()
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now + 1000)

    const result = await updateDeliveries()

    expect(result).toHaveProperty('totalProcessed', 1)
    expect(result).toHaveProperty('duration', 1)
  })

  test('should process deliveries in batches', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const batch1 = [{ deliveryId: '1', reference: 'ref1' }]
      const batch2 = [{ deliveryId: '2', reference: 'ref2' }]

      await processFn(batch1)
      await processFn(batch2)

      return { totalProcessed: 2, batchCount: 2 }
    })

    const result = await updateDeliveries()

    expect(result.totalProcessed).toBe(2)
    expect(mockProcessAllOutstandingDeliveries).toHaveBeenCalledWith(expect.any(Function), null, 10)
    expect(mockCheckDeliveryStatus).toHaveBeenCalledTimes(2)
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledTimes(2)
  })

  test('should handle errors in individual delivery processing', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const deliveries = [
        { deliveryId: '1', reference: 'ref1' },
        { deliveryId: '2', reference: 'ref2' }
      ]

      mockCheckDeliveryStatus.mockImplementation((reference) => {
        if (reference === 'ref2') {
          throw new Error('Test error')
        }
        return Promise.resolve({ data: { status: DELIVERED } })
      })

      const results = await processFn(deliveries)

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBeDefined()

      return { totalProcessed: 2, batchCount: 1 }
    })

    await updateDeliveries()

    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update delivery 2'),
      'Test error'
    )
  })

  test('should handle overall process errors', async () => {
    mockProcessAllOutstandingDeliveries.mockRejectedValue(new Error('Process failed'))

    await expect(updateDeliveries()).rejects.toThrow('Process failed')
    expect(console.error).toHaveBeenCalledWith(
      'Error in updateDeliveries:',
      expect.objectContaining({ message: 'Process failed' })
    )
  })

  test.each([
    DELIVERED, SENDING, CREATED, TEMPORARY_FAILURE, PERMANENT_FAILURE, TECHNICAL_FAILURE
  ])('should handle delivery status %s', async (status) => {
    mockCheckDeliveryStatus.mockResolvedValue({ data: { status } })

    await updateDeliveries()

    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryId: 'test-id' }),
      { data: { status } }
    )
  })

  test('should handle empty batch', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      await processFn([])
      return { totalProcessed: 0, batchCount: 0 }
    })

    const result = await updateDeliveries()

    expect(result.totalProcessed).toBe(0)
    expect(mockCheckDeliveryStatus).not.toHaveBeenCalled()
    expect(mockUpdateDeliveryFromResponse).not.toHaveBeenCalled()
  })

  test('should log start and completion messages', async () => {
    await updateDeliveries()

    expect(console.log).toHaveBeenCalledWith('Starting delivery status update process')
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Completed delivery status update: processed 1 deliveries in 1 batches')
    )
  })

  test('should calculate duration correctly', async () => {
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2500)

    const result = await updateDeliveries()
    expect(result.duration).toBe(1.5)
  })

  test.each([
    { reason: INVALID, message: 'Invalid request' },
    { reason: REJECTED, message: 'Rejected request' }
  ])('should handle error reason %s', async ({ reason, message }) => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const deliveries = [{ deliveryId: 'test-id', reference: 'test-ref' }]
      mockCheckDeliveryStatus.mockImplementation(() => {
        const error = new Error(message)
        error.reason = reason
        throw error
      })
      await processFn(deliveries)
      return { totalProcessed: 1, batchCount: 1 }
    })

    await updateDeliveries()

    expect(mockCheckDeliveryStatus).toHaveBeenCalledTimes(1)
    expect(mockUpdateDeliveryFromResponse).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update delivery test-id'),
      message
    )
  })
})
