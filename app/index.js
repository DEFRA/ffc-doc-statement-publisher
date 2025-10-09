require('./insights').setup()
require('log-timestamp')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { DATA_PUBLISHING_ERROR } = require('./constants/alerts')
const { SOURCE } = require('./constants/source')

const messageConfig = require('./config/message')

try {
  const alerting = require('ffc-alerting-utils')

  if (alerting.init) {
    alerting.init({
      topic: messageConfig.alertTopic,
      source: SOURCE,
      defaultType: DATA_PUBLISHING_ERROR,
      EventPublisherClass: EventPublisher
    })
  } else {
    process.env.ALERT_TOPIC = JSON.stringify(messageConfig.alertTopic)
    process.env.ALERT_SOURCE = SOURCE
    process.env.ALERT_TYPE = DATA_PUBLISHING_ERROR
  }
} catch (err) {
  console.warn('Failed to initialize alerting utils:', err.message)
}

const messaging = require('./messaging')
const monitoring = require('./monitoring')
const reporting = require('./reporting')
const { initialiseContainers } = require('./storage')

process.on('SIGTERM', async () => {
  await messaging.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await messaging.stop()
  process.exit(0)
})

const startup = (async () => {
  await initialiseContainers()
  await messaging.start()
  await monitoring.start()
  await reporting.start()
})()

module.exports = startup
