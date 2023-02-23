module.exports = (sequelize, DataTypes) => {
  const failure = sequelize.define('failure', {
    deliveryId: { type: DataTypes.INTEGER, primaryKey: true },
    reason: DataTypes.STRING,
    failed: DataTypes.DATE
  },
  {
    tableName: 'failures',
    freezeTableName: true,
    timestamps: false
  })
  failure.associate = function (models) {
    failure.belongsTo(models.delivery, {
      foreignKey: 'deliveryId',
      as: 'delivery'
    })
  }
  return failure
}
