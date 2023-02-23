const Joi = require('joi')

const mqSchema = Joi.object({
  messageQueue: {
    host: Joi.string(),
    username: Joi.string(),
    password: Joi.string(),
    useCredentialChain: Joi.bool().default(false),
    appInsights: Joi.object()
  },
  publishSubscription: {
    address: Joi.string(),
    topic: Joi.string(),
    type: Joi.string().default('subscription')
  },
  crmTopic: {
    address: Joi.string()
  }
})

const mqConfig = {
  messageQueue: {
    host: process.env.MESSAGE_QUEUE_HOST,
    username: process.env.MESSAGE_QUEUE_USER,
    password: process.env.MESSAGE_QUEUE_PASSWORD,
    useCredentialChain: process.env.NODE_ENV === 'production',
    appInsights: process.env.NODE_ENV === 'production' ? require('applicationinsights') : undefined
  },
  publishSubscription: {
    address: process.env.PUBLISH_SUBSCRIPTION_ADDRESS,
    topic: process.env.PUBLISH_TOPIC_ADDRESS,
    type: 'subscription'
  },
  crmTopic: {
    address: process.env.CRM_TOPIC_ADDRESS
  }
}

const mqResult = mqSchema.validate(mqConfig, {
  abortEarly: false
})

if (mqResult.error) {
  throw new Error(`The message queue config is invalid. ${mqResult.error.message}`)
}

const publishSubscription = { ...mqResult.value.messageQueue, ...mqResult.value.publishSubscription }
const crmTopic = { ...mqResult.value.messageQueue, ...mqResult.value.crmTopic }

module.exports = {
  publishSubscription,
  crmTopic
}
