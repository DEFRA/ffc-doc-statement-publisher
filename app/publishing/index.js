const { publishingConfig } = require('../config')
const publishStatement = require('./publish-statement')
const resendFailed = require('./resend-failed')

const start = async () => {
  try {
    console.log('Ready to publish data')
    await resendFailed()
    console.log('All outstanding messages published')
  } catch (err) {
    console.log(err)
  } finally {
    setTimeout(start, publishingConfig.pollingInterval)
  }
}

module.exports = {
  publishStatement,
  start
}
