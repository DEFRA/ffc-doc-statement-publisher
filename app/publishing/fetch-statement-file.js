const axios = require('axios')

const fetchStatementFile = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    })
    return Buffer.from(response.data)
  } catch (e) {
    console.error(`FetchStatementFile Error: ${e.message}`)

    if (e.response) {
      console.error(`Fetch File Status code: ${e.response.status}`)
      console.error(`Response data: ${JSON.stringify(e.response.data)}`)
    } else if (e.request) {
      console.error('No response received from the server when fetching file.')
    } else {
      console.error(`Error setting up the fetchStatementFile request: ${e.message}`)
    }

    throw e
  }
}

module.exports = fetchStatementFile
