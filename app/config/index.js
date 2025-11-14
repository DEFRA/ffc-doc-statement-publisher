const Joi = require('joi')
const mqConfig = require('./message')
const dbConfig = require('./database')
const storageConfig = require('./storage')
const reportConfig = require('./report')
const deliveryCheck = 3600000
const reportCheck = 86400000
const retainPeriodInWeeks = 78

const schema = Joi.object({
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  deliveryCheckInterval: Joi.number().default(deliveryCheck),
  reportingCheckInterval: Joi.number().default(reportCheck),
  notifyApiKey: Joi.string().required(),
  notifyApiKeyLetter: Joi.string().required(),
  retentionPeriodInWeeks: Joi.number().default(retainPeriodInWeeks),
  statementReceiverApiVersion: Joi.string().required(),
  statementReceiverEndpoint: Joi.string().required(),
  sendCrmFailureMessageEnabled: Joi.boolean().optional().default(false)
})

const config = {
  env: process.env.NODE_ENV,
  deliveryCheckInterval: process.env.DELIVERY_CHECK_INTERVAL ? parseInt(process.env.DELIVERY_CHECK_INTERVAL) : undefined,
  reportingCheckInterval: process.env.REPORTING_CHECK_INTERVAL ? parseInt(process.env.REPORTING_CHECK_INTERVAL) : undefined,
  notifyApiKey: process.env.NOTIFY_API_KEY,
  notifyApiKeyLetter: process.env.NOTIFY_API_KEY_LETTER,
  retentionPeriodInWeeks: process.env.RETENTION_PERIOD_IN_WEEKS ? parseInt(process.env.RETENTION_PERIOD_IN_WEEKS) : undefined,
  statementReceiverApiVersion: process.env.STATEMENT_RECEIVER_API_VERSION,
  statementReceiverEndpoint: process.env.STATEMENT_RECEIVER_ENDPOINT,
  sendCrmFailureMessageEnabled: process.env.SEND_CRM_FAILURE_MESSAGE_ENABLED
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
