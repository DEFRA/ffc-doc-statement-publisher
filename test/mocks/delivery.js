const { EMAIL } = require('../../app/constants/methods')

const mockDelivery1 = {
  deliveryId: 98,
  statementId: 1,
  reference: '88363cba-2093-4447-8812-697c09820617',
  method: EMAIL,
  requested: new Date(2022, 7, 5, 15, 30, 10, 120),
  completed: null
}

const mockDelivery2 = {
  deliveryId: 99,
  statementId: 2,
  reference: '88363cba-2093-4447-8812-697c09820617',
  method: EMAIL,
  requested: new Date(2022, 7, 5, 15, 30, 10, 120),
  completed: new Date(2022, 7, 5, 15, 30, 10, 120)
}

module.exports = {
  mockDelivery1,
  mockDelivery2
}
