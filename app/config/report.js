const Joi = require('joi')
const { DELINKED: DELINKED_SCHEME_NAME, SFI } = require('../constants/scheme-names').LONG_NAMES

// Define config schema
const schema = Joi.object({
  schemes: Joi.array().items(
    Joi.object({
      schemeName: Joi.string().required(),
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
        durationType: Joi.string().valid('days', 'weeks', 'months', 'years').required()
      }).required()
    })
  ).required()
})

// Build config
const config = {
  schemes: [
    {
      schemeName: process.env.DELINKED_SCHEME_NAME || DELINKED_SCHEME_NAME,
      schedule: {
        intervalNumber: process.env.DELINKED_INTERVAL_NUMBER,
        intervalType: process.env.DELINKED_INTERVAL_TYPE,
        dayOfMonth: process.env.DELINKED_DAY_OF_MONTH
      },
      dateRange: {
        durationNumber: process.env.DELINKED_DURATION_NUMBER,
        durationType: process.env.DELINKED_DURATION_TYPE
      }
    },
    {
      schemeName: process.env.SFI_SCHEME_NAME || SFI,
      schedule: {
        intervalNumber: process.env.SFI_INTERVAL_NUMBER,
        intervalType: process.env.SFI_INTERVAL_TYPE,
        dayOfMonth: process.env.SFI_DAY_OF_MONTH
      },
      dateRange: {
        durationNumber: process.env.SFI_DURATION_NUMBER,
        durationType: process.env.SFI_DURATION_TYPE
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
