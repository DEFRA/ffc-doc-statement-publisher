const { createKnexMock, createQueryBuilder } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['messageClaim'])

jest.mock('../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const mockSendAlert = jest.fn()
jest.mock('../../../app/alert', () => ({ sendAlert: mockSendAlert }))

const { claimMessage, markClaimStatus, getClaimStatus } = require('../../../app/messaging/message-claim-helpers')

const UNIQUE_VIOLATION = '23505'

describe('message-claim-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendAlert.mockResolvedValue()
    mockDb.builder.resolves()
  })

  describe('claimMessage', () => {
    test('creates a processing claim and returns true when the insert succeeds', async () => {
      mockDb.builder.resolves({})

      const result = await claimMessage('message-1', 'document-1')

      expect(mockDb.builder.insert).toHaveBeenCalledWith({
        messageId: 'message-1',
        documentReference: 'document-1',
        status: 'processing'
      })
      expect(result).toBe(true)
    })

    test('returns false when a recent duplicate is found', async () => {
      const error = new Error('duplicate')
      error.code = UNIQUE_VIOLATION
      const insertBuilder = createQueryBuilder().rejects(error)
      const selectBuilder = createQueryBuilder().resolves({ status: 'processing', updatedAt: new Date() })
      mockDb.tables.messageClaim
        .mockReturnValueOnce(insertBuilder)
        .mockReturnValueOnce(selectBuilder)

      const result = await claimMessage('message-1', 'document-1')

      expect(result).toBe(false)
    })

    test('returns true and reclaims when the existing claim is stale (> 5 minutes) and status is processing', async () => {
      const error = new Error('duplicate')
      error.code = UNIQUE_VIOLATION
      const staleDate = new Date(Date.now() - 6 * 60 * 1000)
      const insertBuilder = createQueryBuilder().rejects(error)
      const selectBuilder = createQueryBuilder().resolves({ status: 'processing', updatedAt: staleDate })
      const updateBuilder = createQueryBuilder().resolves({})
      mockDb.tables.messageClaim
        .mockReturnValueOnce(insertBuilder)
        .mockReturnValueOnce(selectBuilder)
        .mockReturnValueOnce(updateBuilder)

      const result = await claimMessage('message-1', 'document-1')

      expect(updateBuilder.where).toHaveBeenCalledWith({ messageId: 'message-1' })
      expect(updateBuilder.update).toHaveBeenCalledWith(
        { status: 'processing', updatedAt: expect.any(Date) }
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
      error.code = UNIQUE_VIOLATION
      const staleDate = new Date(Date.now() - 6 * 60 * 1000)
      const insertBuilder = createQueryBuilder().rejects(error)
      const selectBuilder = createQueryBuilder().resolves({ status, updatedAt: staleDate })
      mockDb.tables.messageClaim
        .mockReturnValueOnce(insertBuilder)
        .mockReturnValueOnce(selectBuilder)

      const result = await claimMessage('message-1', 'document-1')

      expect(selectBuilder.update).not.toHaveBeenCalled()
      expect(mockSendAlert).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    test('returns false when no existing claim is found after constraint error', async () => {
      const error = new Error('duplicate')
      error.code = UNIQUE_VIOLATION
      const insertBuilder = createQueryBuilder().rejects(error)
      const selectBuilder = createQueryBuilder().resolves(undefined)
      mockDb.tables.messageClaim
        .mockReturnValueOnce(insertBuilder)
        .mockReturnValueOnce(selectBuilder)

      const result = await claimMessage('message-1', 'document-1')

      expect(result).toBe(false)
    })

    test('rethrows unexpected errors', async () => {
      const error = new Error('db exploded')
      mockDb.builder.rejects(error)

      await expect(claimMessage('message-1', 'document-1')).rejects.toThrow('db exploded')
    })
  })

  describe('markClaimStatus', () => {
    test('updates the status and updatedAt for the supplied message id', async () => {
      await markClaimStatus('message-1', 'completed')

      expect(mockDb.builder.where).toHaveBeenCalledWith({ messageId: 'message-1' })
      expect(mockDb.builder.update).toHaveBeenCalledWith(
        { status: 'completed', updatedAt: expect.any(Date) }
      )
    })
  })

  describe('getClaimStatus', () => {
    test('returns the status of an existing claim', async () => {
      mockDb.builder.resolves({ status: 'completed' })

      const result = await getClaimStatus('message-1')

      expect(mockDb.builder.where).toHaveBeenCalledWith({ messageId: 'message-1' })
      expect(result).toBe('completed')
    })

    test('returns null when no claim exists', async () => {
      mockDb.builder.resolves(undefined)

      const result = await getClaimStatus('message-1')

      expect(result).toBeNull()
    })
  })
})
