const { statement } = require('../../database')

const getExistingDocument = async (documentReference) => {
  return (await statement()
    .where({ documentReference })
    .whereNotNull('documentReference')
    .first()) ?? null
}

module.exports = getExistingDocument
