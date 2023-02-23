const { EMPTY, INVALID } = require('../constants/failure-reasons')

const handlePublishReasoning = (error) => {
  switch (error?.message) {
    case ('Email is invalid: Email cannot be empty.'):
      return EMPTY
    case ('Email is invalid: The email provided is invalid.'):
      return INVALID
    default:
      console.log(`Publish fail reason ${error.message} not recognised`)
      return undefined
  }
}

module.exports = handlePublishReasoning
