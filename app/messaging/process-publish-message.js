const util = require('node:util')
const { VALIDATION } = require('../constants/errors')
const { publishStatement } = require('../publishing')
const validateRequest = require('./validate-request')
const getRequestEmailTemplateByType = require('./get-request-email-template-by-type')
const documentTypes = require('../constants/document-types')
const { sendAlert } = require('../alert')

const processPublishMessage = async (message, receiver) => {
  const request = message.body
  const type = message.applicationProperties?.type || request.type
  try {
    console.log('Statement publishing request received:', util.inspect(request, false, null, true))

    validateRequest(request)
    const emailTemplate = getRequestEmailTemplateByType(type, documentTypes)
    request.emailTemplate = emailTemplate

    await publishStatement(request)
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to publish statement:', err)

    const alertPayload = {
      type: type || 'Unknown',
      frn: request?.frn,
      sbi: request?.sbi,
      scheme: request?.scheme?.name,
      filename: request?.filename,
      businessName: request?.businessName,
      request: { body: request }
    }
    sendAlert('statement publish message', alertPayload, `Unable to publish statement: ${err.message}`)

    if (err.category === VALIDATION) {
      await receiver.deadLetterMessage(message)
    } else {
      await receiver.abandonMessage(message)
    }
  }
}

module.exports = processPublishMessage
