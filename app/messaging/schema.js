const Joi = require('joi')

const documentReference = require('../schemas/components/document-reference')
const matchPattern = require('./filename-regex-validation')

module.exports = Joi.object({
  email: Joi.string().optional().allow('', null).messages({
    'string.base': 'Email must be a string'
  }),
  documentReference,
  filename: Joi.string()
    .custom((value, helpers) => {
      if (!matchPattern(value)) {
        return helpers.error('string.pattern.base')
      }
      return value
    }, 'filename validation')
    .required()
    .messages({
      'string.pattern.base': 'filename must match the required pattern',
      'string.base': 'filename must be a string',
      'any.required': 'filename is missing but it is required'
    }),
  address: Joi.object({
    line1: Joi.string().optional().allow('', null).messages({
      'string.base': 'line1 from address object must be a string'
    }),
    line2: Joi.string().optional().allow('', null).messages({
      'string.base': 'line2 from address object must be a string'
    }),
    line3: Joi.string().optional().allow('', null).messages({
      'string.base': 'line3 from address object must be a string'
    }),
    line4: Joi.string().optional().allow('', null).messages({
      'string.base': 'line4 from address object must be a string'
    }),
    line5: Joi.string().optional().allow('', null).messages({
      'string.base': 'line5 from address object must be a string'
    }),
    postcode: Joi.string().optional().allow('', null).messages({
      'string.base': 'postcode from address object must be a string'
    })
  }).required().messages({
    'object.base': 'address must be an object',
    'any.required': 'address object is missing, but it is required'
  }),
  scheme: Joi.object({
    name: Joi.string().required().messages({
      'string.empty': 'name string from scheme object cannot be empty',
      'any.required': 'name string from scheme object is missing but it is required',
      'string.base': 'name from scheme object must be a string'
    }),
    shortName: Joi.string().required().messages({
      'string.empty': 'shortName string from scheme object cannot be empty',
      'any.required': 'shortName string from scheme object is missing but it is required',
      'string.base': 'shortName from scheme object must be a string'
    }),
    year: Joi.string().required().messages({
      'string.empty': 'year string from scheme object cannot be empty',
      'any.required': 'year string from scheme object is missing but it is required',
      'string.base': 'year from scheme object must be a string'
    }),
    frequency: Joi.string().required().messages({
      'string.empty': 'frequency string from scheme object cannot be empty',
      'any.required': 'frequency string from scheme object is missing but it is required',
      'string.base': 'frequency from scheme object must be a string'
    })
  }).required().messages({
    'object.base': 'scheme must be an object',
    'any.required': 'scheme object is missing but it is required'
  })
})
