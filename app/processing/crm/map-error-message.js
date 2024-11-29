const { EMPTY, INVALID, REJECTED, UNSUCCESFUL } = require('../../constants/failure-reasons')
const { EMPTY: EMPTY_ERROR, INVALID: INVALID_ERROR, UNSUCCESFUL: UNSUCCESFUL_ERROR } = require('../../constants/crm-error-messages')

const mapErrorMessage = (reason) => {
  switch (reason) {
    case EMPTY:
      return EMPTY_ERROR
    case INVALID:
      return INVALID_ERROR
    case REJECTED:
      return INVALID_ERROR
    case UNSUCCESFUL:
      return UNSUCCESFUL_ERROR
    default:
      return ''
  }
}

module.exports = mapErrorMessage
