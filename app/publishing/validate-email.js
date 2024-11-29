const schema = require('../schemas/components/email')

const validateEmail = (email) => {
  const result = schema.validate(email, {
    abortEarly: false
  })

  if (result.error) {
    throw new Error(`Email is invalid: ${result.error.message}`)
  }

  return result.value
}

const isValidEmail = (email) => {
  const result = schema.validate(email, {
    abortEarly: false
  })

  return result?.error === undefined
}

module.exports = { validateEmail, isValidEmail }
