const { EMAIL, LETTER } = require('../constants/methods')
const { retry } = require('../retry')
const { getFile } = require('../storage')
const fetchStatementFile = require('./fetch-statement-file')
const publishByEmail = require('./publish-by-email')
const publishByLetter = require('./publish-by-letter')
const getStatementFileUrl = require('./get-statement-file-url')

const publish = async (template, email, filename, personalisation, publishStatementType = EMAIL) => {
  if (publishStatementType === EMAIL) {
    const file = await retry(() => getFile(filename))
    return publishByEmail(template, email, file, personalisation)
  } else if (publishStatementType === LETTER) {
    const statement = getStatementFileUrl(filename)
    const file = await retry(() => fetchStatementFile(statement))
    return publishByLetter(filename, file)
  }
  return null
}

module.exports = publish
