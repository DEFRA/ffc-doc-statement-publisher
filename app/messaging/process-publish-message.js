const { VALIDATION } = require('../constants/errors')
const { publishStatement } = require('../publishing')
const validateRequest = require('./validate-request')
const getRequestEmailTemplateByType = require('./get-request-email-template-by-type')
const documentTypes = require('../constants/document-types')
const { sendAlert } = require('../alert')
const { markClaimStatus, claimMessage, getClaimStatus } = require('./message-claim-helpers')

const ABANDON_BACKOFF_MS = 15_000
const ABANDON_BACKOFF_MAX_MS = 3 * 60_000

const delayedAbandon = async (message, receiver) => {
  const delayMs = Math.min((message.deliveryCount || 0) * ABANDON_BACKOFF_MS, ABANDON_BACKOFF_MAX_MS)
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  await receiver.abandonMessage(message)
}

const processPublishMessage = async (message, receiver) => {
  const body = typeof message.body === 'string' ? JSON.parse(message.body) : message.body
  const messageId = message.messageId || body.messageId || body.documentReference

  const claimed = await claimMessage(messageId, body.documentReference)

  if (!claimed) {
    const existingStatus = await getClaimStatus(messageId)
    if (existingStatus === 'completed') {
      console.info(`Message already processed, completing in Service Bus: ${messageId}`)
      await receiver.completeMessage(message)
    } else {
      console.info(`Message already being processed by another instance, abandoning: ${messageId}`)
      await delayedAbandon(message, receiver)
    }
    return
  }

  const request = message.body
  const type = message.applicationProperties?.type || request.type
  try {
    console.log(`${request.scheme?.name} Statement publishing request received: sbi: ${request.sbi}, frn: ${request.frn}`)

    validateRequest(request)
    const emailTemplate = getRequestEmailTemplateByType(type, documentTypes)
    request.emailTemplate = emailTemplate

    await publishStatement(request)
    await receiver.completeMessage(message)
    await markClaimStatus(messageId, 'completed')
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

    await markClaimStatus(messageId, 'failed')
    if (err.category === VALIDATION) {
      await receiver.deadLetterMessage(message)
    } else {
      await delayedAbandon(message, receiver)
    }
  }
}

module.exports = processPublishMessage
