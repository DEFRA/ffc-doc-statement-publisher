const config = require('../config')
const { NotifyClient } = require('notifications-node-client')

const publishByLetter = async (reference, pdfFile, postage = 'second') => {
  const notifyClient = new NotifyClient(config.notifyApiKey)
  return notifyClient.sendPrecompiledLetter(reference, pdfFile, postage)
}

module.exports = publishByLetter
