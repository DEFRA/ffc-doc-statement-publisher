const config = require('../config')
const { Database } = require('ffc-database')
const TABLES = require('../constants/tables')

const dbConfig = config.dbConfig[config.env]

const database = new Database({ ...dbConfig, tables: TABLES })

module.exports = database.connect()
