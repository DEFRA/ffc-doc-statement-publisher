const { DELIVERED, SENDING } = require('../../../app/constants/statuses')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const originalDateNow = global.Date.now
const mockGetNotificationById = jest.fn()
const mockNotifyClient = {
  getNotificationById: mockGetNotificationById
}

jest.mock('timers', () => {
  const originalTimers = jest.requireActual('timers')
  return {
    ...originalTimers,
    setInterval: jest.fn()
  }
})

const deliveryStatusModule = require('../../../app/monitoring/check-delivery-status')
const { checkDeliveryStatus, checkDeliveryStatuses, _testing } = deliveryStatusModule

describe('check delivery status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.Date.now = originalDateNow
    _testing.initialize()
    _testing.setNotifyClient(mockNotifyClient)
    mockGetNotificationById.mockResolvedValue({ data: { status: DELIVERED } })
  })

  afterAll(() => {
    global.Date.now = originalDateNow
  })

  describe('checkDeliveryStatus', () => {
    test('calls notify endpoint once', async () => {
      await checkDeliveryStatus(mockDelivery1.reference)
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
    })

    test('calls notify endpoint with reference', async () => {
      await checkDeliveryStatus(mockDelivery1.reference)
      expect(mockGetNotificationById).toHaveBeenCalledWith(mockDelivery1.reference)
    })

    test('returns delivery status', async () => {
      const result = await checkDeliveryStatus(mockDelivery1.reference)
      expect(result).toStrictEqual({ data: { status: DELIVERED } })
    })

    test('throws error when notify client throws', async () => {
      mockGetNotificationById.mockImplementationOnce(() => {
        throw new Error('Notify API error')
      })

      await expect(checkDeliveryStatus(mockDelivery1.reference))
        .rejects.toThrow('Notify API error')
    })

    test('uses cached result when called again within TTL', async () => {
      await checkDeliveryStatus(mockDelivery1.reference)
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
      mockGetNotificationById.mockClear()

      await checkDeliveryStatus(mockDelivery1.reference)
      expect(mockGetNotificationById).not.toHaveBeenCalled()

      await checkDeliveryStatus(mockDelivery2.reference)
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
    })

    test('refreshes cache after TTL expires', async () => {
      await checkDeliveryStatus(mockDelivery1.reference)
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
      mockGetNotificationById.mockClear()

      const currentTime = Date.now()
      global.Date.now = jest.fn().mockReturnValue(currentTime + 61000)

      await checkDeliveryStatus(mockDelivery1.reference)
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
    })
  })

  describe('checkDeliveryStatuses', () => {
    test('calls checkDeliveryStatus for each reference', async () => {
      const references = [mockDelivery1.reference, mockDelivery2.reference]

      mockGetNotificationById.mockImplementation((reference) => {
        if (reference === mockDelivery1.reference) {
          return Promise.resolve({ data: { status: DELIVERED } })
        } else {
          return Promise.resolve({ data: { status: SENDING } })
        }
      })

      const results = await checkDeliveryStatuses(references)

      expect(mockGetNotificationById).toHaveBeenCalledTimes(2)
      expect(mockGetNotificationById).toHaveBeenCalledWith(mockDelivery1.reference)
      expect(mockGetNotificationById).toHaveBeenCalledWith(mockDelivery2.reference)
      expect(results).toHaveLength(2)
      expect(results[0]).toStrictEqual({ data: { status: DELIVERED } })
      expect(results[1]).toStrictEqual({ data: { status: SENDING } })
    })

    test('returns empty array when no references provided', async () => {
      const results = await checkDeliveryStatuses([])
      expect(results).toHaveLength(0)
      expect(mockGetNotificationById).not.toHaveBeenCalled()
    })

    test('handles errors in individual status checks', async () => {
      const references = [mockDelivery1.reference, mockDelivery2.reference]
      mockGetNotificationById.mockImplementation((reference) => {
        if (reference === mockDelivery2.reference) {
          throw new Error('Failed check')
        }
        return Promise.resolve({ data: { status: DELIVERED } })
      })

      await expect(checkDeliveryStatuses(references)).rejects.toThrow('Failed check')
    })
  })

  describe('cache management', () => {
    test('handles cache collisions', async () => {
      await checkDeliveryStatus(mockDelivery1.reference)
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
      mockGetNotificationById.mockClear()

      await checkDeliveryStatus(mockDelivery2.reference)
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
      mockGetNotificationById.mockClear()

      await checkDeliveryStatus(mockDelivery1.reference)
      expect(mockGetNotificationById).not.toHaveBeenCalled()
    })
  })
})
