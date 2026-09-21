const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['statement'])

jest.mock('../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { findStatements } = require('../../../app/retention/find-statements')

describe('findStatements', () => {
  const documentReference = 'DOC-REF-123'
  const filename = 'statement-file.pdf'
  const mockTransaction = mockDb.trx

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('selects statementId matching documentReference and filename, including transaction', async () => {
    const mockResult = [
      { statementId: 1 },
      { statementId: 2 }
    ]
    mockDb.builder.resolves(mockResult)

    const result = await findStatements(documentReference, filename, mockTransaction)

    expect(mockDb.tables.statement).toHaveBeenCalledTimes(1)
    expect(mockDb.tables.statement).toHaveBeenCalledWith(mockTransaction)
    expect(mockDb.builder.select).toHaveBeenCalledWith('statementId')
    expect(mockDb.builder.where).toHaveBeenCalledWith({ documentReference, filename })
    expect(result).toBe(mockResult)
  })

  test('passes undefined transaction if not provided', async () => {
    const mockResult = []
    mockDb.builder.resolves(mockResult)

    const result = await findStatements(documentReference, filename)

    expect(mockDb.tables.statement).toHaveBeenCalledWith(undefined)
    expect(result).toBe(mockResult)
  })

  test('propagates errors from the query', async () => {
    const error = new Error('DB failure')
    mockDb.builder.rejects(error)

    await expect(findStatements(documentReference, filename, mockTransaction)).rejects.toThrow('DB failure')
  })
})
