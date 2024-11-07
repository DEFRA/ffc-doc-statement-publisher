const db = require('../data')

const getPrimaryKeyValue = (object, type) => {
  return object[db[type].primaryKeyAttributes[0]]
}

module.exports = getPrimaryKeyValue
