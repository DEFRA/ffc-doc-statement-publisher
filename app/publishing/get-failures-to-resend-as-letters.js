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
      [db.Sequelize.col('delivery.statement.email'), 'email'],
      [db.Sequelize.col('delivery.statement.statementId'), 'statementId'],
      [db.Sequelize.col('delivery.statement.filename'), 'filename'],
      [db.Sequelize.col('delivery.statement.businessName'), 'businessName'],
      [db.Sequelize.col('delivery.statement.frn'), 'frn'],
      [db.Sequelize.col('delivery.statement.sbi'), 'sbi'],
      [db.Sequelize.col('delivery.statement.addressLine1'), 'addressLine1'],
      [db.Sequelize.col('delivery.statement.addressLine2'), 'addressLine2'],
      [db.Sequelize.col('delivery.statement.addressLine3'), 'addressLine3'],
      [db.Sequelize.col('delivery.statement.addressLine4'), 'addressLine4'],
      [db.Sequelize.col('delivery.statement.addressLine5'), 'addressLine5'],
      [db.Sequelize.col('delivery.statement.postcode'), 'postcode'],
      [db.Sequelize.col('delivery.statement.schemeName'), 'schemeName'],
      [db.Sequelize.col('delivery.statement.schemeShortName'), 'schemeShortName'],
      [db.Sequelize.col('delivery.statement.schemeYear'), 'schemeYear'],
      [db.Sequelize.col('delivery.statement.schemeFrequency'), 'schemeFrequency'],
      [db.Sequelize.col('delivery.statement.documentReference'), 'documentReference'],
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