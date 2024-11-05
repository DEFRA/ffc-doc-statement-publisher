require('./insights').setup()
require('log-timestamp')
const messaging = require('./messaging')
const monitoring = require('./monitoring')
const publishing = require('./publishing')
const { initialiseContainers } = require('./storage')

process.on('SIGTERM', async () => {
  await messaging.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await messaging.stop()
  process.exit(0)
})

module.exports = (async () => {
  await initialiseContainers()
  await messaging.start()
  await monitoring.start()
  await publishing.start()
})()
