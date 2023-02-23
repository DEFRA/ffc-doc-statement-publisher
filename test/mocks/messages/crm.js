const { EMPTY, INVALID } = require('../../../app/constants/crm-error-messages')

const EMAIL = require('../components/email')
const FRN = require('../components/frn')

const BASE_MESSAGE = require('../objects/message')

const emptyMappedMessage = {
  email: EMAIL,
  errorMessage: EMPTY,
  frn: FRN
}

const emptyMessage = {
  ...BASE_MESSAGE,
  body: emptyMappedMessage
}

const invalidMappedMessage = {
  email: EMAIL,
  errorMessage: INVALID,
  frn: FRN
}

const invalidMessage = {
  ...BASE_MESSAGE,
  body: invalidMappedMessage
}

module.exports = {
  EMPTY_MAPPED: emptyMappedMessage,
  EMPTY: emptyMessage,
  INVALID_MAPPED: invalidMappedMessage,
  INVALID: invalidMessage
}
