const axios = require('axios')

const fetchStatementFile = async (url) => {
  try {
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
