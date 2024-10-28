const { EMAIL, LETTER } = require('../constants/methods')
const retry = require('../retry')
const { getFile } = require('../storage')
const publishByEmail = require('./publish-by-email')
const publishByLetter = require('./publish-by-letter')

const publish = async (template, email, filename, personalisation, publishStatementType = EMAIL) => {
  const file = await retry(() => getFile(filename))
  if (publishStatementType === EMAIL) {
    return publishByEmail(template, email, file, personalisation)
  } else if (publishStatementType === LETTER) {
    return publishByLetter(filename, file)
  }
  return null
}

module.exports = publish
