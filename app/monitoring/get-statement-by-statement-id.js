const db = require('../data')

const getStatementByStatementId = async (statementId, transaction) => {
  return db.statement.findOne({ where: { statementId }, transaction })
}

module.exports = getStatementByStatementId
