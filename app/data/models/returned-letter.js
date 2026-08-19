const returnedLetterModel = (sequelize, DataTypes) => {
  const returnedLetter = sequelize.define('returnedLetter', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    notificationId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    reference: {
      type: DataTypes.STRING,
      index: true
    },
    dateSent: {
      type: DataTypes.DATE
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'returned_letters',
    timestamps: false
  })

  return returnedLetter
}

module.exports = returnedLetterModel
