const { delivery } = require('../database')

const removeDeliveries = async (deliveryIds, transaction) => {
  await delivery(transaction ?? undefined).whereIn('deliveryId', deliveryIds).del()
}

module.exports = {
  removeDeliveries
}
