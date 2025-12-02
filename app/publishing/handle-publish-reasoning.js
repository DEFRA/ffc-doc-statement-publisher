const { EMPTY, INVALID, UNSUCCESSFUL } = require('../constants/failure-reasons')

const forbidden = 403
const EMPTY_EMAIL_ERROR = 'Email is invalid: Email cannot be empty.'
const INVALID_EMAIL_ERROR_1 = 'Email is invalid: The email provided is invalid.'
const INVALID_EMAIL_ERROR_2 = 'email_address Not a valid email address'

const isAPIRelated = (string) => {
  return (
    typeof string === 'string' &&
    (string.includes('authorization') || string.includes('api key'))
  )
}

const logAPIIssue = (apiError) => {
  if (
    apiError.status_code === forbidden ||
    (Array.isArray(apiError.errors) &&
      apiError.errors.some((e) => {
        return (
          (typeof e === 'string' && isAPIRelated(e)) ||
          (typeof e === 'object' && typeof e.message === 'string' && isAPIRelated(e.message))
        )
      }))
  ) {
    console.log('Possible API key issue detected')
  }
}

const isEmptyEmailError = (msg) => {
  return msg === EMPTY_EMAIL_ERROR
}

const isInvalidEmailError = (msg) => {
  return msg === INVALID_EMAIL_ERROR_1 || msg === INVALID_EMAIL_ERROR_2
}

const extractApiErrorReason = (apiError) => {
  console.error('GOV.UK Notify API Error:', JSON.stringify(apiError, null, 2))
  logAPIIssue(apiError)
  if (apiError.message || (apiError.errors && apiError.errors.length > 0)) {
    const reason = apiError.message || apiError.errors[0]
    console.error(`API Error reason: ${reason}`)
    return true
  }
  return false
}

const logErrorDetails = (error) => {
  const errorDetails = {
    message: error?.message,
    code: error?.code,
    statusCode: error?.statusCode
  }

  if (process.env.NODE_ENV !== 'production' && error?.code !== 'BLOB_NOT_FOUND') {
    errorDetails.stack = error.stack
  }

  console.error('Publish failure details:', errorDetails)
}

const handlePublishReasoning = (error) => {
  const msg = error?.message

  if (isEmptyEmailError(msg)) {
    return EMPTY
  }
  if (isInvalidEmailError(msg)) {
    return INVALID
  }

  if (error?.response?.data) {
    const apiError = error.response.data
    if (extractApiErrorReason(apiError)) {
      return UNSUCCESSFUL
    }
  }

  logErrorDetails(error || {})
  return UNSUCCESSFUL
}

module.exports = handlePublishReasoning
