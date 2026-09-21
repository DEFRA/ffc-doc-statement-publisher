const { delivery } = require('../data')

const findDeliveries = async (statementIds, transaction) => {
  return delivery(transaction ?? undefined)
    .select('deliveryId')
    .whereIn('statementId', statementIds)
}

module.exports = {
  findDeliveries
}
