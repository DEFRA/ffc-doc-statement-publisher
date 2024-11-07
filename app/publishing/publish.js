const { retry } = require('../retry')
const { getFile } = require('../storage')
const publishByEmail = require('./publish-by-email')
const publishByPrint = require('./publish-by-print')

const publish = async (template, email, filename, personalisation) => {
  const file = await retry(() => getFile(filename))
  if (!email) {
    console.log('Email is null, sending to publishByPrint')
    return publishByPrint(filename)
  } else {
    console.log('Email is not null, sending to publishByEmail')
    return publishByEmail(template, email, file, personalisation)
  }
}

module.exports = publish
