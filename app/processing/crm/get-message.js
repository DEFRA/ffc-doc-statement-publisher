const mapMessage = require('./map-message')
const validateMessage = require('./validate-message')

const getMessage = (email, frn, reason) => {
  return validateMessage(mapMessage(email, frn, reason))
}

module.exports = getMessage
