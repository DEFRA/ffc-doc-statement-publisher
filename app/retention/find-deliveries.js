const { delivery } = require('../database')

const findDeliveries = async (statementIds, transaction) => {
  return delivery(transaction ?? undefined)
    .select('deliveryId')
    .whereIn('statementId', statementIds)
}

module.exports = {
  findDeliveries
}
