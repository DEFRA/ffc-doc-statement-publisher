const config = require('../config')
const updateDeliveries = require('./update-deliveries')

let monitoringTimeout
let isRunning = false
let consecutiveErrors = 0
const BACKOFF_MULTIPLIER = 1.5
const BACKOFF_BASE_MS = 1000
const MAX_BACKOFF_ATTEMPTS = 10
const MAX_BACKOFF_TIME = 60000

const calculateBackoff = (errorCount) => {
  const baseDelay = Math.min(
    config.deliveryCheckInterval,
    BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, Math.min(errorCount, MAX_BACKOFF_ATTEMPTS))
  )
  return Math.min(baseDelay, MAX_BACKOFF_TIME)
}

const runUpdateCycle = async () => {
  if (isRunning) {
    console.warn('Previous update cycle still running, skipping this cycle')
    return
  }

  isRunning = true
  try {
    const result = await updateDeliveries()
    consecutiveErrors = 0
    console.log(`Update cycle completed successfully. Processed ${result.totalProcessed} deliveries.`)
  } catch (err) {
    consecutiveErrors++
    console.error(`Error in monitoring cycle (attempt #${consecutiveErrors}):`, err)
  } finally {
    isRunning = false

    const interval = consecutiveErrors > 0
      ? calculateBackoff(consecutiveErrors)
      : config.deliveryCheckInterval

    console.log(`Scheduling next update in ${interval / 1000} seconds`)
    monitoringTimeout = setTimeout(runUpdateCycle, interval)
  }
}

const start = async () => {
  console.log('Starting delivery monitoring service')
  await runUpdateCycle()
}

const stop = async () => {
  console.log('Stopping delivery monitoring service')
  clearTimeout(monitoringTimeout)
}

module.exports = {
  start,
  stop
}
