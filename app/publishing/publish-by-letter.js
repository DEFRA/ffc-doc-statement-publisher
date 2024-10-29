const config = require('../config')
const { NotifyClient } = require('notifications-node-client')
const { SECOND } = require('../constants/postage')

const publishByLetter = async (reference, pdfFile, postage = SECOND) => {
  const notifyClient = new NotifyClient(config.notifyApiKey)
  return notifyClient.sendPrecompiledLetter(reference, pdfFile, postage)
}

module.exports = publishByLetter
