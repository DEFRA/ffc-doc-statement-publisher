const { findStatements } = require('../../../app/retention/find-statements')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  statement: {
    findAll: jest.fn()
  }
}))

describe('findStatements', () => {
  const documentReference = 'DOC-REF-123'
  const filename = 'statement-file.pdf'
  const mockTransaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.statement.findAll with correct parameters including transaction', async () => {
    const mockResult = [
      { statementId: 1 },
      { statementId: 2 }
    ]
    db.statement.findAll.mockResolvedValue(mockResult)

    const result = await findStatements(documentReference, filename, mockTransaction)

    expect(db.statement.findAll).toHaveBeenCalledTimes(1)
    expect(db.statement.findAll).toHaveBeenCalledWith({
      attributes: ['statementId'],
      where: { documentReference, filename },
      transaction: mockTransaction
    })
    expect(result).toBe(mockResult)
  })

  test('passes undefined transaction if not provided', async () => {
    const mockResult = []
    db.statement.findAll.mockResolvedValue(mockResult)

    const result = await findStatements(documentReference, filename)

    expect(db.statement.findAll).toHaveBeenCalledWith({
      attributes: ['statementId'],
      where: { documentReference, filename },
      transaction: undefined
    })
    expect(result).toBe(mockResult)
  })

  test('propagates errors from db.statement.findAll', async () => {
    const error = new Error('DB failure')
    db.statement.findAll.mockRejectedValue(error)

    await expect(findStatements(documentReference, filename, mockTransaction)).rejects.toThrow('DB failure')
  })
})
