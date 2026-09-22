const { delivery } = require('../database')

const saveDelivery = async (statementId, method, reference, timestamp, transaction) => {
  const [saved] = await delivery(transaction ?? undefined)
    .insert({
      statementId,
      method,
      reference,
      requested: timestamp
    })
    .returning(['deliveryId'])

  return saved
}

module.exports = saveDelivery
