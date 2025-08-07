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

    response = {
      data: {
        id: 'test-id',
        reference: 'test-ref',
        status: DELIVERED
      }
    }
  })

  describe('When response is DELIVERED', () => {
    beforeEach(() => {
      response.data.status = DELIVERED
    })

    test('should call completeDelivery with correct parameters', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).toHaveBeenCalledWith(delivery.deliveryId)
      expect(completeDelivery).toHaveBeenCalledTimes(1)
    })

    test('should not call other handlers', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).not.toHaveBeenCalled()
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })
  })

  describe('When response is PERMANENT_FAILURE', () => {
    beforeEach(() => {
      response.data.status = PERMANENT_FAILURE
    })

    test('should call failed with correct parameters', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).toHaveBeenCalledWith(delivery, { reason: INVALID })
      expect(failed).toHaveBeenCalledTimes(1)
    })

    test('should not call other handlers', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).not.toHaveBeenCalled()
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })
  })

  describe('When response is TEMPORARY_FAILURE', () => {
    beforeEach(() => {
      response.data.status = TEMPORARY_FAILURE
    })

    test('should call failed with correct parameters', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).toHaveBeenCalledWith(delivery, { reason: REJECTED })
      expect(failed).toHaveBeenCalledTimes(1)
    })

    test('should not call other handlers', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).not.toHaveBeenCalled()
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })
  })

  describe('When response is TECHNICAL_FAILURE', () => {
    beforeEach(() => {
      response.data.status = TECHNICAL_FAILURE
    })

    test('should call rescheduleDelivery with correct parameters', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(rescheduleDelivery).toHaveBeenCalledWith(delivery)
      expect(rescheduleDelivery).toHaveBeenCalledTimes(1)
    })

    test('should not call other handlers', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).not.toHaveBeenCalled()
      expect(failed).not.toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    describe('When completeDelivery throws', () => {
      const error = new Error('Complete delivery failed')

      beforeEach(() => {
        response.data.status = DELIVERED
        completeDelivery.mockRejectedValue(error)
      })

      test('should propagate error', async () => {
        await expect(updateDeliveryFromResponse(delivery, response))
          .rejects.toThrow(error)
      })
    })

    describe('When failed throws', () => {
      const error = new Error('Failed to mark as failed')

      beforeEach(() => {
        response.data.status = PERMANENT_FAILURE
        failed.mockRejectedValue(error)
      })

      test('should propagate error', async () => {
        await expect(updateDeliveryFromResponse(delivery, response))
          .rejects.toThrow(error)
      })
    })

    describe('When rescheduleDelivery throws', () => {
      const error = new Error('Reschedule failed')

      beforeEach(() => {
        response.data.status = TECHNICAL_FAILURE
        rescheduleDelivery.mockRejectedValue(error)
      })

      test('should propagate error', async () => {
        await expect(updateDeliveryFromResponse(delivery, response))
          .rejects.toThrow(error)
      })
    })
  })

  describe('Invalid inputs', () => {
    test('should handle missing response.data', async () => {
      const result = await updateDeliveryFromResponse(delivery, {})
      expect(result).toBeUndefined()
      expect(completeDelivery).not.toHaveBeenCalled()
      expect(failed).not.toHaveBeenCalled()
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should handle null response', async () => {
      const result = await updateDeliveryFromResponse(delivery, null)
      expect(result).toBeUndefined()
      expect(completeDelivery).not.toHaveBeenCalled()
      expect(failed).not.toHaveBeenCalled()
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should handle undefined response', async () => {
      const result = await updateDeliveryFromResponse(delivery, undefined)
      expect(result).toBeUndefined()
      expect(completeDelivery).not.toHaveBeenCalled()
      expect(failed).not.toHaveBeenCalled()
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should handle invalid status', async () => {
      response.data.status = 'INVALID_STATUS'
      const result = await updateDeliveryFromResponse(delivery, response)
      expect(result).toBeUndefined()
      expect(completeDelivery).not.toHaveBeenCalled()
      expect(failed).not.toHaveBeenCalled()
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })
  })
})
