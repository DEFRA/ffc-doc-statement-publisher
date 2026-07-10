const { checkDeliveryStatus } = require('./check-delivery-status')
const { processAllOutstandingDeliveries } = require('./get-outstanding-deliveries')
const updateDeliveryFromResponse = require('./update-delivery-from-response')
const { sendAlert } = require('../alert')

const batchSize = 10
const CONCURRENCY = 3
const FAILURE_RATE_THRESHOLD = 0.5

const createConcurrencyLimiter = (concurrency) => {
  let running = 0
  const queue = []
  return (fn) => new Promise((resolve, reject) => {
    const run = async () => {
      running++
      try {
        resolve(await fn())
      } catch (err) {
        reject(err)
      } finally {
        running--
        if (queue.length > 0) {
          queue.shift()()
        }
      }
    }
    running < concurrency ? run() : queue.push(run)
  })
}

const updateDeliveries = async () => {
  try {
    console.log('Starting delivery status update process')
    const startTime = Date.now()

    const { totalProcessed, batchCount } = await processAllOutstandingDeliveries(async (deliveryBatch) => {
      const semaphore = createConcurrencyLimiter(CONCURRENCY)
      const results = Array.from({ length: deliveryBatch.length })

      await Promise.all(deliveryBatch.map((delivery, i) =>
        semaphore(async () => {
          try {
            const response = await checkDeliveryStatus(delivery.reference)
            await updateDeliveryFromResponse(delivery, response)
            results[i] = { success: true, deliveryId: delivery.deliveryId }
          } catch (error) {
            console.error(`Failed to update delivery ${delivery.deliveryId}:`, error.message)
            results[i] = { success: false, deliveryId: delivery.deliveryId, error: error.message }
          }
        })
      ))

      const failureCount = results.filter(r => r && !r.success).length
      if (failureCount >= 2 && failureCount / results.length > FAILURE_RATE_THRESHOLD) {
        const message = `Batch failure rate exceeded threshold: ${failureCount}/${results.length} deliveries failed`
        console.error(message)
        await sendAlert('delivery status update', new Error(message), message)
        throw new Error(message)
      }

      return results
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
