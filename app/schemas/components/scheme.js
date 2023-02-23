const Joi = require('joi')

const { SHORT_NAMES } = require('../../constants/scheme-names')

const schemeNames = Object.values(SHORT_NAMES)

module.exports = Joi.string().valid(...schemeNames).required()
  .messages({
    'any.only': `The scheme must be one of the following: ${schemeNames}.`,
    'any.required': 'A scheme must be provided.',
    '*': 'The scheme is invalid.'
  })
