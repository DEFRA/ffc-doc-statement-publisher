jest.mock('../../../app/data', () => ({
  messageClaim: {
    create: jest.fn(),
    update: jest.fn()
  }
}))

const db = require('../../../app/data')
const { claimMessage, markClaimStatus } = require('../../../app/messaging/message-claim-helpers')

describe('message-claim-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('claimMessage', () => {
    test('creates a processing claim and returns true when the insert succeeds', async () => {
      db.messageClaim.create.mockResolvedValue({})

      const result = await claimMessage('message-1', 'document-1')

      expect(db.messageClaim.create).toHaveBeenCalledWith({
        messageId: 'message-1',
        documentReference: 'document-1',
        status: 'processing'
      })
      expect(result).toBe(true)
    })

    test('returns false when the message has already been claimed', async () => {
      const error = new Error('duplicate')
      error.name = 'SequelizeUniqueConstraintError'
      db.messageClaim.create.mockRejectedValue(error)

      const result = await claimMessage('message-1', 'document-1')

      expect(result).toBe(false)
    })

    test('rethrows unexpected errors', async () => {
      const error = new Error('db exploded')
      db.messageClaim.create.mockRejectedValue(error)

      await expect(claimMessage('message-1', 'document-1')).rejects.toThrow('db exploded')
    })
  })

  describe('markClaimStatus', () => {
    test('updates the status for the supplied message id', async () => {
      await markClaimStatus('message-1', 'completed')

      expect(db.messageClaim.update).toHaveBeenCalledWith(
        { status: 'completed' },
        { where: { messageId: 'message-1' } }
      )
    })
  })
})
