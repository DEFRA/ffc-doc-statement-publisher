const { EMAIL, LETTER } = require('../constants/methods')

const { getExistingDocument } = require('../processing/publish')
const { isValidEmail } = require('./validate-email')
const getPersonalisation = require('./get-personalisation')
const getStatementFileUrl = require('./get-statement-file-url')
const publish = require('./publish')
const handlePublishReasoning = require('./handle-publish-reasoning')
const saveRequest = require('./save-request')

const publishStatement = async (request) => {
  let reason
  let response
  let errorObject

  try {
    const existingDocument = await getExistingDocument(request.documentReference)
    if (existingDocument) {
      console.info(`Duplicate document received, skipping ${existingDocument.documentReference}`)
      return
    }
  } catch (err) {
    throw new Error('Could not check for duplicates')
  }

  const validEmail = isValidEmail(request.email)
  const publishStatementType = validEmail ? EMAIL : LETTER
  try {
    let personalisation = null

    if (validEmail) {
      personalisation = getPersonalisation(request.scheme.name, request.scheme.shortName, request.scheme.year, request.scheme.frequency, request.businessName, request.paymentPeriod)
    }

    const filename = validEmail ? request?.filename : getStatementFileUrl(request?.filename)
    response = await publish(request?.emailTemplate, request?.email, filename, personalisation, publishStatementType)
    console.log(`Statement published: ${request.filename}`)
  } catch (err) {
    reason = handlePublishReasoning(err)
    errorObject = {
      reason,
      statusCode: err.statusCode,
      error: err.error,
      message: err.message
    }
  } finally {
    try {
      await saveRequest(request, response?.data.id, publishStatementType, errorObject)
    } catch {
      console.log('Could not save the request')
    }
  }
}

module.exports = publishStatement
