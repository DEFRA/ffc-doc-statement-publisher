const { statement } = require('../database')

const findStatements = async (documentReference, filename, transaction) => {
  return statement(transaction ?? undefined)
    .select('statementId')
    .where({ documentReference, filename })
}

module.exports = {
  findStatements
}
