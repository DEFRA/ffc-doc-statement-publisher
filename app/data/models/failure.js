const comment = "Example Output: Source: Documents Used on Statement? No, used to build and populate the Payment Statement Status Report"
const commentDate = "Example Output:  2024-02-09 00:00:00 Source: Documents Used on Statement? No, used to build and populate the Payment Statement Status Report"

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
   * @param {DATE}        failed when the failure occured
   */
  const failure = sequelize.define('failure', {
    failureId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, comment },
    deliveryId: { type: DataTypes.INTEGER, comment },
    statusCode: { type: DataTypes.INTEGER, comment },
    reason: { type: DataTypes.STRING, comment },
    error: { type: DataTypes.STRING, comment },
    message: { type: DataTypes.STRING, comment },
    failed: { type: DataTypes.DATE, comment, commentDate }
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
