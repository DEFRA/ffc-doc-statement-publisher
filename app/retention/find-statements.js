const db = require('../data')

const findStatements = async (documentReference, filename, transaction) => {
  return db.statement.findAll({
    attributes: ['statementId'],
    where: { documentReference, filename },
    transaction
  })
}

module.exports = {
  findStatements
}
