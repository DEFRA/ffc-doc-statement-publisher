const mockCommit = jest.fn()
const mockRollback = jest.fn()

const mockTransaction = jest.fn().mockImplementation(() => {
  return {
    commit: mockCommit,
    rollback: mockRollback
  }
})

const mockSequelize = {
  transaction: mockTransaction
}

jest.mock('../../../app/data', () => {
  return {
    sequelize: mockSequelize
  }
})

module.exports = {
  mockTransaction
}
