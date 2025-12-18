const { calculateAllMetrics } = require('./metrics-calculator')

let pollingInterval = null

const startMetricsPolling = () => {
  const intervalMs = Number.parseInt(process.env.METRICS_POLLING_INTERVAL_MS || 360000) // low number for testing - increase to relevant value in production * 1000 // convert to milliseconds
  
  console.log(`Starting metrics polling - interval: ${intervalMs}ms (${intervalMs / 1000 / 60} minutes)`)
  
  calculateAllMetrics().catch(err => {
    console.error('Initial metrics calculation failed:', err)
  })
  
  pollingInterval = setInterval(() => {
    calculateAllMetrics().catch(err => {
      console.error('Scheduled metrics calculation failed:', err)
    })
  }, intervalMs)
  
  return pollingInterval
}

const stopMetricsPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
    console.log('Metrics polling stopped')
  }
}

module.exports = {
  startMetricsPolling,
  stopMetricsPolling
}