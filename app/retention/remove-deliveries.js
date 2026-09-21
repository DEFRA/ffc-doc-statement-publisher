const { delivery } = require('../data')

const removeDeliveries = async (deliveryIds, transaction) => {
  await delivery(transaction ?? undefined).whereIn('deliveryId', deliveryIds).del()
}

module.exports = {
  removeDeliveries
}
