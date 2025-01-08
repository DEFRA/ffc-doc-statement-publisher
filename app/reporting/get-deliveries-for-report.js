const db = require('../data')

const getDeliveriesForReport = async (schemeName, start, end, transaction) => {
  console.log('get deliveries', {
    schemeName,
    start,
    end
  })
  return db.delivery.findAll({
    where: {
      requested: {
        [db.Op.between]: [start, end]
      }
    },
    include: [
      {
        model: db.statement,
        as: 'statement',
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
