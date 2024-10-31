module.exports = (sequelize, DataTypes) => {
  /**
   * Please see https://docs.notifications.service.gov.uk/node.html#send-an-email-error-codes for
   * more details about Notify error codes
   *
   * @param {INTEGER}     failureId
   * @param {INTEGER}     deliveryId Foreign key of the delivery table
   * @param {INTEGER}     statusCode Returned from Notify err.response.data.status_code, 400; 403; 429; 500;
   * @param {STRING}      reason Failure reason from local application validator; Empty or invalid email
   * @param {STRING}      error as returned from Notify
   * @param {STRING}      message as returned from Notify
   * @param {TIMESTAMP}   when the failure occured
   */
  const failure = sequelize.define('failure', {
    failureId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    deliveryId: DataTypes.INTEGER,
    statusCode: DataTypes.INTEGER,
    reason: DataTypes.STRING,
    error: DataTypes.STRING,
    message: DataTypes.STRING,
    failed: DataTypes.TIMESTAMP
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
