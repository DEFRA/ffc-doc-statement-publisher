const { delivery } = require('../database')

const createDelivery = async (statementId, method, reference, requested, transaction) => {
  await delivery(transaction ?? undefined).insert({
    statementId,
    method,
    reference,
    requested
  })
}

module.exports = createDelivery
