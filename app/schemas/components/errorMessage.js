const Joi = require('joi')

const ERRORS = require('../../constants/crm-error-messages')

const ERROR_MESSAGES = Object.values(ERRORS)

module.exports = Joi.string().valid(...ERROR_MESSAGES).required()
  .messages({
    'any.only': `The error message must be one of the following: ${ERROR_MESSAGES}.`,
    'any.required': 'An error message must be provided.',
    '*': 'The error message is invalid.'
  })
