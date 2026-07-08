const messageClaimModel = (sequelize, DataTypes) => {
  const messageClaim = sequelize.define('messageClaim', {
    messageClaimId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    documentReference: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'messageClaims',
    freezeTableName: true,
    timestamps: false
  })

  return messageClaim
}

module.exports = messageClaimModel
