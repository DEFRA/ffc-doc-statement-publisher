const { getSender } = require('./service-bus/sender-cache')
const { sendMessage: sbSendMessage } = require('./service-bus/send-message')
const createMessage = require('./create-message')

const sendMessage = async (body, type, config) => {
  const message = createMessage(body, type)
  const sender = getSender(config)
  await sbSendMessage(sender, message)
}

module.exports = sendMessage
