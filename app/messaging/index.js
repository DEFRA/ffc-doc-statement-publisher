const config = require('../config')
const processPublishMessage = require('./process-publish-message')
const { MessageReceiver } = require('ffc-messaging')
let receiver

const start = async () => {
  const publishAction = message => processPublishMessage(message, receiver)
  receiver = new MessageReceiver(config.publishSubscription, publishAction)
  await receiver.subscribe()

  console.info('Ready to publish payment statements')
}

const stop = async () => {
  await receiver.closeConnection()
}

module.exports = {
  start,
  stop
}
