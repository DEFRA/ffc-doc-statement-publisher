const { failure } = require('../data')

const removeFailures = async (deliveryIds, transaction) => {
  await failure(transaction ?? undefined).whereIn('deliveryId', deliveryIds).del()
}

module.exports = {
  removeFailures
}
