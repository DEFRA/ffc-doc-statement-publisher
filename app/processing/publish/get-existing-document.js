const { statement } = require('../../data')

const getExistingDocument = async (documentReference) => {
  return (await statement()
    .where({ documentReference })
    .whereNotNull('documentReference')
    .first()) ?? null
}

module.exports = getExistingDocument
