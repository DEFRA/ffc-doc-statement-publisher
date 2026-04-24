const db = require('../data')

const removeFailures = async (deliveryIds, transaction) => {
  await db.failure.destroy({
    where: {
      deliveryId: { [db.Sequelize.Op.in]: deliveryIds }
    },
    transaction
  })
}

module.exports = {
  removeFailures
}
