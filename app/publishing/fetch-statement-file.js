const axios = require('axios')

const fetchStatementFile = async (url) => {
  try {
    console.log('Fetching statement file from: ', url)
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    })
    return Buffer.from(response.data)
  } catch (e) {
    console.error('FetchStatementFile Error: ', e)
    throw e
  }
}

module.exports = fetchStatementFile
