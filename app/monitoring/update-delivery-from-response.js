const { INVALID, REJECTED } = require('../constants/failure-reasons')
const { DELIVERED, PERMANENT_FAILURE, TEMPORARY_FAILURE, TECHNICAL_FAILURE } = require('../constants/statuses')
const completeDelivery = require('./complete-delivery')
const failed = require('./failed')
const rescheduleDelivery = require('./reschedule-delivery')
const scheduleLetter = require('./schedule-letter')
const { EMAIL } = require('../constants/methods')

const updateDeliveryFromResponse = async (delivery, response) => {
  switch (response.data?.status) {
    case DELIVERED:
      await completeDelivery(delivery.deliveryId)
      break
    case PERMANENT_FAILURE:
      await failed(delivery, {
        reason: INVALID
      })
      if (delivery.method === EMAIL) {
        await scheduleLetter(delivery)
      }
      break
    case TEMPORARY_FAILURE:
      await failed(delivery, {
        reason: REJECTED
      })
      if (delivery.method === EMAIL) {
        await scheduleLetter(delivery)
      }
      break
    case TECHNICAL_FAILURE:
      await rescheduleDelivery(delivery)
      break
    default:
      break
  }
}

module.exports = updateDeliveryFromResponse
