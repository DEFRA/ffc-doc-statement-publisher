const { retry } = require('../retry')
const { getFile } = require('../storage')
const publishByEmail = require('./publish-by-email')

const publish = async (template, email, filename, personalisation) => {
  const file = await retry(() => getFile(filename))
  return publishByEmail(template, email, file, personalisation)
}

module.exports = publish
