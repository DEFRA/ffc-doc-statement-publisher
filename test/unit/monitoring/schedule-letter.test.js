const { LETTER } = require('../../../app/constants/methods')
const db = require('../../../app/data')
const getStatementFileUrl = require('../../../app/publishing/get-statement-file-url')
const publish = require('../../../app/publishing/publish')
const isDpSchema = require('../../../app/publishing/is-dp-scheme')
const scheduleLetter = require('../../../app/monitoring/schedule-letter')

jest.mock('../../../app/data', () => ({
  sequelize: {
    transaction: jest.fn()
  },
  statement: {
    findOne: jest.fn()
  },
  delivery: {
    create: jest.fn(),
    update: jest.fn()
  }
}))

jest.mock('../../../app/publishing/get-statement-file-url')
jest.mock('../../../app/publishing/publish')
jest.mock('../../../app/publishing/is-dp-scheme')

describe('scheduleLetter', () => {
  let transaction

  beforeEach(() => {
    jest.clearAllMocks()
    transaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    }
    db.sequelize.transaction.mockResolvedValue(transaction)
  })

  test('should schedule a letter if the statement is DP schema', async () => {
    const delivery = { statementId: '123', method: 'email', deliveryId: '456' }
    const statement = { statementId: '123', schemeShortName: 'DP', filename: 'file.pdf', emailTemplate: 'template', email: 'test@example.com' }
    const response = { data: { id: '789' } }

    db.statement.findOne.mockResolvedValue(statement)
    isDpSchema.mockReturnValue(true)
    getStatementFileUrl.mockReturnValue('file-url')
    publish.mockResolvedValue(response)

    await scheduleLetter(delivery)

    expect(db.statement.findOne).toHaveBeenCalledWith({ where: { statementId: delivery.statementId }, transaction })
    expect(isDpSchema).toHaveBeenCalledWith(statement.schemeShortName)
    expect(getStatementFileUrl).toHaveBeenCalledWith(statement.filename)
    expect(publish).toHaveBeenCalledWith(statement.emailTemplate, statement.email, 'file-url', null, LETTER)
    expect(db.delivery.create).toHaveBeenCalledWith({
      statementId: delivery.statementId,
      method: delivery.method,
      reference: response.data.id,
      requested: expect.any(Date)
    }, { transaction })
    expect(db.delivery.update).toHaveBeenCalledWith({
      completed: expect.any(Date)
    }, { where: { deliveryId: delivery.deliveryId }, transaction })
    expect(transaction.commit).toHaveBeenCalled()
  })

  test('should not schedule a letter if the statement is not DP schema', async () => {
    const delivery = { statementId: '123', method: 'email', deliveryId: '456' }
    const statement = { statementId: '123', schemeShortName: 'Non-DP' }

    db.statement.findOne.mockResolvedValue(statement)
    isDpSchema.mockReturnValue(false)

    await scheduleLetter(delivery)

    expect(db.statement.findOne).toHaveBeenCalledWith({ where: { statementId: delivery.statementId }, transaction })
    expect(isDpSchema).toHaveBeenCalledWith(statement.schemeShortName)
    expect(db.delivery.create).not.toHaveBeenCalled()
    expect(db.delivery.update).not.toHaveBeenCalled()
    expect(transaction.commit).toHaveBeenCalled()
  })

  test('should rollback transaction on error', async () => {
    const delivery = { statementId: '123', method: 'email', deliveryId: '456' }
    db.statement.findOne.mockRejectedValue(new Error('Test error'))

    await expect(scheduleLetter(delivery)).rejects.toThrow('Test error')

    expect(transaction.rollback).toHaveBeenCalled()
  })
})
