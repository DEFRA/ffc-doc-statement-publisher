const mockCommit = jest.fn()
const mockRollback = jest.fn()

const mockTransaction = jest.fn().mockImplementation(() => {
  return {
    commit: mockCommit,
    rollback: mockRollback
  }
})

jest.mock('../../../app/data', () => {
  return {
    transaction: mockTransaction
  }
})

module.exports = {
  mockTransaction
}
