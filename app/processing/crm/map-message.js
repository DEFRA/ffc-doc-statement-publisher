const mapErrorMessage = require('./map-error-message')

const mapMessage = (email, frn, reason) => {
  return {
    email,
    errorMessage: mapErrorMessage(reason),
    frn
  }
}

module.exports = mapMessage
