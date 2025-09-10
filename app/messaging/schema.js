const Joi = require('joi')
const documentReference = require('../schemas/components/document-reference')
const matchPattern = require('./filename-regex-validation')

const maxBusinessNameLength = 160
const minSbi = 105000000
const maxSbi = 999999999
const minFrn = 1000000000
const maxFrn = 9999999999
const maxSchemeShortNameLength = 10
const yearLength = 4
const maxSchemeNameLength = 100
const maxFrequencyLength = 10
const maxEmail = 260
const maxAddressLineLength = 240
const maxPostcodeLength = 8
const maxChars = 4000
const maxPaymentPeriod = 200

const percentagePattern = /^\d{1,3}\.\d{2}$/
const monetaryPattern = /^\d+\.\d{2}$/
const schemeShortName = 'scheme.shortName'

const createPayBandSchema = (name) => Joi.when(schemeShortName, {
  is: 'DP',
  then: Joi.string().max(maxChars).required().messages({
    'string.base': `${name} should be a type of string`,
    'string.max': `${name} should have a maximum length of ${maxChars} characters`,
    'any.required': `The field ${name} is not present but it is required`
  }),
  otherwise: Joi.string().max(maxChars).optional().allow(null, '').messages({
    'string.base': `${name} should be a type of string`,
    'string.max': `${name} should have a maximum length of ${maxChars} characters`
  })
})

const createPercentageSchema = (name) => Joi.when(schemeShortName, {
  is: 'DP',
  then: Joi.string().pattern(percentagePattern).required().messages({
    'string.base': `${name} should be a type of string`,
    'string.pattern.base': `${name} should adhere to the pattern: ###.## (up to 3 digits before decimal, exactly 2 after)`,
    'any.required': `The field ${name} is not present but it is required`
  }),
  otherwise: Joi.string().pattern(percentagePattern).optional().allow(null, '').messages({
    'string.base': `${name} should be a type of string`,
    'string.pattern.base': `${name} should adhere to the pattern: ###.## (up to 3 digits before decimal, exactly 2 after)`
  })
})

const createMonetarySchema = (name) => Joi.when(schemeShortName, {
  is: 'DP',
  then: Joi.string().pattern(monetaryPattern).required().messages({
    'string.base': `${name} should be a type of string`,
    'string.pattern.base': `${name} should match the format: #.## (any number of digits before decimal, exactly 2 after)`,
    'any.required': `The field ${name} is not present but it is required`
  }),
  otherwise: Joi.string().pattern(monetaryPattern).optional().allow(null, '').messages({
    'string.base': `${name} should be a type of string`,
    'string.pattern.base': `${name} should match the format: #.## (any number of digits before decimal, exactly 2 after)`
  })
})

module.exports = Joi.object({
  email: Joi.string().optional().allow('', null).max(maxEmail).messages({
    'string.base': 'Email must be a string',
    'string.max': `Email must be at most ${maxEmail} characters`
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
    line1: Joi.string().optional().allow('', null).max(maxAddressLineLength).messages({
      'string.base': 'line1 from address object must be a string',
      'string.max': `line1 from address object must be at most ${maxAddressLineLength} characters`
    }),
    line2: Joi.string().optional().allow('', null).max(maxAddressLineLength).messages({
      'string.base': 'line2 from address object must be a string',
      'string.max': `line2 from address object must be at most ${maxAddressLineLength} characters`
    }),
    line3: Joi.string().optional().allow('', null).max(maxAddressLineLength).messages({
      'string.base': 'line3 from address object must be a string',
      'string.max': `line3 from address object must be at most ${maxAddressLineLength} characters`
    }),
    line4: Joi.string().optional().allow('', null).max(maxAddressLineLength).messages({
      'string.base': 'line4 from address object must be a string',
      'string.max': `line4 from address object must be at most ${maxAddressLineLength} characters`
    }),
    line5: Joi.string().optional().allow('', null).max(maxAddressLineLength).messages({
      'string.base': 'line5 from address object must be a string',
      'string.max': `line5 from address object must be at most ${maxAddressLineLength} characters`
    }),
    postcode: Joi.string().optional().allow('', null).max(maxPostcodeLength).messages({
      'string.base': 'postcode from address object must be a string',
      'string.max': `postcode from address object must be at most ${maxPostcodeLength} characters`
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
    year: Joi.string().min(yearLength).max(yearLength).required().messages({
      'string.base': 'Year must be a string',
      'string.max': `Year must be exactly ${yearLength} characters`,
      'string.min': `Year must be exactly ${yearLength} characters`,
      'any.required': 'Year is required'
    }),
    frequency: Joi.string().max(maxFrequencyLength).optional().allow('', null).messages({
      'string.base': 'Frequency must be a string',
      'string.max': `Frequency must be at most ${maxFrequencyLength} characters`,
      'any.required': 'Frequency is required'
    }),
    agreementNumber: Joi.string().optional().allow('', null).messages({
      'number.base': 'Agreement number must be a string'
    })
  }).required().messages({
    'object.base': 'scheme must be an object',
    'any.required': 'scheme object is missing but it is required'
  }),
  paymentBand1: createPayBandSchema('paymentBand1'),
  paymentBand2: createPayBandSchema('paymentBand2'),
  paymentBand3: createPayBandSchema('paymentBand3'),
  paymentBand4: createPayBandSchema('paymentBand4'),
  percentageReduction1: createPercentageSchema('percentageReduction1'),
  percentageReduction2: createPercentageSchema('percentageReduction2'),
  percentageReduction3: createPercentageSchema('percentageReduction3'),
  percentageReduction4: createPercentageSchema('percentageReduction4'),
  progressiveReductions1: createMonetarySchema('progressiveReductions1'),
  progressiveReductions2: createMonetarySchema('progressiveReductions2'),
  progressiveReductions3: createMonetarySchema('progressiveReductions3'),
  progressiveReductions4: createMonetarySchema('progressiveReductions4'),
  referenceAmount: createMonetarySchema('referenceAmount'),
  totalProgressiveReduction: createMonetarySchema('totalProgressiveReduction'),
  totalDelinkedPayment: createMonetarySchema('totalDelinkedPayment'),
  paymentAmountCalculated: createMonetarySchema('paymentAmountCalculated'),
  paymentPeriod: Joi.when(schemeShortName, {
    is: 'DP',
    then: Joi.string().max(maxPaymentPeriod).required().messages({
      'string.base': 'Payment period must be a string',
      'string.max': `Payment period must be at most ${maxPaymentPeriod} characters`,
      'any.required': 'Payment period is required'
    }),
    otherwise: Joi.string().max(maxPaymentPeriod).optional().allow(null, '').messages({
      'string.base': 'Payment period must be a string',
      'string.max': `Payment period must be at most ${maxPaymentPeriod} characters`,
      'any.required': 'Payment period is required'
    })
  }),
  transactionDate: Joi.when(schemeShortName, {
    is: 'DP',
    then: Joi.date().iso().required().messages({
      'date.base': 'Transaction date must be a valid date',
      'date.format': 'Transaction date must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Transaction date is required for DP scheme'
    }),
    otherwise: Joi.date().iso().optional().allow(null).messages({
      'date.base': 'Transaction date must be a valid date',
      'date.format': 'Transaction date must be in ISO format (YYYY-MM-DD)'
    })
  })
}).required().messages({
  'object.base': 'Payload must be an object',
  'any.required': 'Payload is required'
})
