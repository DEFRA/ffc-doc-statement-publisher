jest.mock('../../../app/data', () => ({
  messageClaim: {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  }
}))

const mockSendAlert = jest.fn()
jest.mock('../../../app/alert', () => ({ sendAlert: mockSendAlert }))

const db = require('../../../app/data')
const { claimMessage, markClaimStatus } = require('../../../app/messaging/message-claim-helpers')

describe('message-claim-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendAlert.mockResolvedValue()
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

    test('returns false when a recent duplicate is found', async () => {
      const error = new Error('duplicate')
      error.name = 'SequelizeUniqueConstraintError'
      db.messageClaim.create.mockRejectedValue(error)
      db.messageClaim.findOne.mockResolvedValue({ updatedAt: new Date() })

      const result = await claimMessage('message-1', 'document-1')

      expect(result).toBe(false)
    })

    test('returns true and reclaims when the existing claim is stale (> 5 minutes) and status is processing', async () => {
      const error = new Error('duplicate')
      error.name = 'SequelizeUniqueConstraintError'
      db.messageClaim.create.mockRejectedValue(error)
      const staleDate = new Date(Date.now() - 6 * 60 * 1000)
      db.messageClaim.findOne.mockResolvedValue({ status: 'processing', updatedAt: staleDate })
      db.messageClaim.update.mockResolvedValue({})

      const result = await claimMessage('message-1', 'document-1')

      expect(db.messageClaim.update).toHaveBeenCalledWith(
        { status: 'processing', updatedAt: expect.any(Date) },
        { where: { messageId: 'message-1' } }
      )
      expect(mockSendAlert).toHaveBeenCalledWith(
        'message claim',
        expect.any(Error),
        expect.stringContaining('Stale message claim reclaimed')
      )
      expect(result).toBe(true)
    })

    test.each(['failed', 'completed'])('returns false when stale claim has status %s', async (status) => {
      const error = new Error('duplicate')
      error.name = 'SequelizeUniqueConstraintError'
      db.messageClaim.create.mockRejectedValue(error)
      const staleDate = new Date(Date.now() - 6 * 60 * 1000)
      db.messageClaim.findOne.mockResolvedValue({ status, updatedAt: staleDate })

      const result = await claimMessage('message-1', 'document-1')

      expect(db.messageClaim.update).not.toHaveBeenCalled()
      expect(mockSendAlert).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    test('returns false when no existing claim is found after constraint error', async () => {
      const error = new Error('duplicate')
      error.name = 'SequelizeUniqueConstraintError'
      db.messageClaim.create.mockRejectedValue(error)
      db.messageClaim.findOne.mockResolvedValue(null)

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
    test('updates the status and updatedAt for the supplied message id', async () => {
      await markClaimStatus('message-1', 'completed')

      expect(db.messageClaim.update).toHaveBeenCalledWith(
        { status: 'completed', updatedAt: expect.any(Date) },
        { where: { messageId: 'message-1' } }
      )
    })
  })
})
