const { failure } = require('../database')

const removeFailures = async (deliveryIds, transaction) => {
  await failure(transaction ?? undefined).whereIn('deliveryId', deliveryIds).del()
}

module.exports = {
  removeFailures
}
