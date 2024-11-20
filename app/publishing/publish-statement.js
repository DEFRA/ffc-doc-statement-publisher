const { EMAIL, LETTER } = require('../constants/methods')

const { getExistingDocument } = require('../processing/publish')
const { isValidEmail, validateEmail } = require('./validate-email')
const getPersonalisation = require('./get-personalisation')
const publish = require('./publish')
const handlePublishReasoning = require('./handle-publish-reasoning')
const saveRequest = require('./save-request')
const isDpScheme = require('./is-dp-scheme')
const standardErrorObject = require('./standard-error-object')

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
  const isDp = isDpScheme(request?.scheme?.shortName)
  const publishStatementType = validEmail ? EMAIL : LETTER
  try {
    let personalisation = null

    if (!isDp) {
      validateEmail(request.email)
    }
    if (publishStatementType === EMAIL) {
      personalisation = getPersonalisation(request.scheme.name, request.scheme.shortName, request.scheme.year, request.scheme.frequency, request.businessName, request.paymentPeriod)
    }

    response = await publish(request?.emailTemplate, request?.email, request?.filename, personalisation, publishStatementType)
    console.log(`Statement published: ${request.filename}`)
  } catch (err) {
    reason = handlePublishReasoning(err)
    errorObject = standardErrorObject(err, reason)
  } finally {
    try {
      await saveRequest(request, response?.data.id, publishStatementType, errorObject)
    } catch {
      console.log('Could not save the request')
    }
  }
}

module.exports = publishStatement
