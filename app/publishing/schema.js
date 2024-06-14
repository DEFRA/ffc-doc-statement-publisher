const Joi = require('joi')

module.exports = Joi.string().email().required().messages({
  'string.empty': 'email cannot be empty',
  'string.email': 'email must be a valid email address',
  'any.required': 'email string is missing, but it is required'
})
