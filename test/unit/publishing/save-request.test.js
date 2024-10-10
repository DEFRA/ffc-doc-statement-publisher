const mockRequest = require('../../mocks/request')
const sendCrmMessage = require('../../../app/messaging/send-crm-message')
const { mockTransaction } = require('../../mocks/objects/data')
const mockStatement = require('../../mocks/statement')
const saveRequest = require('../../../app/publishing/save-request')
const saveDelivery = require('../../../app/publishing/save-delivery')

jest.mock('../../../app/publishing/save-statement')
jest.mock('../../../app/publishing/save-delivery')
jest.mock('../../../app/messaging/send-crm-message')
jest.mock('../../../app/monitoring/create-failure')

const saveStatement = require('../../../app/publishing/save-statement')
const db = require('../../../app/data')
const createFailure = require('../../../app/monitoring/create-failure')
const mockDelivery = {
    deliveryId: 1
}
saveStatement.mockImplementation(async () => { return mockStatement.mockStatement1 })
saveDelivery.mockImplementation(async () => { return mockDelivery })

db.delivery = {
    create: jest.fn()
}

describe('save-request', () => {
    beforeAll(() => {
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date(2024, 8, 5, 0, 0, 0))
    })
    it('should save the request failure', () => {
        const mockReference = '1'
        const mockMethod = 'EMAIL'
        const mockErrorObject = {
            reason: 'Publish fail reason Internal server error not recognised',
            statusCode: '500',
            error: 'Exception',
            message: 'Internal server error'
        }
        const { mockStatement1 } = mockStatement
        saveRequest(mockRequest, mockReference , mockMethod, mockErrorObject).then(response => {
            expect(saveStatement).toHaveBeenCalledTimes(1)
            expect(saveStatement).toHaveBeenCalledWith(
                mockRequest,
                new Date(2024, 8, 5, 0, 0, 0),
                mockTransaction()
            )
            expect(saveDelivery).toHaveBeenCalledTimes(1)
            expect(saveDelivery).toHaveBeenCalledWith(
                mockStatement1.statementId,
                mockMethod,
                mockReference,
                new Date(2024, 8, 5, 0, 0, 0),
                mockTransaction()
            )
            expect(sendCrmMessage).toHaveBeenCalledTimes(1)
            expect(sendCrmMessage).toHaveBeenCalledWith(
                mockStatement1.email, 
                mockStatement1.frn,
                mockErrorObject.reason
            )
            expect(createFailure).toHaveBeenCalledTimes(1)
            expect(createFailure).toHaveBeenCalledWith(
                mockDelivery.deliveryId,
                mockErrorObject,
                new Date(2024, 8, 5, 0, 0, 0),
                mockTransaction()
            )
            expect(mockTransaction().commit).toHaveBeenCalledTimes(1)
        })
    })
})