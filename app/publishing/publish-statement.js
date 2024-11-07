// const { EMAIL, LETTER } = require('../constants/methods')
const { getExistingDocument } = require('../processing/publish')
const validateEmail = require('./validate-email')
const getPersonalisation = require('./get-personalisation')
const publishByEmail = require('./publish-by-email')
const publishByPrint = require('./publish-by-print')
const handlePublishReasoning = require('./handle-publish-reasoning')
const saveRequest = require('./save-request')
const { retry } = require('../retry')
const { getFile } = require('../storage')

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

  try {
    if (request.email && request.email.trim() !== '') {
      validateEmail(request.email)
      const personalisation = getPersonalisation(
        request.scheme.name,
        request.scheme.shortName,
        request.scheme.year,
        request.scheme.frequency,
        request.businessName,
        request.paymentPeriod
      )
      const file = await retry(() => getFile(request.filename))
      response = await publishByEmail(
        request.emailTemplate,
        request.email,
        file,
        personalisation
      )
      console.log(`Statement published via email: ${request.filename}`)
    } else {
      const file = await retry(() => getFile(request.filename))
      response = await publishByPrint(request.filename, file)
      console.log(`Statement published via print: ${request.filename}`)
    }
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
      await saveRequest(request, response?.data.id, request.method, errorObject)
    } catch {
      console.log('Could not save the request')
    }
  }
}

module.exports = publishStatement
