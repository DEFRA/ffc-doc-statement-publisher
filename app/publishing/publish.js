const { retry } = require('../retry')
const { getFile } = require('../storage')
const publishByEmail = require('./publish-by-email')
const publishByLetter = require('./publish-by-letter')

const publish = async (template, email, filename, personalisation) => {
  const file = await retry(() => getFile(filename))
  if (!email) {
    console.log('Email is null, sending to publishByLetter')
    return publishByLetter(filename, file)
  } else {
    console.log('Email exists, sending to publishByEmail')
    return publishByEmail(template, email, file, personalisation)
  }
}

module.exports = publish
