const Joi = require('joi')

const defaultPollingInterval = 600000

const schema = Joi.object({
  pollingInterval: Joi.number().integer().default(defaultPollingInterval)
})

const config = {
  pollingInterval: process.env.POLLING_INTERVAL
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The publishing config is invalid. ${result.error.message}`)
}

module.exports = result.value