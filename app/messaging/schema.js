const Joi = require('joi')
const documentReference = require('../schemas/components/document-reference')
const matchPattern = require('./filename-regex-validation')

const maxBusinessNameLength = 100
const minSbi = 105000000
const maxSbi = 999999999
const minFrn = 1000000000
const maxFrn = 9999999999
const maxSchemeShortNameLength = 10
const maxYearLength = 4
const maxSchemeNameLength = 100
const maxFrequencyLength = 10

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
  businessName: Joi.string().max(maxBusinessNameLength).required().messages({
    'string.base': 'Business name must be a string',
    'string.max': `Business name must be at most ${maxBusinessNameLength} characters`,
    'any.required': 'Business name is required'
  }),
  frn: Joi.number().integer().min(minFrn).max(maxFrn).required().messages({
    'number.base': 'FRN must be a number',
    'number.integer': 'FRN must be an integer',
    'number.min': `FRN must be at least ${minFrn}`,
    'number.max': `FRN must be at most ${maxFrn}`,
    'any.required': 'FRN is required'
  }),
  sbi: Joi.number().integer().min(minSbi).max(maxSbi).required().messages({
    'number.base': 'SBI must be a number',
    'number.integer': 'SBI must be an integer',
    'number.min': `SBI must be at least ${minSbi}`,
    'number.max': `SBI must be at most ${maxSbi}`,
    'any.required': 'SBI is required'
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
    name: Joi.string().max(maxSchemeNameLength).required().messages({
      'string.base': 'Scheme name must be a string',
      'string.max': `Scheme name must be at most ${maxSchemeNameLength} characters`,
      'any.required': 'Scheme name is required'
    }),
    shortName: Joi.string().max(maxSchemeShortNameLength).required().messages({
      'string.base': 'Scheme short name must be a string',
      'string.max': `Scheme short name must be at most ${maxSchemeShortNameLength} characters`,
      'any.required': 'Scheme short name is required'
    }),
    year: Joi.string().max(maxYearLength).required().messages({
      'string.base': 'Year must be a string',
      'string.max': `Year must be at most ${maxYearLength} characters`,
      'any.required': 'Year is required'
    }),
    frequency: Joi.string().max(maxFrequencyLength).messages({
      'string.base': 'Frequency must be a string',
      'string.max': `Frequency must be at most ${maxFrequencyLength} characters`,
      'any.required': 'Frequency is required'
    }),
    agreementNumber: Joi.string().optional().allow('', null).messages({
      'number.base': 'Agreement number must be a string',
      'any.required': 'Agreement number is required'
    })
  }).required().messages({
    'object.base': 'scheme must be an object',
    'any.required': 'scheme object is missing but it is required'
  })
})
