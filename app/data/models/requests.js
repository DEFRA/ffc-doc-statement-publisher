module.exports = (sequelize, DataTypes) => {
  const requests = sequelize.define('requests', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    username: DataTypes.STRING,
    filename: DataTypes.STRING,
    type: DataTypes.STRING,
    timestamp: DataTypes.DATE
  }, {
    timestamps: false
  })
  return requests
}
