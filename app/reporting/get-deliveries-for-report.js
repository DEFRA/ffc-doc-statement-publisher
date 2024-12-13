const db = require('../data')

const getDeliveriesForReport = async (schemeName, start, end, transaction) => {
  return db.delivery.findAll({
    where: {
      requested: {
        [db.Sequelize.Op.between]: [start, end]
      }
    },
    include: [
      {
        model: db.statement,
        where: {
          schemeName
        },
        required: true
      }
    ],
    raw: true,
    transaction
  })
}

module.exports = getDeliveriesForReport
