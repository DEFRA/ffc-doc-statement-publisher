const config = require('../config')
const processPublishMessage = require('./process-publish-message')
const { MessageReceiver } = require('ffc-messaging')
const { sendAlert } = require('../alert')
let receivers = []
const CONNECTION_COUNT = 3
const MAX_CONCURRENT_MESSAGES = 10

const start = async () => {
  try {
    console.info(`Starting messaging service with ${CONNECTION_COUNT} connections`)

    for (let i = 0; i < CONNECTION_COUNT; i++) {
      const publishAction = async (message) => {
        try {
          await processPublishMessage(message, receivers[i])
        } catch (error) {
          console.error(`Error processing message: ${error.message}`)
        }
      }

      const receiver = new MessageReceiver(
        config.publishSubscription,
        publishAction,
        {
          maxConcurrentCalls: MAX_CONCURRENT_MESSAGES,
          receiveMode: 'peekLock'
        }
      )

      await receiver.subscribe()
      receivers.push(receiver)
      console.info(`Connection ${i + 1}/${CONNECTION_COUNT} established`)
    }

    console.info(`Ready to publish payment statements (max throughput: ${CONNECTION_COUNT * MAX_CONCURRENT_MESSAGES} concurrent messages)`)
  } catch (error) {
    console.error('Failed to start messaging service:', error)
    sendAlert('messaging', error, `Messaging service failed to start: ${error.message}`)
    throw error
  }
}

const stop = async () => {
  console.info('Shutting down messaging service')
  await Promise.all(receivers.map(receiver => receiver.closeConnection()))
  receivers = []
  console.info('Messaging service stopped')
}

module.exports = {
  start,
  stop
}
