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
  const startTime = Date.now()
  let reason, response, errorObject

  if (!request.documentReference) {
    console.warn('Missing document reference, skipping')
    return
  }

  try {
    const existingDocument = await getExistingDocument(request.documentReference)
    if (existingDocument) {
      console.info(`Duplicate document received, skipping ${existingDocument.documentReference}`)
      return
    }

    const validEmail = isValidEmail(request.email || '')
    const isDp = isDpScheme(request.scheme?.shortName)
    const publishStatementType = validEmail ? EMAIL : LETTER

    try {
      let personalisation = null

      if (!isDp) {
        validateEmail(request.email)
      }

      if (publishStatementType === EMAIL) {
        personalisation = getPersonalisation(
          request.scheme?.name,
          request.scheme?.shortName,
          request.scheme?.year,
          request.scheme?.frequency,
          request.businessName,
          request.paymentPeriod
        )
      }

      response = await publish(
        request.emailTemplate,
        request.email,
        request.filename,
        personalisation,
        publishStatementType
      )

      console.log(`Statement published: ${request.filename} (${Date.now() - startTime}ms)`)
    } catch (err) {
      reason = handlePublishReasoning(err)
      errorObject = standardErrorObject(err, reason)
      console.error(`Publication error: ${request.filename} - ${reason}`)
    }
    await saveRequest(request, response?.data?.id, publishStatementType, errorObject)
  } catch (err) {
    console.error(`Critical error processing statement ${request.documentReference}:`, err)
    throw err
  }
}

module.exports = publishStatement
