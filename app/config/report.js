const Joi = require('joi')
const { DELINKED: DELINKED_SCHEME_NAME } = require('../constants/scheme-names').LONG_NAMES

// Define config schema
const schema = Joi.object({
  schemes: Joi.array().items(
    Joi.object({
      schemeName: Joi.string().required(),
      email: Joi.string(),
      template: Joi.string(),
      schedule: Joi.object({
        dayOfMonth: Joi.number().integer(),
        dayOfYear: Joi.number().integer(),
        monthOfYear: Joi.number().integer(),
        hour: Joi.number().integer(),
        minute: Joi.number().integer(),
        second: Joi.number().integer(),
        intervalNumber: Joi.number().integer().min(1).required(),
        intervalType: Joi.string().valid('days', 'weeks', 'months', 'years').required()
      }).required(),
      dateRange: Joi.object({
        durationNumber: Joi.number().integer().min(1).required(),
        durationType: Joi.string().valid('days', 'weeks', 'months', 'years').required()// todo correct this
      }).required()
    })
  ).required()
})

// Build config
const config = {
  schemes: [
    {
      schemeName: DELINKED_SCHEME_NAME,
      email: process.env.REPORT_DELINKED_EMAIL,
      template: process.env.REPORT_TEMPLATE,
      schedule: {
        intervalNumber: 1,
        intervalType: 'months',
        dayOfMonth: 9
      },
      dateRange: {
        durationNumber: 1,
        durationType: 'months'
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
  throw new Error(`The report config is invalid. ${result.error.message}`)
}

module.exports = result.value
