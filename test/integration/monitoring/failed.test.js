const { mockMessageSender } = require('../../mocks/modules/ffc-messaging')

const db = require('../../../app/data')

const failed = require('../../../app/monitoring/failed')

const { EMPTY, INVALID, REJECTED } = require('../../../app/constants/failure-reasons')

const SYSTEM_TIME = require('../../mocks/components/system-time')

const { mockStatement1: statement } = require('../../mocks/statement')
const { mockDelivery1: delivery } = require('../../mocks/delivery')

let reason

describe('Notify failed to deliver', () => {
  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(SYSTEM_TIME)

    reason = INVALID

    await db.statement.create(statement)
    await db.delivery.create(delivery)
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await db.sequelize.truncate({ cascade: true })
  })

  afterAll(async () => {
    await db.sequelize.close()
  })

  describe('When reason is EMPTY', () => {
    beforeEach(async () => {
      reason = EMPTY
    })

    test('should not send message to CRM', async () => {
      await failed(delivery, { reason })

      expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
      expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
    })

    test('should update delivery completed date', async () => {
      const deliveryBefore = await db.delivery.findByPk(delivery.deliveryId)

      await failed(delivery, { reason })

      const deliveryAfter = await db.delivery.findByPk(delivery.deliveryId)
      expect(deliveryBefore.completed).toBeNull()
      expect(deliveryAfter.completed).toStrictEqual(SYSTEM_TIME)
    })

    test('should create one failure', async () => {
      await failed(delivery, { reason })

      const failures = await db.failure.findAll({ where: { deliveryId: delivery.deliveryId } })
      expect(failures.length).toBe(1)
    })

    test('should create failure with EMPTY reason', async () => {
      await failed(delivery, { reason })

      const failure = await db.failure.findOne({ where: { deliveryId: delivery.deliveryId } })
      expect(failure.reason).toBe(EMPTY)
    })

    test('should create failure with date', async () => {
      await failed(delivery, { reason })

      const failure = await db.failure.findOne({ where: { deliveryId: delivery.deliveryId } })
      expect(failure.failed).toStrictEqual(SYSTEM_TIME)
    })
  })

  describe('When reason is INVALID', () => {
    beforeEach(async () => {
      reason = INVALID
    })

    test('should not send message to CRM', async () => {
      await failed(delivery, { reason })

      expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
      expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
    })

    test('should update delivery completed date', async () => {
      const deliveryBefore = await db.delivery.findByPk(delivery.deliveryId)

      await failed(delivery, { reason })

      const deliveryAfter = await db.delivery.findByPk(delivery.deliveryId)
      expect(deliveryBefore.completed).toBeNull()
      expect(deliveryAfter.completed).toStrictEqual(SYSTEM_TIME)
    })

    test('should create one failure', async () => {
      await failed(delivery, { reason })

      const failures = await db.failure.findAll({ where: { deliveryId: delivery.deliveryId } })
      expect(failures.length).toBe(1)
    })

    test('should create failure with INVALID reason', async () => {
      await failed(delivery, { reason })

      const failure = await db.failure.findOne({ where: { deliveryId: delivery.deliveryId } })
      expect(failure.reason).toBe(INVALID)
    })

    test('should create failure with date', async () => {
      await failed(delivery, { reason })

      const failure = await db.failure.findOne({ where: { deliveryId: delivery.deliveryId } })
      expect(failure.failed).toStrictEqual(SYSTEM_TIME)
    })
  })

  describe('When reason is REJECTED', () => {
    beforeEach(async () => {
      reason = REJECTED
    })

    test('should not send message to CRM', async () => {
      await failed(delivery, { reason })

      expect(mockMessageSender().sendMessage).not.toHaveBeenCalled()
      expect(mockMessageSender().closeConnection).not.toHaveBeenCalled()
    })

    test('should update delivery completed date', async () => {
      const deliveryBefore = await db.delivery.findByPk(delivery.deliveryId)

      await failed(delivery, { reason })

      const deliveryAfter = await db.delivery.findByPk(delivery.deliveryId)
      expect(deliveryBefore.completed).toBeNull()
      expect(deliveryAfter.completed).toStrictEqual(SYSTEM_TIME)
    })

    test('should create one failure', async () => {
      await failed(delivery, { reason })

      const failures = await db.failure.findAll({ where: { deliveryId: delivery.deliveryId } })
      expect(failures.length).toBe(1)
    })

    test('should create failure with REJECTED reason', async () => {
      await failed(delivery, { reason })

      const failure = await db.failure.findOne({ where: { deliveryId: delivery.deliveryId } })
      expect(failure.reason).toBe(REJECTED)
    })

    test('should create failure with date', async () => {
      await failed(delivery, { reason })

      const failure = await db.failure.findOne({ where: { deliveryId: delivery.deliveryId } })
      expect(failure.failed).toStrictEqual(SYSTEM_TIME)
    })
  })
})
