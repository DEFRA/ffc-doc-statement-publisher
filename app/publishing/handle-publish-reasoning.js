const { EMPTY, INVALID, UNSUCCESSFUL } = require('../constants/failure-reasons')
const forbidden = 403

const isAPIRelated = (string) => {
  return string.includes('authorization') || string.includes('api key')
}

const logAPIIssue = (apiError) => {
  if (
    apiError.status_code === forbidden ||
    (Array.isArray(apiError.errors) && apiError.errors.some(
      e =>
        (typeof e === 'string' && isAPIRelated(e)) ||
        (typeof e === 'object' && typeof e.message === 'string' && isAPIRelated(e.message))
    ))
  ) {
    console.log('Possible API key issue detected')
  }
}

const handlePublishReasoning = (error) => {
  switch (error?.message) {
    case ('Email is invalid: Email cannot be empty.'):
      return EMPTY
    case ('Email is invalid: The email provided is invalid.'):
    case ('email_address Not a valid email address'):
      return INVALID
    default: {
      if (error.response?.data) {
        const apiError = error.response.data
        console.error('GOV.UK Notify API Error:', JSON.stringify(apiError, null, 2))

        logAPIIssue(apiError)

        if (apiError.message || (apiError.errors && apiError.errors.length > 0)) {
          const reason = apiError.message || apiError.errors[0]
          console.error(`API Error reason: ${reason}`)
          return UNSUCCESSFUL
        }
      }

      const errorDetails = {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      }

      if (process.env.NODE_ENV !== 'production' && error.code !== 'BLOB_NOT_FOUND') {
        errorDetails.stack = error.stack
      }

      console.error('Publish failure details:', errorDetails)

      return UNSUCCESSFUL
    }
  }
}

module.exports = handlePublishReasoning
