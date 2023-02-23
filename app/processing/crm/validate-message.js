const schema = require('../../schemas/objects/crm')

const validateMessage = (message) => {
  const result = schema.validate(message, {
    abortEarly: false
  })

  if (result.error) {
    throw new Error(`Invalid CRM details: ${result.error.message}`)
  }

  return result.value
}

module.exports = validateMessage
