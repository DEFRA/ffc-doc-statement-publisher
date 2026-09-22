const { statement } = require('../database')

const saveStatement = async (request, timestamp, transaction) => {
  const [saved] = await statement(transaction ?? undefined)
    .insert({
      businessName: request.businessName,
      sbi: request.sbi,
      frn: request.frn,
      addressLine1: request.address.line1,
      addressLine2: request.address.line2,
      addressLine3: request.address.line3,
      addressLine4: request.address.line4,
      addressLine5: request.address.line5,
      postcode: request.address.postcode,
      email: request.email,
      filename: request.filename,
      schemeName: request.scheme.name,
      schemeShortName: request.scheme.shortName,
      schemeYear: request.scheme.year,
      schemeFrequency: request.scheme.frequency,
      received: timestamp,
      documentReference: request.documentReference,
      emailTemplate: request.emailTemplate,
      paymentReference: request.paymentReference
    })
    .returning('*')

  return saved
}

module.exports = saveStatement
