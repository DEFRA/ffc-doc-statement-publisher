module.exports = (sequelize, DataTypes) => {
  const delivery = sequelize.define('delivery', {
    deliveryId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    statementId: DataTypes.INTEGER,
    method: DataTypes.STRING,
    reference: DataTypes.UUID,
    requested: DataTypes.DATE,
    completed: DataTypes.DATE
  },
  {
    tableName: 'deliveries',
    freezeTableName: true,
    timestamps: false
  })
  delivery.associate = function (models) {
    delivery.belongsTo(models.statement, {
      foreignKey: 'statementId',
      as: 'statement'
    })
    delivery.hasOne(models.failure, {
      foreignKey: 'deliveryId',
      as: 'failure'
    })
  }
  return delivery
}
