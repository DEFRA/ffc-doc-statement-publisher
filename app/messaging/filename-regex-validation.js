const filenameRegex = {
  teamName: /^[A-Z]{3,6}_/,
  documentPrefix: /^[A-Z](?:[A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*_/,
  schemeShortName: /^[A-Z]{2,6}_/,
  schemeYear: /^\d{4}_/,
  frn: /^\d{10}_/,
  timestampRegex: /\d{16}/,
  extension: /\.pdf$/
}

const validateFilename = (filename) => {
  const { teamName, documentPrefix, schemeShortName, schemeYear, frn, timestampRegex, extension } = filenameRegex

  try {
    if (!teamName.test(filename)) {
      throw new Error('invalid team name')
    }
    filename = filename.replace(teamName, '')

    if (!documentPrefix.test(filename)) {
      throw new Error('invalid document prefix')
    }
    filename = filename.replace(documentPrefix, '')

    if (!schemeShortName.test(filename)) {
      throw new Error('invalid scheme short name')
    }
    filename = filename.replace(schemeShortName, '')

    if (!schemeYear.test(filename)) {
      throw new Error('invalid scheme year')
    }
    filename = filename.replace(schemeYear, '')

    if (!frn.test(filename)) {
      throw new Error('invalid frn number')
    }
    filename = filename.replace(frn, '')

    if (!timestampRegex.test(filename)) {
      throw new Error('invalid timestamp')
    }
    filename = filename.replace(timestampRegex, '')

    if (!extension.test(filename)) {
      throw new Error('invalid extension')
    }
  } catch (error) {
    return false
  }

  return true
}

module.exports = validateFilename
