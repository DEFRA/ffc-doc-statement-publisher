const { dataProcessingAlert } = require('ffc-alerting-utils')
const { DATA_PUBLISHING_ERROR } = require('./constants/alerts')

const sendAlert = async (process, error, message, type = DATA_PUBLISHING_ERROR) => {
  await dataProcessingAlert({
    process,
    error,
    message
  }, type)
}

module.exports = { sendAlert }
