const getStatementRequestObject = require('../../../app/publishing/get-statement-request-object')

describe('getStatementRequestObject', () => {
  test('should transform statement object correctly', () => {
    const statement = {
      addressLine1: '123 Test St',
      addressLine2: 'Suite 100',
      schemeName: 'Test Scheme',
      schemeYear: '2024',
      otherField: 'Other Value'
    }

    const expectedRequest = {
      address: {
        line1: '123 Test St',
        line2: 'Suite 100'
      },
      scheme: {
        name: 'Test Scheme',
        year: '2024'
      },
      otherField: 'Other Value'
    }

    const result = getStatementRequestObject(statement)

    expect(result).toEqual(expectedRequest)
  })

  test('should handle empty statement object', () => {
    const statement = {}

    const expectedRequest = {
      address: {},
      scheme: {}
    }

    const result = getStatementRequestObject(statement)

    expect(result).toEqual(expectedRequest)
  })
})
