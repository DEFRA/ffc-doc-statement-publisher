const db = require('../data')

const getOutstandingDeliveries = async () => {
  return db.delivery.findAll({
    where: {
      completed: null,
      reference: {
        [db.Sequelize.Op.ne]: null
      }
    }
  })
}

module.exports = getOutstandingDeliveries
