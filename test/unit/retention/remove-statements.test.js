const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['statement'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { removeStatements } = require('../../../app/retention/remove-statements')

describe('removeStatements', () => {
  const statementIds = [10, 20, 30]
  const mockTransaction = mockDb.trx

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves(3)
  })

  test('deletes statements with statementId in the given list, including transaction', async () => {
    await removeStatements(statementIds, mockTransaction)

    expect(mockDb.tables.statement).toHaveBeenCalledTimes(1)
    expect(mockDb.tables.statement).toHaveBeenCalledWith(mockTransaction)
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('statementId', statementIds)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test('passes undefined transaction if not provided', async () => {
    mockDb.builder.resolves(0)

    await removeStatements(statementIds)

    expect(mockDb.tables.statement).toHaveBeenCalledWith(undefined)
  })

  test('propagates errors from the delete', async () => {
    const error = new Error('DB failure')
    mockDb.builder.rejects(error)

    await expect(removeStatements(statementIds, mockTransaction)).rejects.toThrow('DB failure')
  })
})
