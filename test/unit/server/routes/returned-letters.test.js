const mockConfig = {
  notifyCallbackBearerToken: 'test-secret-token',
  port: 3010,
  isDev: false
}

const setupMocks = () => {
  const mockCreate = jest.fn().mockResolvedValue({})

  jest.mock('../../../../app/data', () => ({
    returnedLetter: { create: mockCreate },
    sequelize: { literal: jest.fn().mockReturnValue('') }
  }))

  jest.mock('../../../../app/config', () => mockConfig)

  return { mockCreate }
}

describe('returned-letters route', () => {
  let route
  let mockCreate
  let mockH

  beforeEach(() => {
    ;({ mockCreate } = setupMocks())

    mockH = {
      response: jest.fn().mockReturnValue({ code: jest.fn().mockReturnThis() })
    }

    route = require('../../../../app/server/routes/returned-letters')
  })

  afterEach(() => {
    jest.resetModules()
  })

  test('exports an object', () => {
    expect(typeof route).toBe('object')
  })

  test('has correct method', () => {
    expect(route.method).toBe('POST')
  })

  test('has correct path', () => {
    expect(route.path).toBe('/notify/callback/returned-letters')
  })

  test('has auth disabled', () => {
    expect(route.options.auth).toBe(false)
  })

  test('has a handler function', () => {
    expect(typeof route.handler).toBe('function')
  })

  describe('handler', () => {
    const validPayload = {
      notification_id: 'Te5T1nG-t43-k3y1D-d035-1T5Th1n6',
      reference: 'a1b2c3d4-0000-0000-0000-000000000001',
      date_sent: '2026-08-18T10:00:00.000000Z',
      upload_letter_file_name: 'SFI_00000001_2023_statement.pdf'
    }

    test('returns 401 when Authorization header is missing', async () => {
      const mockResponse = { code: jest.fn().mockReturnThis() }
      mockH.response.mockReturnValue(mockResponse)

      await route.handler({ headers: {}, payload: validPayload }, mockH)

      expect(mockH.response).toHaveBeenCalledWith({ error: 'Unauthorized' })
      expect(mockResponse.code).toHaveBeenCalledWith(401)
    })

    test('returns 401 when bearer token is wrong', async () => {
      const mockResponse = { code: jest.fn().mockReturnThis() }
      mockH.response.mockReturnValue(mockResponse)

      await route.handler({ headers: { authorization: 'Bearer wrong-token' }, payload: validPayload }, mockH)

      expect(mockH.response).toHaveBeenCalledWith({ error: 'Unauthorized' })
      expect(mockResponse.code).toHaveBeenCalledWith(401)
    })

    test('saves returned letter and returns 200 on valid request', async () => {
      const mockResponse = { code: jest.fn().mockReturnThis() }
      mockH.response.mockReturnValue(mockResponse)

      await route.handler({ headers: { authorization: 'Bearer test-secret-token' }, payload: validPayload }, mockH)

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        notificationId: validPayload.notification_id,
        reference: validPayload.reference,
        dateSent: new Date(validPayload.date_sent)
      }))
      expect(mockCreate.mock.calls[0][0].receivedAt).toBeInstanceOf(Date)
      expect(mockResponse.code).toHaveBeenCalledWith(200)
    })

    test('saves null reference when not provided', async () => {
      const mockResponse = { code: jest.fn().mockReturnThis() }
      mockH.response.mockReturnValue(mockResponse)

      const payload = { ...validPayload, reference: null }
      await route.handler({ headers: { authorization: 'Bearer test-secret-token' }, payload }, mockH)

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ reference: null }))
    })

    test('returns 500 when db.create throws', async () => {
      const mockResponse = { code: jest.fn().mockReturnThis() }
      mockH.response.mockReturnValue(mockResponse)
      mockCreate.mockRejectedValue(new Error('DB error'))

      await route.handler({ headers: { authorization: 'Bearer test-secret-token' }, payload: validPayload }, mockH)

      expect(mockH.response).toHaveBeenCalledWith({ error: 'Internal server error' })
      expect(mockResponse.code).toHaveBeenCalledWith(500)
    })
  })
})

describe('returned-letters route via server.inject()', () => {
  const VALID_PAYLOAD = {
    notification_id: 'Te5T1nG-t43-k3y1D-d035-1T5Th1n6',
    reference: 'a1b2c3d4-0000-0000-0000-000000000001',
    date_sent: '2026-08-18T10:00:00.000000Z',
    upload_letter_file_name: 'SFI_00000001_2023_statement.pdf'
  }

  let server
  let mockCreate

  beforeEach(async () => {
    ;({ mockCreate } = setupMocks())
    const { createServer } = require('../../../../app/server/server')
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
    jest.resetModules()
  })

  test('returns 200 for a valid callback', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/notify/callback/returned-letters',
      headers: { authorization: 'Bearer test-secret-token' },
      payload: VALID_PAYLOAD
    })

    expect(response.statusCode).toBe(200)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      notificationId: VALID_PAYLOAD.notification_id,
      reference: VALID_PAYLOAD.reference
    }))
  })

  test('returns 401 for a missing Authorization header', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/notify/callback/returned-letters',
      payload: VALID_PAYLOAD
    })

    expect(response.statusCode).toBe(401)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  test('returns 401 for a wrong bearer token', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/notify/callback/returned-letters',
      headers: { authorization: 'Bearer wrong-token' },
      payload: VALID_PAYLOAD
    })

    expect(response.statusCode).toBe(401)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  test('route is not reachable with GET', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/notify/callback/returned-letters'
    })

    expect(response.statusCode).toBe(404)
  })
})
