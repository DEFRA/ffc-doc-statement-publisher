const getStatementRequestObject = statement => {
  const request = { ...obj }
  request.address = {}
  request.scheme = {}

  for (const key in obj) {
    if (key.startsWith('addressLine')) {
      const lineKey = `line${key.slice('addressLine'.length)}`
      request.address[lineKey] = obj[key]
      delete request[key]
    } else if (key.startsWith('scheme')) {
      const schemeKey = key.charAt('scheme'.length).toLowerCase() + key.slice('scheme'.length + 1)
      request.scheme[schemeKey] = obj[key]
      delete request[key]
    }
  }

  return request
}

module.exports = getStatementRequestObject
