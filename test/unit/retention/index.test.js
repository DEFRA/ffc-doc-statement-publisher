jest.mock('../../../app/data', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}))

jest.mock('../../../app/retention/find-statements', () => ({
  findStatements: jest.fn()
}))

jest.mock('../../../app/retention/find-deliveries', () => ({
  findDeliveries: jest.fn()
}))

jest.mock('../../../app/retention/remove-failures', () => ({
  removeFailures: jest.fn()
}))

jest.mock('../../../app/retention/remove-deliveries', () => ({
  removeDeliveries: jest.fn()
}))

jest.mock('../../../app/retention/remove-statements', () => ({
  removeStatements: jest.fn()
}))

jest.mock('../../../app/storage', () => ({
  deleteStatement: jest.fn()
}))

const { findStatements } = require('../../../app/retention/find-statements')
const { findDeliveries } = require('../../../app/retention/find-deliveries')
const { removeFailures } = require('../../../app/retention/remove-failures')
const { removeDeliveries } = require('../../../app/retention/remove-deliveries')
const { removeStatements } = require('../../../app/retention/remove-statements')
const { deleteStatement } = require('../../../app/storage')
const db = require('../../../app/data')

const { removeAgreementData } = require('../../../app/retention')

describe('removeAgreementData', () => {
  const retentionData = {
    documentReference: 'DOC-REF-001',
    filename: 'statement-file.pdf'
  }

  let transaction

  beforeEach(() => {
    jest.clearAllMocks()
    transaction = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    }
    db.sequelize.transaction.mockResolvedValue(transaction)
  })

  test('commits and returns early if no statements found', async () => {
    findStatements.mockResolvedValue([])

    await removeAgreementData(retentionData)

    expect(db.sequelize.transaction).toHaveBeenCalledTimes(1)
    expect(findStatements).toHaveBeenCalledWith(
      retentionData.documentReference,
      retentionData.filename,
      transaction
    )
    expect(transaction.commit).toHaveBeenCalledTimes(1)
    expect(transaction.rollback).not.toHaveBeenCalled()

    expect(findDeliveries).not.toHaveBeenCalled()
    expect(removeFailures).not.toHaveBeenCalled()
    expect(removeDeliveries).not.toHaveBeenCalled()
    expect(removeStatements).not.toHaveBeenCalled()
    expect(deleteStatement).not.toHaveBeenCalled()
  })

  test('removes failures, deliveries, statements and deletes statement when statements found', async () => {
    const statements = [
      { statementId: 10 },
      { statementId: 20 }
    ]
    const deliveries = [
      { deliveryId: 100 },
      { deliveryId: 200 }
    ]

    findStatements.mockResolvedValue(statements)
    findDeliveries.mockResolvedValue(deliveries)
    removeFailures.mockResolvedValue()
    removeDeliveries.mockResolvedValue()
    removeStatements.mockResolvedValue()
    deleteStatement.mockResolvedValue()

    await removeAgreementData(retentionData)

    expect(db.sequelize.transaction).toHaveBeenCalledTimes(1)

    expect(findStatements).toHaveBeenCalledWith(
      retentionData.documentReference,
      retentionData.filename,
      transaction
    )

    const statementIds = statements.map(s => s.statementId)
    expect(findDeliveries).toHaveBeenCalledWith(statementIds, transaction)

    const deliveryIds = deliveries.map(d => d.deliveryId)
    expect(removeFailures).toHaveBeenCalledWith(deliveryIds, transaction)
    expect(removeDeliveries).toHaveBeenCalledWith(deliveryIds, transaction)
    expect(removeStatements).toHaveBeenCalledWith(statementIds, transaction)

    expect(deleteStatement).toHaveBeenCalledWith(retentionData.filename)

    expect(transaction.commit).toHaveBeenCalledTimes(1)
    expect(transaction.rollback).not.toHaveBeenCalled()
  })

  test('rolls back transaction and throws if an error occurs', async () => {
    const statements = [
      { statementId: 1 }
    ]
    findStatements.mockResolvedValue(statements)
    findDeliveries.mockResolvedValue([])
    removeFailures.mockResolvedValue()
    removeDeliveries.mockResolvedValue()

    const error = new Error('fail on removeStatements')
    removeStatements.mockRejectedValue(error)

    await expect(removeAgreementData(retentionData)).rejects.toThrow('fail on removeStatements')

    expect(transaction.rollback).toHaveBeenCalledTimes(1)
    expect(transaction.commit).not.toHaveBeenCalled()

    expect(deleteStatement).not.toHaveBeenCalled()
  })
})
