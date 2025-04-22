const { EMPTY, INVALID, UNSUCCESFUL } = require('../constants/failure-reasons')

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

        if (apiError.status_code === 403 || apiError.errors?.some(e => e.includes('authorization') || e.includes('api key'))) {
          console.log('Possible API key issue detected')
        }

        if (apiError.message || (apiError.errors && apiError.errors.length > 0)) {
          const reason = apiError.message || apiError.errors[0]
          console.log(`API Error reason: ${reason}`)
          return UNSUCCESFUL
        }
      }

      console.log(`Publish fail reason: ${error.message}`)
      return UNSUCCESFUL
  }
}

module.exports = handlePublishReasoning
