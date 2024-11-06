const db = require('../data')
const { publishingConfig } = require('../config')
const failureReasons = require('../constants/failure-reasons')

const getFailuresToResendAsLetters = async (transaction) => {
  return db.failures.findAll({
    lock: true,
    skipLocked: true,
    limit: publishingConfig.dataPublishingMaxBatchSizePerDataSource,
    where: {
      [db.Sequelize.Op.and]: [
        {
          dateResent: null
        },
        { 
          reason: { [db.Sequelize.Op.or]: Object.values(failureReasons) } 
        }
      ]
    },
    attributes: [
      'failureId',
      'deliveryId',
      'statusCode',
      'reason',
      'error',
      'message',
      'failed',
      'dateResent',
      'updated',
      [db.Sequelize.col('delivery.statement.statementId'), 'statementId'],
      [db.Sequelize.col('delivery.statement.filename'), 'filename']
      //TODO get other attributes from statement that are needed for message
    ],
    include: [
      {
        model: db.delivery,
        as: 'delivery',
        attributes: [],
        include: [
          {
            model: db.statement,
            as: 'statement',
            attributes: []
          }
        ]
      }
    ],
    raw: true,
    transaction
  });  
  }
  
  module.exports = getFailuresToResendAsLetters