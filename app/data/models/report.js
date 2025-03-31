module.exports = (sequelize, DataTypes) => {
  const report = sequelize.define('report', {
    reportId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    lastDeliveryId: DataTypes.INTEGER,
    schemeName: DataTypes.STRING,
    reportStartDate: DataTypes.DATE,
    reportEndDate: DataTypes.DATE,
    requested: DataTypes.DATE,
    sent: DataTypes.DATE
  },
  {
    tableName: 'reports',
    freezeTableName: true,
    timestamps: false
  })
  return report
}
