const { DELIVERED, SENDING } = require('../../../app/constants/statuses')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const originalDateNow = global.Date.now
const createStatusResponse = (status) => ({
  data: { status }
})
const mockGetNotificationById = jest.fn()
const mockNotifyClient = {
  getNotificationById: mockGetNotificationById
}

jest.mock('notifications-node-client', () => {
  return {
    NotifyClient: jest.fn().mockImplementation(() => mockNotifyClient)
  }
})

jest.mock('timers', () => {
  return {
    ...jest.requireActual('timers'),
    setInterval: jest.fn().mockReturnValue(99999)
  }
})

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
      _testing.initialize()
      _testing.setNotifyClient(mockNotifyClient)
      mockGetNotificationById.mockImplementationOnce((ref) => {
        if (ref !== mockDelivery1.reference) {
          throw new Error(`Expected ${mockDelivery1.reference}, got ${ref}`)
        }
        return Promise.resolve(createStatusResponse(DELIVERED))
      })

      mockGetNotificationById.mockImplementationOnce((ref) => {
        if (ref !== mockDelivery2.reference) {
          throw new Error(`Expected ${mockDelivery2.reference}, got ${ref}`)
        }
        return Promise.resolve(createStatusResponse(SENDING))
      })

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
  })

  describe('checkDeliveryStatuses', () => {
    test('calls checkDeliveryStatus for each reference', async () => {
      _testing.initialize()
      _testing.setNotifyClient(mockNotifyClient)

      mockGetNotificationById.mockReset()

      mockGetNotificationById.mockImplementationOnce(() => {
        return Promise.resolve(createStatusResponse(DELIVERED))
      })

      mockGetNotificationById.mockImplementationOnce(() => {
        return Promise.resolve(createStatusResponse(SENDING))
      })

      const references = [mockDelivery1.reference, mockDelivery2.reference]
      const results = await checkDeliveryStatuses(references)

      expect(results).toHaveLength(2)
      expect(results[0]).toStrictEqual(createStatusResponse(DELIVERED))
      expect(results[1]).toStrictEqual(createStatusResponse(SENDING))

      expect(mockGetNotificationById).toHaveBeenCalledTimes(2)
    })
  })

  describe('cache management', () => {
    test('handles cache collisions', async () => {
      _testing.initialize()
      _testing.setNotifyClient(mockNotifyClient)

      mockGetNotificationById.mockReset()

      mockGetNotificationById.mockImplementationOnce(() => {
        return Promise.resolve(createStatusResponse(DELIVERED))
      })

      mockGetNotificationById.mockImplementationOnce(() => {
        return Promise.resolve(createStatusResponse(SENDING))
      })

      const result1 = await checkDeliveryStatus(mockDelivery1.reference)
      expect(result1).toStrictEqual(createStatusResponse(DELIVERED))
      expect(mockGetNotificationById).toHaveBeenCalledTimes(1)

      const result2 = await checkDeliveryStatus(mockDelivery2.reference)
      expect(result2).toStrictEqual(createStatusResponse(SENDING))
      expect(mockGetNotificationById).toHaveBeenCalledTimes(2)
    })
  })
})
