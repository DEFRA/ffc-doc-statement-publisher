const SOURCE = require('../constants/message-source')

const createMessage = (body, type) => {
  return {
    body,
    type,
    source: SOURCE
  }
}

module.exports = createMessage
