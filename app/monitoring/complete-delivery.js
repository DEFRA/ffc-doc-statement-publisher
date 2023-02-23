const db = require('../data')

const completeDelivery = async (deliveryId, transaction) => {
  await db.delivery.update(
    { completed: new Date() },
    { where: { deliveryId } },
    { transaction })
}

module.exports = completeDelivery
