const { removeStatements } = require('../../../app/retention/remove-statements')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  Sequelize: {
    Op: {
      in: 'IN_OPERATOR'
    }
  },
  statement: {
    destroy: jest.fn()
  }
}))

describe('removeStatements', () => {
  const statementIds = [10, 20, 30]
  const mockTransaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.statement.destroy with correct parameters including transaction', async () => {
    db.statement.destroy.mockResolvedValue(3) // optional: number of rows deleted

    await removeStatements(statementIds, mockTransaction)

    expect(db.statement.destroy).toHaveBeenCalledTimes(1)
    expect(db.statement.destroy).toHaveBeenCalledWith({
      where: {
        statementId: { [db.Sequelize.Op.in]: statementIds }
      },
      transaction: mockTransaction
    })
  })

  test('passes undefined transaction if not provided', async () => {
    db.statement.destroy.mockResolvedValue(0)

    await removeStatements(statementIds)

    expect(db.statement.destroy).toHaveBeenCalledWith({
      where: {
        statementId: { [db.Sequelize.Op.in]: statementIds }
      },
      transaction: undefined
    })
  })

  test('propagates errors from db.statement.destroy', async () => {
    const error = new Error('DB failure')
    db.statement.destroy.mockRejectedValue(error)

    await expect(removeStatements(statementIds, mockTransaction)).rejects.toThrow('DB failure')
  })
})
