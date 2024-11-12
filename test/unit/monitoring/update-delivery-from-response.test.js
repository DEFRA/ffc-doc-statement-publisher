jest.mock('../../../app/monitoring/complete-delivery')
const completeDelivery = require('../../../app/monitoring/complete-delivery')

jest.mock('../../../app/monitoring/failed')
const failed = require('../../../app/monitoring/failed')

jest.mock('../../../app/monitoring/reschedule-delivery')
const rescheduleDelivery = require('../../../app/monitoring/reschedule-delivery')

jest.mock('../../../app/monitoring/schedule-letter')
const scheduleLetter = require('../../../app/monitoring/schedule-letter')

const updateDeliveryFromResponse = require('../../../app/monitoring/update-delivery-from-response')

const { mockDelivery1: delivery } = require('../../mocks/delivery')
const { INVALID, REJECTED } = require('../../../app/constants/failure-reasons')

let response

describe('Decide next step from Notify delivery reponse', () => {
  beforeEach(() => {
    completeDelivery.mockResolvedValue(undefined)
    failed.mockResolvedValue(undefined)
    rescheduleDelivery.mockResolvedValue(undefined)
    scheduleLetter.mockResolvedValue(undefined)

    response = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_DELIVERED))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When response is DELIVERED', () => {
    beforeEach(() => {
      response = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_DELIVERED))
    })

    test('should call completeDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).toHaveBeenCalled()
    })

    test('should call completeDelivery once', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).toHaveBeenCalledTimes(1)
    })

    test('should call completeDelivery with delivery.deliveryId', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).toHaveBeenCalledWith(delivery.deliveryId)
    })

    test('should not call failed', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).not.toHaveBeenCalled()
    })

    test('should not call rescheduleDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should not throw', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).not.toThrow()
    })

    test('should return undefined', async () => {
      const result = await updateDeliveryFromResponse(delivery, response)
      expect(result).toBeUndefined()
    })
  })

  describe('When response is PERMANENT_FAILURE', () => {
    beforeEach(() => {
      response = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_PERMANENT_FAILURE))
    })

    test('should call failed', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).toHaveBeenCalled()
    })

    test('should call failed once', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).toHaveBeenCalledTimes(1)
    })

    test('should call failed with delivery and INVALID', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).toHaveBeenCalledWith(delivery, { reason: INVALID })
    })

    test('should not call completeDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).not.toHaveBeenCalled()
    })

    test('should not call rescheduleDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should not throw', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).not.toThrow()
    })

    test('should return undefined', async () => {
      const result = await updateDeliveryFromResponse(delivery, response)
      expect(result).toBeUndefined()
    })
  })

  describe('When response is TEMPORARY_FAILURE', () => {
    beforeEach(() => {
      response = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_TEMPORARY_FAILURE))
    })

    test('should call failed', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).toHaveBeenCalled()
    })

    test('should call failed once', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).toHaveBeenCalledTimes(1)
    })

    test('should call failed with delivery and REJECTED', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).toHaveBeenCalledWith(delivery, { reason: REJECTED })
    })

    test('should not call completeDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).not.toHaveBeenCalled()
    })

    test('should not call rescheduleDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should not throw', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).not.toThrow()
    })

    test('should return undefined', async () => {
      const result = await updateDeliveryFromResponse(delivery, response)
      expect(result).toBeUndefined()
    })
  })

  describe('When response is TECHNICAL_FAILURE', () => {
    beforeEach(() => {
      response = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_TECHNICAL_FAILURE))
    })

    test('should call rescheduleDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(rescheduleDelivery).toHaveBeenCalled()
    })

    test('should call rescheduleDelivery once', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(rescheduleDelivery).toHaveBeenCalledTimes(1)
    })

    test('should call rescheduleDelivery with delivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(rescheduleDelivery).toHaveBeenCalledWith(delivery)
    })

    test('should not call completeDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).not.toHaveBeenCalled()
    })

    test('should not call failed', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).not.toHaveBeenCalled()
    })

    test('should not throw', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).not.toThrow()
    })

    test('should return undefined', async () => {
      const result = await updateDeliveryFromResponse(delivery, response)
      expect(result).toBeUndefined()
    })
  })

  describe('When response status is invalid', () => {
    beforeEach(() => {
      response.data.status = 'Invalid response'
    })

    test('should not call completeDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(completeDelivery).not.toHaveBeenCalled()
    })

    test('should not call failed', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(failed).not.toHaveBeenCalled()
    })

    test('should not call rescheduleDelivery', async () => {
      await updateDeliveryFromResponse(delivery, response)
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should not throw', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).not.toThrow()
    })

    test('should return undefined', async () => {
      const result = await updateDeliveryFromResponse(delivery, response)
      expect(result).toBeUndefined()
    })
  })

  describe('When response object is invalid', () => {
    beforeEach(() => {
      response = {}
    })

    test('should not call completeDelivery', async () => {
      try { await updateDeliveryFromResponse(delivery, response) } catch {}
      expect(completeDelivery).not.toHaveBeenCalled()
    })

    test('should not call failed', async () => {
      try { await updateDeliveryFromResponse(delivery, response) } catch {}
      expect(failed).not.toHaveBeenCalled()
    })

    test('should not call rescheduleDelivery', async () => {
      try { await updateDeliveryFromResponse(delivery, response) } catch {}
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should not throw', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).not.toThrow()
    })

    test('should return undefined', async () => {
      const result = await updateDeliveryFromResponse(delivery, response)
      expect(result).toBeUndefined()
    })
  })

  describe('When completeDelivery throws', () => {
    beforeEach(() => {
      completeDelivery.mockRejectedValue(new Error('Issue saving down database'))
      response = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_DELIVERED))
    })

    test('should not call failed', async () => {
      try { await updateDeliveryFromResponse(delivery, response) } catch {}
      expect(failed).not.toHaveBeenCalled()
    })

    test('should not call rescheduleDelivery', async () => {
      try { await updateDeliveryFromResponse(delivery, response) } catch {}
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should throw', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).rejects.toThrow()
    })

    test('should throw Error', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).rejects.toThrow(Error)
    })

    test('should throw error "Issue saving down database"', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).rejects.toThrow(/^Issue saving down database$/)
    })
  })

  describe('When failed throws', () => {
    beforeEach(() => {
      failed.mockRejectedValue(new Error('Issue marking delivery as failed'))
      response = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_PERMANENT_FAILURE))
    })

    test('should not call completeDelivery', async () => {
      try { await updateDeliveryFromResponse(delivery, response) } catch {}
      expect(completeDelivery).not.toHaveBeenCalled()
    })

    test('should not call rescheduleDelivery', async () => {
      try { await updateDeliveryFromResponse(delivery, response) } catch {}
      expect(rescheduleDelivery).not.toHaveBeenCalled()
    })

    test('should throw', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).rejects.toThrow()
    })

    test('should throw Error', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).rejects.toThrow(Error)
    })

    test('should throw error "Issue marking delivery as failed"', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).rejects.toThrow(/^Issue marking delivery as failed$/)
    })
  })

  describe('When rescheduleDelivery throws', () => {
    beforeEach(() => {
      rescheduleDelivery.mockRejectedValue(new Error('Issue rescheduling delivery'))
      response = JSON.parse(JSON.stringify(require('../../mocks/objects/notify-response').NOTIFY_RESPONSE_TECHNICAL_FAILURE))
    })

    test('should not call completeDelivery', async () => {
      try { await updateDeliveryFromResponse(delivery, response) } catch {}
      expect(completeDelivery).not.toHaveBeenCalled()
    })

    test('should not call failed', async () => {
      try { await updateDeliveryFromResponse(delivery, response) } catch {}
      expect(failed).not.toHaveBeenCalled()
    })

    test('should throw', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).rejects.toThrow()
    })

    test('should throw Error', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).rejects.toThrow(Error)
    })

    test('should throw error "Issue rescheduling delivery"', async () => {
      const wrapper = async () => { await updateDeliveryFromResponse(delivery, response) }
      expect(wrapper).rejects.toThrow(/^Issue rescheduling delivery$/)
    })
  })
})
