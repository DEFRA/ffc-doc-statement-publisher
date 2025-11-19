const comment = 'Example Output: Source: Documents Used on Statement? No, used by ffc-doc-statement-publisher to communicate with Notify'
const commentDate = 'Example Output:  2024-02-09 00:00:00 Source: Documents Used on Statement? No, used by ffc-doc-statement-publisher to communicate with Notify'

module.exports = (sequelize, DataTypes) => {
  const delivery = sequelize.define('delivery', {
    deliveryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment
    },
    statementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'statements',
        key: 'statementId'
      },
      index: true,
      comment
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
      comment
    },
    reference: {
      type: DataTypes.UUID,
      index: true,
      comment
    },
    requested: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true,
      comment: commentDate
    },
    completed: {
      type: DataTypes.DATE,
      index: true,
      comment: commentDate
    }
  }, {
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
