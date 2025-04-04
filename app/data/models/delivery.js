module.exports = (sequelize, DataTypes) => {
  const delivery = sequelize.define('delivery', {
    deliveryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    statementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'statements',
        key: 'statementId'
      },
      index: true
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reference: {
      type: DataTypes.UUID,
      index: true
    },
    requested: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true
    },
    completed: {
      type: DataTypes.DATE,
      index: true
    }
  },
  {
    tableName: 'deliveries',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        name: 'idx_delivery_status',
        fields: ['completed', 'requested']
      }
    ]
  })

  delivery.associate = function (models) {
    delivery.belongsTo(models.statement, {
      foreignKey: 'statementId',
      as: 'statement',
      onDelete: 'CASCADE'
    })

    delivery.hasOne(models.failure, {
      foreignKey: 'deliveryId',
      as: 'failure'
    })
  }

  return delivery
}
