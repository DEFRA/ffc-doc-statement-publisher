const config = require('../config')
const { Database } = require('ffc-database')

const dbConfig = config.dbConfig[config.env]

const tables = {
  delivery: 'deliveries',
  failure: 'failures',
  messageClaim: 'messageClaims',
  metric: 'metrics',
  report: 'reports',
  requests: 'requests',
  returnedLetter: 'returned_letters',
  statement: 'statements'
}

const database = new Database({ ...dbConfig, tables })

module.exports = database.connect()
