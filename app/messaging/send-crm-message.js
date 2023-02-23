const config = require('../config')

const { CRM: CRM_MESSAGE_TYPE } = require('../constants/message-types')

const { getMessage } = require('../processing/crm')
const sendMessage = require('./send-message')

const sendCrmMessage = async (email, frn, reason) => {
  await sendMessage(getMessage(email, frn, reason), CRM_MESSAGE_TYPE, config.crmTopic)
}

module.exports = sendCrmMessage
