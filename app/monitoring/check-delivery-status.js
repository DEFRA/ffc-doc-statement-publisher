const config = require('../config')
const { NotifyClient } = require('notifications-node-client')

const checkDeliveryStatus = async (reference) => {
  const notifyClient = new NotifyClient(config.notifyApiKey)
  return notifyClient.getNotificationById(reference)
}

module.exports = checkDeliveryStatus
