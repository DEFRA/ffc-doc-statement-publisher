const getStatementRequestObject = statement => {
  const request = { ...statement }
  request.address = {}
  request.scheme = {}

  for (const key in statement) {
    if (key.startsWith('addressLine')) {
      const lineKey = `line${key.slice('addressLine'.length)}`
      request.address[lineKey] = statement[key]
      delete request[key]
    } else if (key.startsWith('scheme')) {
      const schemeKey = key.charAt('scheme'.length).toLowerCase() + key.slice('scheme'.length + 1)
      request.scheme[schemeKey] = statement[key]
      delete request[key]
    }
  }

  return request
}

module.exports = getStatementRequestObject
