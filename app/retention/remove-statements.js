const db = require('../data')

const removeStatements = async (statementIds, transaction) => {
  await db.statement.destroy({
    where: {
      statementId: { [db.Sequelize.Op.in]: statementIds }
    },
    transaction
  })
}

module.exports = {
  removeStatements
}
