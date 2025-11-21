module.exports = (sequelize, DataTypes) => {
  const statement = sequelize.define('statement', {
    statementId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, comment: 'History of statements and related customer data' },
    businessName: DataTypes.STRING,
    sbi: DataTypes.INTEGER,
    frn: DataTypes.BIGINT,
    addressLine1: DataTypes.STRING,
    addressLine2: DataTypes.STRING,
    addressLine3: DataTypes.STRING,
    addressLine4: DataTypes.STRING,
    addressLine5: DataTypes.STRING,
    postcode: DataTypes.STRING,
    email: DataTypes.STRING,
    filename: DataTypes.STRING,
    schemeName: DataTypes.STRING,
    schemeShortName: DataTypes.STRING,
    schemeYear: DataTypes.STRING,
    schemeFrequency: DataTypes.STRING,
    received: DataTypes.DATE,
    documentReference: DataTypes.INTEGER,
    emailTemplate: DataTypes.STRING,
    paymentReference: DataTypes.STRING
  },
  {
    tableName: 'statements',
    freezeTableName: true,
    timestamps: false
  })
  statement.associate = function (models) {
    statement.hasMany(models.delivery, {
      foreignKey: 'statementId',
      as: 'deliveries'
    })
  }
  return statement
}
