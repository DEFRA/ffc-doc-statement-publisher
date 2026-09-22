const config = require('../config')
const { createServiceBusClient, createReceiver, subscribeReceiver, closeSenders } = require('./service-bus')
const { sendAlert } = require('../alert')
const processPublishMessage = require('./process-publish-message')
const { processRetentionMessage } = require('./process-retention-message')
const errorHandler = (error) => {
  console.error('Error occurred:', error)
}

let sbClient
let receivers = []
const CONNECTION_COUNT = 1
const MAX_CONCURRENT_MESSAGES = 5

const start = async () => {
  sbClient = createServiceBusClient(config.publishSubscription)
  try {
    console.info(`Starting messaging service with ${CONNECTION_COUNT} connections`)

    for (let i = 0; i < CONNECTION_COUNT; i++) {
      const publishConfig = { ...config.publishSubscription, maxConcurrentCalls: MAX_CONCURRENT_MESSAGES, autoCompleteMessages: false }

      const publishAction = async (message, receiver) => {
        try {
          await processPublishMessage(message, receiver)
        } catch (error) {
          console.error(`Error processing message: ${error.message}`)
          sendAlert('messaging', message, `Error processing message: ${error.message}`)
        }
      }

      const receiver = createReceiver(sbClient, publishConfig)

      subscribeReceiver(receiver, publishAction, errorHandler, publishConfig)
      receivers.push(receiver)
      console.info(`Connection ${i + 1}/${CONNECTION_COUNT} established`)
    }

    console.info(`Ready to publish payment statements (max throughput: ${CONNECTION_COUNT * MAX_CONCURRENT_MESSAGES} concurrent messages)`)

    const retentionReceiver = createReceiver(sbClient, config.retentionSubscription)
    subscribeReceiver(retentionReceiver, processRetentionMessage, errorHandler, config.retentionSubscription)
    receivers.push(retentionReceiver)
    console.info('Retention receiver ready')
  } catch (error) {
    console.error('Failed to start messaging service:', error)
    sendAlert('messaging', error, `Messaging service failed to start: ${error.message}`)
    throw error
  }
}

const stop = async () => {
  await closeSenders()
  if (sbClient) {
    try {
      await sbClient.close()
    } catch (error) {
      console.error('Failed to close senders:', error)
    }
    sbClient = null
  }
  console.info('Shutting down messaging service')
  await Promise.all(receivers.map(receiver => receiver.close()))
  receivers = []
  console.info('Messaging service stopped')
}

module.exports = {
  start,
  stop
}
