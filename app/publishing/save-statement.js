const db = require('../data')

const saveStatement = async (request, timestamp, transaction) => {
  return db.statement.create({
    ...request,
    addressLine1: request.address.line1,
    addressLine2: request.address.line2,
    addressLine3: request.address.line3,
    addressLine4: request.address.line4,
    addressLine5: request.address.line5,
    postcode: request.address.postcode,
    schemeName: request.scheme.name,
    schemeShortName: request.scheme.shortName,
    schemeYear: request.scheme.year,
    schemeFrequency: request.scheme.frequency,
    received: timestamp
  },
  { transaction })
}

module.exports = saveStatement
