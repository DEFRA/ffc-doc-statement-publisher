const retry = require('../retry')
const { getFile } = require('../storage')
const publishByEmail = require('./publish-by-email')

const publish = async (template, email, filename, personalisation) => {
  console.log(`Test-Env-Stage1-Publishing ${filename} to ${email}`)
  const file = await retry(() => getFile(filename))
  console.log(`Test-Env-Stage2-Publishing ${filename} to ${email}`)
  return publishByEmail(template, email, file, personalisation)
}

module.exports = publish
