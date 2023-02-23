const Joi = require('joi')

module.exports = Joi.string().allow('').required()
  .messages({
    'string.base': 'Email must be a string.',
    'any.required': 'Email must be provided.',
    '*': 'The email provided is invalid.'
  })
