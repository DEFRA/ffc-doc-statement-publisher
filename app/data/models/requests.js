const requestModel = (sequelize, DataTypes) => {
  const requests = sequelize.define('requests', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    username: DataTypes.STRING,
    searchTerms: DataTypes.JSONB,
    type: DataTypes.STRING,
    timestamp: DataTypes.DATE
  }, {
    timestamps: false
  })
  return requests
}

module.exports = requestModel
