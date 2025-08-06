const config = require('../config')
const { NotifyClient } = require('notifications-node-client')
const { SECOND } = require('../constants/postage')
const { retry } = require('../retry')

const setupLetterRequest = (reference, pdfFile, postage, notifyClient) => {
  return () => {
    return notifyClient.sendPrecompiledLetter(reference, pdfFile, postage)
  }
}

const publishByLetter = async (reference, pdfFile, postage = SECOND) => {
  const notifyClient = new NotifyClient(config.notifyApiKeyLetter)
  const letterRequest = setupLetterRequest(reference, pdfFile, postage, notifyClient)
  return retry(letterRequest, 3, 100, true)
    .then(result => {
      console.log(result)
      return result
    })
    .catch((err) => {
      console.log(err)
      throw err
    })
}

module.exports = publishByLetter
