const fs = require('fs')
const path = require('path')
const { Sequelize, DataTypes, Op } = require('sequelize')
const config = require('../config')
const dbConfig = config.dbConfig[config.env]
const modelPath = path.join(__dirname, 'models')
const db = {}

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig)

fs.readdirSync(modelPath)
  .filter(file => {
    return (!file.startsWith('.')) && (file !== 'index.js') && (file.endsWith('.js'))
  })
  .forEach(file => {
    const model = require(path.join(modelPath, file))(sequelize, DataTypes)
    db[model.name] = model
  })

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize
db.Op = Op

module.exports = db
