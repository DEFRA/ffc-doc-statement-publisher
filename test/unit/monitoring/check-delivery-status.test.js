const { DELIVERED } = require('../../../app/constants/statuses')
const mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: DELIVERED } })
jest.mock('notifications-node-client', () => {
  return {
    NotifyClient: jest.fn().mockImplementation(() => {
      return {
        getNotificationById: mockGetNotificationById
      }
    })
  }
})
const checkDeliveryStatus = require('../../../app/monitoring/check-delivery-status')
const { mockDelivery1 } = require('../../mocks/delivery')

describe('check delivery status', () => {
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
})
