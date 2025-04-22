const { DELIVERED, SENDING } = require('../../../app/constants/statuses')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const CACHE_TTL = 60000
const originalDateNow = global.Date.now
const createStatusResponse = (status) => ({
  data: { status }
})
const mockGetNotificationById = jest.fn()
const mockNotifyClient = {
  getNotificationById: mockGetNotificationById
}

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn(() => mockNotifyClient)
}))

const deliveryStatusModule = require('../../../app/monitoring/check-delivery-status')
const { checkDeliveryStatus, checkDeliveryStatuses, _testing } = deliveryStatusModule

describe('check delivery status', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { })
    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'info').mockImplementation(() => { })
    jest.spyOn(console, 'warn').mockImplementation(() => { })
  })

  beforeEach(() => {
    jest.clearAllMocks()
    global.Date.now = originalDateNow

    _testing.initialize()
    _testing.setNotifyClient(mockNotifyClient)
    mockGetNotificationById.mockReset()
  })

  afterAll(() => {
    global.Date.now = originalDateNow
    console.error.mockRestore()
    console.log.mockRestore()
    console.info.mockRestore()
    console.warn.mockRestore()
  })

  describe('checkDeliveryStatus', () => {
    test('uses cached result when called again within TTL', async () => {
      mockGetNotificationById.mockImplementationOnce(() =>
        Promise.resolve(createStatusResponse(DELIVERED))
      )
      mockGetNotificationById.mockImplementationOnce(() =>
        Promise.resolve(createStatusResponse(SENDING))
      )

      const result1 = await checkDeliveryStatus(mockDelivery1.reference)
      expect(result1).toStrictEqual(createStatusResponse(DELIVERED))
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)

      const result1Cached = await checkDeliveryStatus(mockDelivery1.reference)
      expect(result1Cached).toStrictEqual(createStatusResponse(DELIVERED))
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1) // Should not increase

      const result2 = await checkDeliveryStatus(mockDelivery2.reference)
      expect(result2).toStrictEqual(createStatusResponse(SENDING))
      expect(mockGetNotificationById).toHaveBeenCalledTimes(2) // Should increase
    })

    test('throws error when notifyClient.getNotificationById fails', async () => {
      const testError = new Error('API failure')
      mockGetNotificationById.mockRejectedValue(testError)

      await expect(checkDeliveryStatus(mockDelivery1.reference)).rejects.toThrow(testError)
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith(
        `Error checking delivery status for ${mockDelivery1.reference}:`,
        testError.message
      )
    })

    test('fetches new data when cached item is expired', async () => {
      mockGetNotificationById.mockResolvedValueOnce(createStatusResponse(DELIVERED))
      await checkDeliveryStatus(mockDelivery1.reference)
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)

      mockGetNotificationById.mockReset()

      const futureTime = Date.now() + CACHE_TTL + 1000
      global.Date.now = jest.fn(() => futureTime)

      mockGetNotificationById.mockResolvedValueOnce(createStatusResponse(SENDING))
      const result = await checkDeliveryStatus(mockDelivery1.reference)

      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(createStatusResponse(SENDING))
    })

    test('handles null or undefined reference', async () => {
      mockGetNotificationById.mockReset()

      mockGetNotificationById.mockImplementation(() => {
        return Promise.resolve({ data: { status: 'UNKNOWN' } })
      })

      await checkDeliveryStatus(null)
      await checkDeliveryStatus(undefined)

      expect(mockGetNotificationById).toHaveBeenCalledTimes(2)
      expect(mockGetNotificationById).toHaveBeenNthCalledWith(1, null)
      expect(mockGetNotificationById).toHaveBeenNthCalledWith(2, undefined)
    })
  })

  describe('checkDeliveryStatuses', () => {
    test('calls checkDeliveryStatus for each reference', async () => {
      mockGetNotificationById.mockResolvedValueOnce(createStatusResponse(DELIVERED))
      mockGetNotificationById.mockResolvedValueOnce(createStatusResponse(SENDING))

      const references = [mockDelivery1.reference, mockDelivery2.reference]
      const results = await checkDeliveryStatuses(references)

      expect(results).toHaveLength(2)
      expect(results[0]).toStrictEqual(createStatusResponse(DELIVERED))
      expect(results[1]).toStrictEqual(createStatusResponse(SENDING))

      expect(mockGetNotificationById).toHaveBeenCalledTimes(2)
    })

    test('handles empty references array', async () => {
      const results = await checkDeliveryStatuses([])
      expect(results).toEqual([])
      expect(mockGetNotificationById).not.toHaveBeenCalled()
    })
  })

  describe('cache management', () => {
    test('handles cache collisions', async () => {
      mockGetNotificationById.mockResolvedValueOnce(createStatusResponse(DELIVERED))
      mockGetNotificationById.mockResolvedValueOnce(createStatusResponse(SENDING))

      const result1 = await checkDeliveryStatus(mockDelivery1.reference)
      expect(result1).toStrictEqual(createStatusResponse(DELIVERED))
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)

      const result2 = await checkDeliveryStatus(mockDelivery2.reference)
      expect(result2).toStrictEqual(createStatusResponse(SENDING))
      expect(mockGetNotificationById).toHaveBeenCalledTimes(2)
    })

    test('cleans up expired cache entries using Jest timers', async () => {
      jest.useFakeTimers()

      _testing.initialize()

      const cache = _testing.getCache()
      cache.set('status:test1', { data: 'data1', timestamp: Date.now() })
      cache.set('status:test2', { data: 'data2', timestamp: Date.now() - CACHE_TTL - 1000 })

      expect(cache.size).toBe(2)

      jest.runOnlyPendingTimers()

      expect(cache.size).toBe(1)
      expect(cache.has('status:test1')).toBe(true)
      expect(cache.has('status:test2')).toBe(false)

      jest.useRealTimers()
    })

    test('initialize sets up a cache', () => {
      jest.clearAllMocks()

      _testing.initialize()

      const cache = _testing.getCache()
      expect(cache).toBeDefined()
      expect(cache instanceof Map).toBeTruthy()
      expect(cache.size).toBe(0)
    })
  })
})
