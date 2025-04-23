const { checkDeliveryStatus } = require('./check-delivery-status')
const { processAllOutstandingDeliveries } = require('./get-outstanding-deliveries')
const updateDeliveryFromResponse = require('./update-delivery-from-response')
const batchSize = 20
const updateDeliveries = async () => {
  try {
    console.log('Starting delivery status update process')
    const startTime = Date.now()

    const { totalProcessed, batchCount } = await processAllOutstandingDeliveries(async (deliveryBatch) => {
      const promises = deliveryBatch.map(async (delivery) => {
        try {
          const response = await checkDeliveryStatus(delivery.reference)
          await updateDeliveryFromResponse(delivery, response)
          return { success: true, deliveryId: delivery.deliveryId }
        } catch (error) {
          console.error(`Failed to update delivery ${delivery.deliveryId}:`, error.message)
          return { success: false, deliveryId: delivery.deliveryId, error: error.message }
        }
      })

      return Promise.all(promises)
    },
    null,
    batchSize)

    const duration = (Date.now() - startTime) / 1000
    console.log(`Completed delivery status update: processed ${totalProcessed} deliveries in ${batchCount} batches (${duration.toFixed(2)}s)`)

    return { totalProcessed, duration }
  } catch (error) {
    console.error('Error in updateDeliveries:', error)
    throw error
  }
}

module.exports = updateDeliveries
