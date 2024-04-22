const { EMAIL } = require('../constants/methods')

const { getExistingDocument } = require('../processing/publish')
const validateEmail = require('./validate-email')
const getPersonalisation = require('./get-personalisation')
const publish = require('./publish')
const handlePublishReasoning = require('./handle-publish-reasoning')
const saveRequest = require('./save-request')

const publishStatement = async (request) => {
  let reason
  let response

  try {
    const existingDocument = await getExistingDocument(request.documentReference)
    if (existingDocument) {
      console.info(`Duplicate document received, skipping ${existingDocument.documentReference}`)
      return
    }
  } catch (err) {
    throw new Error('Could not check for duplicates')
  }

  try {
    validateEmail(request.email)
    const personalisation = getPersonalisation(request.scheme.name, request.scheme.shortName, request.scheme.year, request.scheme.frequency, request.businessName, request.paymentPeriod)
    response = await publish(request.emailTemplate, request.email, request.filename, personalisation)
    console.log(`Statement published: ${request.filename}`)
  } catch (err) {
    reason = handlePublishReasoning(err)
  } finally {
    try {
      await saveRequest(request, response?.data.id, EMAIL, reason)
    } catch {
      console.log('Could not save the request')
    }
  }
}

module.exports = publishStatement
