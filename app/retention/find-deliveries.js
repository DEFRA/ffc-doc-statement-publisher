const db = require('../data')

const findDeliveries = async (statementIds, transaction) => {
  return db.delivery.findAll({
    attributes: ['deliveryId'],
    where: {
      statementId: { [db.Sequelize.Op.in]: statementIds }
    },
    transaction
  })
}

module.exports = {
  findDeliveries
}
