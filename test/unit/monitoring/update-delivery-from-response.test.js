jest.mock('../../../app/monitoring/complete-delivery')
const completeDelivery = require('../../../app/monitoring/complete-delivery')

jest.mock('../../../app/monitoring/failed')
const failed = require('../../../app/monitoring/failed')

jest.mock('../../../app/monitoring/reschedule-delivery')
const rescheduleDelivery = require('../../../app/monitoring/reschedule-delivery')

const updateDeliveryFromResponse = require('../../../app/monitoring/update-delivery-from-response')
const { mockDelivery1: delivery } = require('../../mocks/delivery')
const { INVALID, REJECTED } = require('../../../app/constants/failure-reasons')
const { DELIVERED, PERMANENT_FAILURE, TEMPORARY_FAILURE, TECHNICAL_FAILURE } = require('../../../app/constants/statuses')

describe('updateDeliveryFromResponse', () => {
  let response

  beforeEach(() => {
    jest.clearAllMocks()
    completeDelivery.mockResolvedValue(undefined)
    failed.mockResolvedValue(undefined)
    rescheduleDelivery.mockResolvedValue(undefined)

    response = { data: { id: 'test-id', reference: 'test-ref', status: DELIVERED } }
  })

  const statusCases = [
    { status: DELIVERED, handler: completeDelivery, args: [delivery.deliveryId], otherHandlers: [failed, rescheduleDelivery] },
    { status: PERMANENT_FAILURE, handler: failed, args: [delivery, { reason: INVALID }], otherHandlers: [completeDelivery, rescheduleDelivery] },
    { status: TEMPORARY_FAILURE, handler: failed, args: [delivery, { reason: REJECTED }], otherHandlers: [completeDelivery, rescheduleDelivery] },
    { status: TECHNICAL_FAILURE, handler: rescheduleDelivery, args: [delivery], otherHandlers: [completeDelivery, failed] }
  ]

  test.each(statusCases)('handles $status correctly', async ({ status, handler, args, otherHandlers }) => {
    response.data.status = status
    await updateDeliveryFromResponse(delivery, response)

    expect(handler).toHaveBeenCalledWith(...args)
    expect(handler).toHaveBeenCalledTimes(1)
    otherHandlers.forEach(h => expect(h).not.toHaveBeenCalled())
  })

  describe('Error handling', () => {
    const errorCases = [
      { status: DELIVERED, handler: completeDelivery, errorMsg: 'Complete delivery failed' },
      { status: PERMANENT_FAILURE, handler: failed, errorMsg: 'Failed to mark as failed' },
      { status: TECHNICAL_FAILURE, handler: rescheduleDelivery, errorMsg: 'Reschedule failed' }
    ]

    test.each(errorCases)('propagates error when $status handler throws', async ({ status, handler, errorMsg }) => {
      const error = new Error(errorMsg)
      response.data.status = status
      handler.mockRejectedValue(error)
      await expect(updateDeliveryFromResponse(delivery, response)).rejects.toThrow(error)
    })
  })

  describe('Invalid inputs', () => {
    test.each([
      { input: {} },
      { input: null },
      { input: undefined }
    ])('handles missing response (%o)', async ({ input }) => {
      const result = await updateDeliveryFromResponse(delivery, input)
      expect(result).toBeUndefined()
      expect(completeDelivery).not.toHaveBeenCalled()
      expect(failed).not.toHaveBeenCalled()
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('handles invalid status', async () => {
      response.data.status = 'INVALID_STATUS'
      const result = await updateDeliveryFromResponse(delivery, response)
      expect(result).toBeUndefined()
      expect(completeDelivery).not.toHaveBeenCalled()
      expect(failed).not.toHaveBeenCalled()
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })
  })
})
