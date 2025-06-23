const { EMPTY, INVALID, UNSUCCESSFUL } = require('../constants/failure-reasons')
const forbidden = 403

const handlePublishReasoning = (error) => {
  switch (error?.message) {
    case ('Email is invalid: Email cannot be empty.'):
      return EMPTY
    case ('Email is invalid: The email provided is invalid.'):
      return INVALID
    default:
      if (error.response?.data) {
        const apiError = error.response.data
        console.log('GOV.UK Notify API Error:', JSON.stringify(apiError, null, 2))

        if (
          apiError.status_code === forbidden ||
          (Array.isArray(apiError.errors) && apiError.errors.some(
            e =>
              (typeof e === 'string' && (e.includes('authorization') || e.includes('api key'))) ||
              (typeof e === 'object' && typeof e.message === 'string' && (e.message.includes('authorization') || e.message.includes('api key')))
          ))
        ) {
          console.log('Possible API key issue detected')
        }

        if (apiError.message || (apiError.errors && apiError.errors.length > 0)) {
          const reason = apiError.message || apiError.errors[0]
          console.log(`API Error reason: ${reason}`)
          return UNSUCCESSFUL
        }
      }

      console.log(`Publish fail reason: ${error.message}`)
      return UNSUCCESSFUL
  }
}

module.exports = handlePublishReasoning
