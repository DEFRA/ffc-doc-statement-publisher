const teamName = /[A-Z]{3,6}_/
const documentPrefix = /[A-Z](?:[A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*_/
const schemeShortName = /[A-Z]{3,6}_/
const schemeYear = /\d{4}_/
const frn = /\d{10}_/
const timestampRegex = /\d{16}/
const extension = /\.pdf$/

function matchPattern (str) {
  let matched = str.match(teamName)
  if (!matched) return false
  str = str.slice(matched[0].length)

  matched = str.match(documentPrefix)
  if (!matched) return false
  str = str.slice(matched[0].length)

  matched = str.match(schemeShortName)
  if (!matched) return false
  str = str.slice(matched[0].length)

  matched = str.match(schemeYear)
  if (!matched) return false
  str = str.slice(matched[0].length)

  matched = str.match(frn)
  if (!matched) return false
  str = str.slice(matched[0].length)

  matched = str.match(timestampRegex)
  if (!matched) return false
  str = str.slice(matched[0].length)

  return extension.test(str)
}

module.exports = matchPattern
