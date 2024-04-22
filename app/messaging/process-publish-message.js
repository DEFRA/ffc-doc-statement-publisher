const util = require('util')
const { VALIDATION } = require('../constants/errors')
const { publishStatement } = require('../publishing')
const validateRequest = require('./validate-request')
const getRequestEmailTemplateByType = require('./get-request-email-template-by-type')
const documentTypes = require('../constants/document-types')

const processPublishMessage = async (message, receiver) => {
  try {
    const request = message.body
    console.log('Statement publishing request received:', util.inspect(request, false, null, true))
    validateRequest(request)
    const emailTemplate = getRequestEmailTemplateByType(message.applicationProperties.type, documentTypes)
    request.emailTemplate = emailTemplate
    await publishStatement(request)
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to publish statement:', err)
    if (err.category === VALIDATION) {
      await receiver.deadLetterMessage(message)
    }
  }
}

module.exports = processPublishMessage
