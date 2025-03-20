const Joi = require('joi')
const mqConfig = require('./message')
const dbConfig = require('./database')
const storageConfig = require('./storage')
const reportConfig = require('./report')

const schema = Joi.object({
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  deliveryCheckInterval: Joi.string().required(),
  reportingCheckInterval: Joi.string().required(),
  notifyApiKey: Joi.string().required(),
  notifyApiKeyLetter: Joi.string().required(),
  notifyEmailTemplateKey: Joi.string().required(),
  retentionPeriodInWeeks: Joi.string().required(),
  statementReceiverApiVersion: Joi.string().required(),
  statementReceiverEndpoint: Joi.string().required()
})

const config = {
  env: process.env.NODE_ENV,
  deliveryCheckInterval: process.env.DELIVERY_CHECK_INTERVAL,
  reportingCheckInterval: process.env.REPORTING_CHECK_INTERVAL,
  notifyApiKey: process.env.NOTIFY_API_KEY,
  notifyApiKeyLetter: process.env.NOTIFY_API_KEY_LETTER,
  notifyEmailTemplateKey: process.env.NOTIFY_EMAIL_TEMPLATE_KEY,
  retentionPeriodInWeeks: process.env.RETENTION_PERIOD_IN_WEEKS,
  statementReceiverApiVersion: process.env.STATEMENT_RECEIVER_API_VERSION,
  statementReceiverEndpoint: process.env.STATEMENT_RECEIVER_ENDPOINT
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

const value = result.value

value.isDev = value.env === 'development'
value.isTest = value.env === 'test'
value.isProd = value.env === 'production'
value.publishSubscription = mqConfig.publishSubscription
value.crmTopic = mqConfig.crmTopic
value.dbConfig = dbConfig
value.storageConfig = storageConfig
value.reportConfig = reportConfig

module.exports = value
