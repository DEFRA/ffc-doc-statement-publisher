const Joi = require('joi')
const { DELINKED: DELINKED_SCHEME_NAME } = require('../constants/scheme-names').LONG_NAMES

// Define config schema
const schema = Joi.object({
  schemes: Joi.array().items(
    Joi.object({
      schemeName: Joi.string().required(),
      schedule: Joi.object({
        intervalNumber: Joi.number().integer().min(1).required(),
        intervalType: Joi.string().valid('day', 'week', 'month', 'year').required()
      }).required(),
      dateRange: Joi.object({
        durationNumber: Joi.number().integer().min(1).required(),
        durationType: Joi.string().valid('day', 'week', 'month', 'year').required()
      }).required()
    })
  ).required()
})

// Build config
const config = {
  schemes: [
    {
      schemeName: DELINKED_SCHEME_NAME,
      email: '', // todo
      template: '', // todo
      schedule: {
        intervalNumber: 1,
        intervalType: 'month'
      },
      dateRange: {
        durationNumber: 1,
        durationType: 'month'
      }
    }
  ]
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The report storage config is invalid. ${result.error.message}`)
}

module.exports = result.value
