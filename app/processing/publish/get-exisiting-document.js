const db = require('../../data')

const getExistingDocument = async (documentReference) => {
  return db.statement.findOne({
    where: {
      [db.Sequelize.Op.and]: [{ documentReference }, {
        documentReference: {
          [db.Sequelize.Op.ne]: null
        }
      }]
    }
  })
}

module.exports = getExistingDocument
