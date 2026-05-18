const db = require('../data')

const removeDeliveries = async (deliveryIds, transaction) => {
  await db.delivery.destroy({
    where: {
      deliveryId: { [db.Sequelize.Op.in]: deliveryIds }
    },
    transaction
  })
}

module.exports = {
  removeDeliveries
}
