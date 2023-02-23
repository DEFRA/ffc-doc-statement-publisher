const schema = require('./schema')
const { VALIDATION } = require('../constants/errors')

const validateRequest = (publishRequest) => {
  const validationResult = schema.validate(publishRequest, { abortEarly: false, allowUnknown: true })
  if (validationResult.error) {
    const error = new Error(`Statement request is invalid, ${validationResult.error.message}`)
    error.category = VALIDATION
    throw error
  }
}

module.exports = validateRequest
